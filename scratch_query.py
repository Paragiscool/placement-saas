import os
import requests
from dotenv import load_dotenv

load_dotenv('.env.local')

url = f"{os.getenv('NEXT_PUBLIC_SUPABASE_URL')}/rest/v1/rag_documents?select=company_name"
headers = {
    'apikey': os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    'Authorization': f"Bearer {os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')}"
}

response = requests.get(url, headers=headers)
data = response.json()
print("DEBUG API RESPONSE:", data)

company_counts = {}
for row in data:
    company = row.get('company_name')
    if company is None:
        continue
    if company not in company_counts:
        company_counts[company] = {'actual_length': len(company), 'count': 0}
    company_counts[company]['count'] += 1

sorted_companies = sorted(company_counts.items(), key=lambda x: x[0])

print(f"{'company':<30} | {'actual_length':<15} | {'occurrence_count':<15}")
print('-' * 65)
for name, stats in sorted_companies:
    print(f"{name:<30} | {stats['actual_length']:<15} | {stats['count']:<15}")
