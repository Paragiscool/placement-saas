"""
RAG Pipeline Runner — CLI entry point for the ETL pipeline.

Usage:
  python run_pipeline.py --seed                    # Load all seed data files
  python run_pipeline.py --seed --dry-run           # Validate seed data without writing
  python run_pipeline.py --seed --skip-embeddings   # Load seed data, skip embedding generation
  python run_pipeline.py --vectorize-only           # Generate embeddings for un-embedded docs
  python run_pipeline.py --validate                 # Validate all seed JSON files

Examples:
  # Fastest path: load seed data and generate embeddings
  python run_pipeline.py --seed

  # Test first, then load
  python run_pipeline.py --seed --dry-run
  python run_pipeline.py --seed

  # Load fast (no embeddings), then batch-embed later
  python run_pipeline.py --seed --skip-embeddings
  python run_pipeline.py --vectorize-only
"""

import os
import sys
import json
import argparse

sys.stdout.reconfigure(encoding='utf-8')

# Ensure the scraper directory is in the path
sys.path.insert(0, os.path.dirname(__file__))

from normalizer import normalize_document, validate_payload, SEED_DIR_TO_SCHEMA


# ---------------------------------------------------------------------------
# Seed data loading
# ---------------------------------------------------------------------------
SEED_DATA_DIR = os.path.join(os.path.dirname(__file__), "seed_data")


def discover_seed_files() -> list[tuple[str, str, str]]:
    """
    Walk the seed_data directory and discover all JSON files.

    Returns a list of (file_path, schema_type, filename) tuples.
    """
    results = []

    if not os.path.isdir(SEED_DATA_DIR):
        print(f"  ⚠️  Seed data directory not found: {SEED_DATA_DIR}")
        return results

    for subdir_name in sorted(os.listdir(SEED_DATA_DIR)):
        subdir_path = os.path.join(SEED_DATA_DIR, subdir_name)
        if not os.path.isdir(subdir_path):
            continue

        schema_type = SEED_DIR_TO_SCHEMA.get(subdir_name)
        if not schema_type:
            print(f"  ⚠️  Unknown seed subdirectory: {subdir_name}, skipping.")
            continue

        for filename in sorted(os.listdir(subdir_path)):
            if filename.endswith(".json"):
                filepath = os.path.join(subdir_path, filename)
                results.append((filepath, schema_type, filename))

    return results


def load_seed_files() -> list[dict]:
    """
    Load all seed JSON files and normalize them into the standard format.

    Returns a list of normalized document dicts ready for the loader.
    """
    seed_files = discover_seed_files()
    print(f"\n  📂 Found {len(seed_files)} seed files in {SEED_DATA_DIR}\n")

    documents = []
    errors = []

    for filepath, expected_schema, filename in seed_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                raw = json.load(f)

            normalized = normalize_document(raw)

            # Verify detected schema matches expected
            if normalized["schema_type"] != expected_schema:
                print(
                    f"  ⚠️  {filename}: detected schema '{normalized['schema_type']}' "
                    f"doesn't match directory schema '{expected_schema}'"
                )

            documents.append(normalized)
            print(f"  ✅ {filename:<40} -> {normalized['document_id']}")

        except Exception as e:
            print(f"  ❌ {filename:<40} -> ERROR: {e}")
            errors.append({"file": filename, "error": str(e)})

    print(f"\n  📊 Loaded: {len(documents)} | Errors: {len(errors)}")
    if errors:
        print("  Errors:")
        for err in errors:
            print(f"    - {err['file']}: {err['error']}")

    return documents


def validate_seed_files() -> bool:
    """Validate all seed JSON files without loading."""
    print("\n" + "=" * 60)
    print("  VALIDATION MODE — Checking all seed files")
    print("=" * 60)

    seed_files = discover_seed_files()
    valid = 0
    invalid = 0

    for filepath, expected_schema, filename in seed_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                raw = json.load(f)

            # Try normalizing (this validates the payload)
            normalized = normalize_document(raw)

            # Check required fields
            assert normalized["document_id"], "Missing document_id"
            assert normalized["schema_type"], "Missing schema_type"
            assert normalized["payload"], "Empty payload"

            print(f"  ✅ {filename:<40} | {normalized['schema_type']:<15} | {normalized.get('company_name', 'N/A')}")
            valid += 1

        except Exception as e:
            print(f"  ❌ {filename:<40} | ERROR: {e}")
            invalid += 1

    print(f"\n  Results: {valid} valid, {invalid} invalid out of {len(seed_files)} files")
    return invalid == 0


# ---------------------------------------------------------------------------
# Main CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="RAG Data Extraction Pipeline — Load OSINT data into Supabase for the PlacementIQ RAG system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "--seed",
        action="store_true",
        help="Load all seed data files from scraper/seed_data/"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and preview without writing to Supabase"
    )
    parser.add_argument(
        "--skip-embeddings",
        action="store_true",
        help="Insert documents but skip embedding generation (faster)"
    )
    parser.add_argument(
        "--vectorize-only",
        action="store_true",
        help="Generate embeddings for documents that don't have one yet"
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate all seed JSON files against Pydantic schemas"
    )

    args = parser.parse_args()

    # If no arguments, show help
    if not any([args.seed, args.vectorize_only, args.validate]):
        parser.print_help()
        return

    print("\n" + "=" * 60)
    print("  🚀 PlacementIQ RAG Pipeline")
    print("=" * 60)

    # Validate only
    if args.validate:
        success = validate_seed_files()
        sys.exit(0 if success else 1)

    # Vectorize only
    if args.vectorize_only:
        from rag_loader import vectorize_only
        vectorize_only()
        return

    # Seed data loading
    if args.seed:
        documents = load_seed_files()

        if not documents:
            print("\n  ⚠️  No documents to load. Check seed_data/ directory.")
            return

        from rag_loader import load_documents
        stats = load_documents(
            documents,
            dry_run=args.dry_run,
            skip_embeddings=args.skip_embeddings
        )

        return


if __name__ == "__main__":
    main()
