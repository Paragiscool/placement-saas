import time
import os
import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv('.env.local')

# Setup Supabase REST API
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f"Bearer {SUPABASE_KEY}",
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# Fix: using GOOGLE_API_KEY from .env.local instead of GEMINI_API_KEY
client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))

print("--- PHASE 1: SECURING THE ECOSYSTEM (UPDATING NULLS) ---")
patch_nulls_url = f"{SUPABASE_URL}/rest/v1/rag_documents?company_name=is.null"
patch_nulls_req = requests.patch(patch_nulls_url, headers=HEADERS, json={"company_name": "IIT_KGP_Ecosystem"})
if patch_nulls_req.status_code in [200, 204]:
    print("[OK] Successfully secured all NULL records as 'IIT_KGP_Ecosystem'.")
else:
    print(f"[FAIL] Failed to update NULL records: {patch_nulls_req.text}")


print("\n--- PHASE 2: INITIATING AI RESCUE PROTOCOL FOR 'VARIOUS' RECORDS ---")

# 1. Fetch the polluted records
fetch_url = f"{SUPABASE_URL}/rest/v1/rag_documents"
# Fix: column name is payload, not content
params = {'company_name': 'eq.Various', 'select': 'id,payload'}
response = requests.get(fetch_url, headers=HEADERS, params=params).json()

if isinstance(response, dict) and response.get('code'):
    print(f"API Error: {response}")
    exit()

if not response:
    print("No 'Various' records found. Vector space is clean.")
    exit()

print(f"Found {len(response)} records to rescue. Processing...\n")

for row in response:
    record_id = row.get('id')
    content_preview = str(row.get('payload', ''))[:800] # Grab enough context
    
    # 2. Use Gemini to extract the true company name
    prompt = f"""
    Analyze the following text scraped from a job placement database. 
    Identify the specific hiring company being discussed (e.g., American Express, DeepMind, Google).
    Return ONLY the exact company name. Do not include any other words, punctuation, or explanations. 
    If you cannot confidently determine the company, return the word "Unknown".
    
    TEXT:
    {content_preview}
    """
    
    try:
        ai_response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        extracted_company = ai_response.text.strip()
        
        if extracted_company and extracted_company != "Unknown":
            # 3. Patch the Supabase record with the true company name
            patch_url = f"{SUPABASE_URL}/rest/v1/rag_documents?id=eq.{record_id}"
            payload = {"company_name": extracted_company}
            
            patch_req = requests.patch(patch_url, headers=HEADERS, json=payload)
            
            if patch_req.status_code in [200, 204]:
                print(f"[OK] Rescued ID {record_id} -> Re-tagged as: {extracted_company}")
            else:
                print(f"[FAIL] Failed to update ID {record_id} in Supabase: {patch_req.text}")
        else:
            print(f"[WARN] Could not identify company for ID {record_id}. Leaving as 'Various'.")
            
    except Exception as e:
        print(f"Error processing ID {record_id}: {e}")
        
    time.sleep(15) # Respect Gemini API 5 RPM limit

print("\n--- RESCUE PROTOCOL COMPLETE ---")
