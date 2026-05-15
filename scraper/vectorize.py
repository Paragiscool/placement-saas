import os
import sys
import time
import math

# Force UTF-8 encoding for standard output so emojis don't crash on Windows
sys.stdout.reconfigure(encoding='utf-8')
from supabase import create_client
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
# Load from the parent directory's .env.local
load_dotenv(r'c:\Users\patle\OneDrive\Documents\Desktop\placement-saas\.env.local')

# Free-tier limits: 15 RPM / 1,500 RPD
# Safe inter-request delay = 60s / 13 req ≈ 4.5 s  (leaves a 2-req buffer per minute)
RATE_LIMIT_DELAY_SECONDS = 4.5

# How long to pause when a 429 "quota exceeded" error is received
RETRY_PAUSE_SECONDS = 60

# Maximum number of retry attempts per job before giving up
MAX_RETRIES = 5

# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------
supabase = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Switch to the Free-tier-compatible embedding model
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def format_eta(seconds: float) -> str:
    """Convert a raw second count into a human-readable HH:MM:SS string."""
    seconds = max(0, int(seconds))
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}h {m:02d}m {s:02d}s"
    elif m > 0:
        return f"{m}m {s:02d}s"
    else:
        return f"{s}s"


def embed_with_retry(text: str, job_index: int, total: int) -> list[float] | None:
    """
    Embed a single text string.

    Retries up to MAX_RETRIES times on 429 errors, pausing RETRY_PAUSE_SECONDS
    between each attempt. Returns None if all attempts fail.
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return embeddings.embed_query(text)

        except Exception as e:
            err_str = str(e).lower()

            # Detect quota / rate-limit errors
            if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                if attempt < MAX_RETRIES:
                    print(
                        f"\n  ⚠️  Rate limit hit on job {job_index}/{total} "
                        f"(attempt {attempt}/{MAX_RETRIES}). "
                        f"Pausing {RETRY_PAUSE_SECONDS}s before retry..."
                    )
                    time.sleep(RETRY_PAUSE_SECONDS)
                else:
                    print(
                        f"\n  ❌ Giving up on job {job_index}/{total} after "
                        f"{MAX_RETRIES} attempts. Skipping."
                    )
                    return None
            else:
                # Non-quota error — surface it immediately
                print(f"\n  ❌ Unexpected error on job {job_index}/{total}: {e}")
                return None

    return None  # Unreachable, but keeps the linter happy


# ---------------------------------------------------------------------------
# Main function
# ---------------------------------------------------------------------------
def vectorize_jobs():
    # ------------------------------------------------------------------
    # 1. Fetch all jobs from Supabase
    # ------------------------------------------------------------------
    print("🔍 Fetching jobs from Supabase...")
    response = supabase.table("jobs").select("*").execute()
    jobs = response.data
    total = len(jobs)
    print(f"✅ Found {total} jobs in the database.\n")

    # ------------------------------------------------------------------
    # 2. Fetch already-embedded job IDs to skip them (safe resume)
    # ------------------------------------------------------------------
    print("🔍 Checking for already-embedded jobs...")
    existing_response = supabase.table("job_embeddings").select("job_id").execute()
    already_embedded = {row["job_id"] for row in existing_response.data}
    jobs_to_process = [j for j in jobs if j["id"] not in already_embedded]
    skipped = total - len(jobs_to_process)

    if skipped > 0:
        print(f"⏭️  Skipping {skipped} already-embedded jobs.")

    remaining = len(jobs_to_process)
    if remaining == 0:
        print("🎉 All jobs are already vectorized. Nothing to do!")
        return

    print(f"📋 {remaining} jobs to process.\n")
    print("-" * 60)

    # ------------------------------------------------------------------
    # 3. Process each job with rate limiting and retry logic
    # ------------------------------------------------------------------
    start_time = time.time()
    success_count = 0
    fail_count = 0

    for idx, job in enumerate(jobs_to_process, start=1):
        # --- Progress & ETA ---
        elapsed = time.time() - start_time
        if idx > 1:
            avg_per_job = elapsed / (idx - 1)
            eta_seconds = avg_per_job * (remaining - idx + 1)
            eta_str = format_eta(eta_seconds)
        else:
            eta_str = "calculating..."

        print(
            f"[{idx:>4}/{remaining}]  Processing job ID {job['id']:<6} | "
            f"ETA: {eta_str:<15} | {job.get('company', 'N/A')} — {job.get('role', 'N/A')}"
        )

        # --- Build the text to embed ---
        combined_text = (
            f"Company: {job.get('company', '')}. "
            f"Role: {job.get('role', '')}. "
            f"Category: {job.get('category', '')}."
        )

        # --- Embed with retry ---
        vector = embed_with_retry(combined_text, idx, remaining)

        if vector is None:
            fail_count += 1
            # Rate-limit delay still applies even on failure
            time.sleep(RATE_LIMIT_DELAY_SECONDS)
            continue

        # --- Insert into Supabase ---
        try:
            supabase.table("job_embeddings").insert({
                "job_id": job["id"],
                "content": combined_text,
                "embedding": vector,
                "metadata": {
                    "location": job.get("location"),
                    "ctc": job.get("ctc")
                }
            }).execute()
            success_count += 1
        except Exception as e:
            print(f"  ❌ Supabase insert failed for job {job['id']}: {e}")
            fail_count += 1

        # --- Enforce rate limit (except after the very last job) ---
        if idx < remaining:
            time.sleep(RATE_LIMIT_DELAY_SECONDS)

    # ------------------------------------------------------------------
    # 4. Summary
    # ------------------------------------------------------------------
    total_elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print(f"✅ Done!  Processed {remaining} jobs in {format_eta(total_elapsed)}.")
    print(f"   ✔ Succeeded : {success_count}")
    print(f"   ✘ Failed    : {fail_count}")
    print(f"   ⏭ Skipped   : {skipped}")
    print("=" * 60)


if __name__ == "__main__":
    vectorize_jobs()
