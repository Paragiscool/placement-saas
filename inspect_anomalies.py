import os
import requests
from dotenv import load_dotenv

load_dotenv('.env.local')

url = f"{os.getenv('NEXT_PUBLIC_SUPABASE_URL')}/rest/v1/rag_documents"
headers = {
    'apikey': os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    'Authorization': f"Bearer {os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')}"
}

print("--- AUDITING 'NULL' COMPANY RECORDS ---")
# Query for NULL company_name
params_null = {'company_name': 'is.null', 'select': 'id,payload'}
response_null = requests.get(url, headers=headers, params=params_null).json()

if isinstance(response_null, dict) and 'code' in response_null:
    print(f"API Error: {response_null}")
elif not response_null:
    print("No NULL records found or fetch failed.")
else:
    for row in response_null:
        content_preview = str(row.get('payload', '')).replace('\n', ' ')[:150]
        print(f"ID: {row.get('id')} | Content: {content_preview}...")

print("\n--- AUDITING 'VARIOUS' COMPANY RECORDS (Sample of 5) ---")
# Query for 'Various' company_name
params_various = {'company_name': 'eq.Various', 'select': 'id,payload', 'limit': '5'}
response_various = requests.get(url, headers=headers, params=params_various).json()

if isinstance(response_various, dict) and 'code' in response_various:
    print(f"API Error: {response_various}")
elif not response_various:
    print("No 'Various' records found or fetch failed.")
else:
    for row in response_various:
        content_preview = str(row.get('payload', '')).replace('\n', ' ')[:150]
        print(f"ID: {row.get('id')} | Content: {content_preview}...")
