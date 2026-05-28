"""
RAG Loader — Handles the "Load" phase of the ETL pipeline.

Responsibilities:
  1. Upsert normalized JSON payloads into Supabase `rag_documents` table
  2. Generate embedding-friendly text from each document
  3. Embed the text using Google's embedding model
  4. Insert embeddings into `rag_document_embeddings` table
  5. Rate limiting and retry logic (reuses patterns from vectorize.py)
"""

import os
import sys
import time
import json

sys.stdout.reconfigure(encoding='utf-8')

from supabase import create_client
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

from normalizer import payload_to_embedding_text

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

# Free-tier limits: 15 RPM / 1,500 RPD
RATE_LIMIT_DELAY_SECONDS = 4.5
RETRY_PAUSE_SECONDS = 60
MAX_RETRIES = 5

# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------
supabase = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

embeddings_model = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def format_eta(seconds: float) -> str:
    """Convert raw seconds into human-readable HH:MM:SS string."""
    seconds = max(0, int(seconds))
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}h {m:02d}m {s:02d}s"
    elif m > 0:
        return f"{m}m {s:02d}s"
    return f"{s}s"


def embed_with_retry(text: str, doc_index: int, total: int) -> list[float] | None:
    """
    Embed a single text string with retry logic for rate limits.
    Returns None if all attempts fail.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return embeddings_model.embed_query(text)
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                if attempt < MAX_RETRIES:
                    print(
                        f"\n  ⚠️  Rate limit hit on doc {doc_index}/{total} "
                        f"(attempt {attempt}/{MAX_RETRIES}). "
                        f"Pausing {RETRY_PAUSE_SECONDS}s..."
                    )
                    time.sleep(RETRY_PAUSE_SECONDS)
                else:
                    print(f"\n  ❌ Giving up on doc {doc_index}/{total} after {MAX_RETRIES} attempts.")
                    return None
            else:
                print(f"\n  ❌ Unexpected error on doc {doc_index}/{total}: {e}")
                return None
    return None


# ---------------------------------------------------------------------------
# Core loader functions
# ---------------------------------------------------------------------------
def load_documents(documents: list[dict], dry_run: bool = False, skip_embeddings: bool = False) -> dict:
    """
    Load normalized documents into Supabase.

    Args:
        documents: List of normalized document dicts (output of normalizer.normalize_document)
        dry_run: If True, validate and print without writing to Supabase
        skip_embeddings: If True, insert documents but skip embedding generation

    Returns:
        Summary dict with counts of inserted, skipped, failed documents
    """
    total = len(documents)
    print(f"\n{'='*60}")
    print(f"  RAG Loader — {total} documents to process")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"  Embeddings: {'SKIP' if skip_embeddings else 'GENERATE'}")
    print(f"{'='*60}\n")

    if dry_run:
        return _dry_run(documents)

    # Check which documents already exist
    existing = _get_existing_document_ids()
    print(f"  📊 {len(existing)} documents already in database.\n")

    stats = {"inserted": 0, "skipped": 0, "failed": 0, "embedded": 0, "embed_failed": 0}
    start_time = time.time()

    for idx, doc in enumerate(documents, start=1):
        doc_id = doc["document_id"]

        # Progress display
        elapsed = time.time() - start_time
        if idx > 1:
            avg = elapsed / (idx - 1)
            eta_str = format_eta(avg * (total - idx + 1))
        else:
            eta_str = "calculating..."

        # Skip if already exists
        if doc_id in existing:
            print(f"  [{idx:>3}/{total}] ⏭️  {doc_id} (already exists)")
            stats["skipped"] += 1
            continue

        print(
            f"  [{idx:>3}/{total}] 📝 {doc_id} | "
            f"ETA: {eta_str:<12} | {doc.get('company_name', 'N/A')}"
        )

        # 1. Insert into rag_documents
        try:
            row = {
                "document_id": doc_id,
                "schema_type": doc["schema_type"],
                "source_type": doc["source_type"],
                "source_url": doc.get("source_url"),
                "academic_year": doc.get("academic_year"),
                "company_name": doc.get("company_name"),
                "role_title": doc.get("role_title"),
                "payload": doc["payload"],
                "confidence_score": doc.get("confidence_score", 0.8),
            }
            supabase.table("rag_documents").upsert(row, on_conflict="document_id").execute()
            stats["inserted"] += 1
        except Exception as e:
            print(f"       ❌ Supabase insert failed: {e}")
            stats["failed"] += 1
            continue

        # 2. Generate and insert embedding
        if not skip_embeddings:
            embedding_text = payload_to_embedding_text(doc)

            vector = embed_with_retry(embedding_text, idx, total)
            if vector is not None:
                try:
                    emb_row = {
                        "document_id": doc_id,
                        "content": embedding_text,
                        "embedding": vector,
                        "metadata": {
                            "schema_type": doc["schema_type"],
                            "company_name": doc.get("company_name"),
                        }
                    }
                    supabase.table("rag_document_embeddings").upsert(
                        emb_row, on_conflict="document_id"
                    ).execute()
                    stats["embedded"] += 1
                except Exception as e:
                    print(f"       ❌ Embedding insert failed: {e}")
                    stats["embed_failed"] += 1
            else:
                stats["embed_failed"] += 1

            # Rate limit delay
            if idx < total:
                time.sleep(RATE_LIMIT_DELAY_SECONDS)

    # Summary
    total_elapsed = time.time() - start_time
    print(f"\n{'='*60}")
    print(f"  ✅ Load complete in {format_eta(total_elapsed)}")
    print(f"     📝 Inserted  : {stats['inserted']}")
    print(f"     ⏭️  Skipped   : {stats['skipped']}")
    print(f"     ❌ Failed    : {stats['failed']}")
    if not skip_embeddings:
        print(f"     🧠 Embedded  : {stats['embedded']}")
        print(f"     ⚠️  Embed fail: {stats['embed_failed']}")
    print(f"{'='*60}\n")

    return stats


def _dry_run(documents: list[dict]) -> dict:
    """Validate documents without writing to Supabase."""
    stats = {"valid": 0, "invalid": 0, "errors": []}

    for idx, doc in enumerate(documents, start=1):
        doc_id = doc.get("document_id", f"unknown_{idx}")
        schema_type = doc.get("schema_type", "?")
        company = doc.get("company_name", "N/A")

        # Generate embedding text to verify it works
        try:
            emb_text = payload_to_embedding_text(doc)
            text_len = len(emb_text)
            print(
                f"  [{idx:>3}] ✅ {doc_id} | "
                f"type={schema_type} | company={company} | "
                f"embed_text={text_len} chars"
            )
            stats["valid"] += 1
        except Exception as e:
            print(f"  [{idx:>3}] ❌ {doc_id} | ERROR: {e}")
            stats["invalid"] += 1
            stats["errors"].append({"doc_id": doc_id, "error": str(e)})

    print(f"\n  Dry run results: {stats['valid']} valid, {stats['invalid']} invalid")
    return stats


def _get_existing_document_ids() -> set[str]:
    """Fetch all existing document IDs from Supabase."""
    try:
        resp = supabase.table("rag_documents").select("document_id").execute()
        return {row["document_id"] for row in resp.data}
    except Exception:
        # Table might not exist yet
        return set()


def vectorize_only():
    """
    Re-generate embeddings for all documents that don't have one yet.
    Useful if documents were loaded with skip_embeddings=True.
    """
    print("\n🔍 Fetching documents without embeddings...")

    # Get all document IDs
    all_docs_resp = supabase.table("rag_documents").select("document_id, schema_type, company_name, payload").execute()
    all_docs = {d["document_id"]: d for d in all_docs_resp.data}

    # Get already-embedded IDs
    embedded_resp = supabase.table("rag_document_embeddings").select("document_id").execute()
    already_embedded = {r["document_id"] for r in embedded_resp.data}

    to_embed = [d for doc_id, d in all_docs.items() if doc_id not in already_embedded]
    print(f"  📊 {len(all_docs)} total documents, {len(already_embedded)} already embedded.")
    print(f"  📋 {len(to_embed)} documents need embeddings.\n")

    if not to_embed:
        print("  🎉 All documents already have embeddings!")
        return

    start_time = time.time()
    success = 0
    fail = 0

    for idx, doc in enumerate(to_embed, start=1):
        doc_id = doc["document_id"]

        elapsed = time.time() - start_time
        if idx > 1:
            eta_str = format_eta((elapsed / (idx - 1)) * (len(to_embed) - idx + 1))
        else:
            eta_str = "calculating..."

        print(f"  [{idx:>3}/{len(to_embed)}] 🧠 {doc_id} | ETA: {eta_str}")

        # Build a minimal doc structure for payload_to_embedding_text
        fake_doc = {
            "schema_type": doc["schema_type"],
            "payload": doc["payload"],
            "company_name": doc.get("company_name"),
            "academic_year": None,
        }
        embedding_text = payload_to_embedding_text(fake_doc)
        vector = embed_with_retry(embedding_text, idx, len(to_embed))

        if vector is not None:
            try:
                supabase.table("rag_document_embeddings").upsert({
                    "document_id": doc_id,
                    "content": embedding_text,
                    "embedding": vector,
                    "metadata": {
                        "schema_type": doc["schema_type"],
                        "company_name": doc.get("company_name"),
                    }
                }, on_conflict="document_id").execute()
                success += 1
            except Exception as e:
                print(f"       ❌ Insert failed: {e}")
                fail += 1
        else:
            fail += 1

        if idx < len(to_embed):
            time.sleep(RATE_LIMIT_DELAY_SECONDS)

    total_elapsed = time.time() - start_time
    print(f"\n  ✅ Vectorization complete in {format_eta(total_elapsed)}.")
    print(f"     🧠 Embedded: {success}  |  ❌ Failed: {fail}")
