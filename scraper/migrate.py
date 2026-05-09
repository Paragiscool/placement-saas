import json
import re
from categorizer import categorize_role

def clean_ctc(ctc_str):
    """Extracts numeric LPA value from a raw CTC string"""
    if not ctc_str: return None
    s = str(ctc_str).replace(',', '').replace(' ', '')
    match = re.search(r'(\d+(?:\.\d+)?)', s)
    if match:
        return float(match.group(1))
    return None

def migrate_local_data():
    """
    Reads the data.js file from the old static project, parses the JS array,
    and returns a list of dictionaries ready for Supabase insertion.
    """
    old_data_path = r'c:\Users\patle\OneDrive\Documents\Desktop\Placement_data\data.js'
    
    try:
        with open(old_data_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Extract the JSON part of `const PLACEMENT_DATA = [...]`
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        json_str = content[start_idx:end_idx]
        
        # Parse JSON
        raw_data = json.loads(json_str)
        
        # Transform for Supabase `jobs` schema
        jobs_to_insert = []
        seen = set()
        for row in raw_data:
            company = row.get('Company', 'Unknown')
            role = row.get('Position', 'Unknown Role')
            
            # Deduplicate before sending to Supabase
            if (company, role) in seen:
                continue
            seen.add((company, role))
            
            cat_group, category = categorize_role(role)
            
            # If the old data already had a category, we can trust it, 
            # otherwise fallback to our categorizer
            final_cat = row.get('Category') if row.get('Category') else category
            
            job = {
                "company": company,
                "role": role,
                "ctc": row.get('CTC_LPA') or clean_ctc(row.get('CTC')),
                "currency": row.get('Currency', 'INR'),
                "location": "India", # Default assumption for KGP
                "category": final_cat,
                "category_group": cat_group,
                "college_tag": "IITKGP",
                "source": "manual_migration"
            }
            jobs_to_insert.append(job)
            
        return jobs_to_insert

    except Exception as e:
        print(f"Failed to read/parse data.js: {e}")
        return []

if __name__ == "__main__":
    import os
    from supabase import create_client
    from dotenv import load_dotenv
    
    load_dotenv(r'c:\Users\patle\OneDrive\Documents\Desktop\placement-saas\.env.local')
    
    # Needs SERVICE_ROLE key, not anon key, to bypass RLS for inserts
    URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    KEY = os.environ.get("SUPABASE_SERVICE_KEY") 
    
    if not URL or not KEY:
        print("Set SUPABASE_SERVICE_KEY in .env.local first!")
        exit(1)
        
    supabase = create_client(URL, KEY)
    
    print("Extracting from data.js...")
    jobs = migrate_local_data()
    print(f"Extracted {len(jobs)} jobs.")
    
    if jobs:
        print("Upserting to Supabase...")
        res = supabase.table('jobs').upsert(jobs, on_conflict="company,role").execute()
        print(f"Migration complete! Inserted/Updated {len(res.data)} rows.")
