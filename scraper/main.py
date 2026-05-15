import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env.local")

app = FastAPI()

# 1. BULLETPROOF CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. INITIALIZE SECURE CLIENTS
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# 3. USE ULTRA-STABLE MODELS (No experimental versions)
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.7) 

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        # Step 1: Turn the user's message into a vector
        query_vector = embeddings.embed_query(request.message)

        # Step 2: Search Supabase
        search_result = supabase.rpc(
            "match_jobs",
            {"query_embedding": query_vector, "match_threshold": 0.5, "match_count": 3}
        ).execute()

        context_text = "\n".join([item["content"] for item in search_result.data])

        # Step 3: Construct the prompt
        system_prompt = f"""
        You are a friendly, sharp, and highly supportive senior student at IIT Kharagpur who recently cracked top Day 1 placements. 
        You are conducting a mock interview with a junior.
        
        Context from PlacementIQ Database: {context_text}
        
        Junior's Message: {request.message}
        """

        # Step 4: Get response
        response = llm.invoke(system_prompt)
        return {"reply": response.content}
        
    except Exception as e:
        # IF ANYTHING BREAKS, SEND THE ERROR TO THE CHAT UI!
        return {"reply": f"**Backend Crash Report:** `{str(e)}`"}
