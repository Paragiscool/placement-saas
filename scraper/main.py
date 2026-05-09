from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(r'c:\Users\patle\OneDrive\Documents\Desktop\placement-saas\.env.local')

app = FastAPI(title="PlacementIQ Ingestion API")

# Initialize Supabase service client
URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(URL, KEY) if URL and KEY else None

class JobPayload(BaseModel):
    company: str
    role: str
    ctc: Optional[float] = None
    currency: str = "INR"
    location: str = "India"
    category: Optional[str] = None
    apply_link: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "healthy", "supabase_connected": supabase is not None}

@app.post("/ingest")
def ingest_jobs(jobs: List[JobPayload], authorization: str = Header(None)):
    """
    Webhook endpoint to ingest jobs from external scrapers.
    Expects a Bearer token matching a local secret.
    """
    expected_token = os.environ.get("API_SECRET_TOKEN", "dev-secret-token")
    if not authorization or authorization != f"Bearer {expected_token}":
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    # Format for Supabase
    db_payload = []
    for j in jobs:
        db_payload.append({
            "company": j.company,
            "role": j.role,
            "ctc": j.ctc,
            "currency": j.currency,
            "location": j.location,
            "category": j.category,
            "apply_link": j.apply_link,
            "source": "api_scraper"
        })

    # Upsert to Postgres
    try:
        res = supabase.table("jobs").upsert(db_payload, on_conflict="company,role").execute()
        return {"status": "success", "inserted": len(res.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run locally with: uvicorn main:app --reload
