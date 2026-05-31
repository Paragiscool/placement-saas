import os
import sys
import time
import json
import glob
from dotenv import load_dotenv
from supabase import create_client
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings

sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    raise ValueError("Missing required environment variables. Please check .env.local")

# Set the google api key in environment as expected by some langchain versions
os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

# Connect to Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Google Embeddings
embeddings_model = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-2"
)

def load_all_text():
    all_text = ""
    
    # Load our fake raw_data.json for the specific tests
    raw_data_path = os.path.join(os.path.dirname(__file__), 'raw_data.json')
    if os.path.exists(raw_data_path):
        with open(raw_data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for item in data:
                all_text += f"Company: {item['company_name']}\nRole: {item['role_title']}\nDescription: {item['description']}\n\n"
                
    # Load some existing seed data
    seed_dir = os.path.join(os.path.dirname(__file__), 'seed_data', 'interview_experiences')
    if os.path.exists(seed_dir):
        for filepath in glob.glob(f"{seed_dir}/*.json"):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                all_text += json.dumps(data, indent=2) + "\n\n"
                
    return all_text

def main():
    print("Loading scraped data...", flush=True)
    raw_text = load_all_text()
    
    if not raw_text.strip():
        print("No data found to process.", flush=True)
        return

    print("Chunking text using RecursiveCharacterTextSplitter...", flush=True)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = text_splitter.split_text(raw_text)
    total_chunks = len(chunks)
    print(f"Generated {total_chunks} chunks.", flush=True)
    
    for i, chunk in enumerate(chunks, 1):
        print(f"Processed batch {i}/{total_chunks}...", flush=True)
        
        try:
            # Generate embedding
            vector = embeddings_model.embed_query(chunk)
            
            doc_id = f"custom_chunk_{i}"
            
            # 1. Insert parent record in rag_documents
            supabase.table("rag_documents").upsert({
                "document_id": doc_id,
                "schema_type": "interview",
                "source_type": "custom_seed",
                "payload": {"content": chunk},
                "company_name": "Various",
                "role_title": "Various"
            }, on_conflict="document_id").execute()
            
            # 2. Insert the embedding
            supabase.table("rag_document_embeddings").upsert({
                "document_id": doc_id,
                "content": chunk,
                "embedding": vector,
                "metadata": {"source": "seed_db.py"}
            }, on_conflict="document_id").execute()
            
        except Exception as e:
            print(f"Error on chunk {i}: {e}", flush=True)
            
        # Avoid rate limits (Free-tier limit 15 RPM)
        if i < total_chunks:
            time.sleep(4.5)
            
    print("\n✅ Seeding complete! The RAG backend can now access this data.", flush=True)

if __name__ == "__main__":
    main()
