import os
import json
from typing import Optional, List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://placement-saas-three.vercel.app"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. INITIALIZE SUPABASE
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# 2. CONFIGURE GOOGLE API DIRECTLY
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# 3. LLM for the actual chat (LangChain is fine for this part)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7) 

class ChatRequest(BaseModel):
    message: str
    user_id: str
    job_id: str
    interview_id: Optional[str] = None
    history: Optional[list] = None

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        # Step 1: Direct lookup for job context
        response = supabase.table("job_embeddings").select("content").eq("job_id", request.job_id).execute()
        if not response.data:
            context_text = "No specific context available."
        else:
            context_text = response.data[0]["content"]

        # Step 2: Fetch or construct transcript
        is_logged_in = request.user_id != "00000000-0000-0000-0000-000000000000"
        
        if is_logged_in and request.interview_id:
            int_resp = supabase.table("mock_interviews").select("transcript").eq("id", request.interview_id).execute()
            transcript = int_resp.data[0]["transcript"] if int_resp.data else []
        else:
            transcript = []
            if request.history:
                for h in request.history:
                    transcript.append({"role": h.get("role"), "content": h.get("content")})
            
            # Ensure the current message is in transcript
            if not transcript or transcript[-1]["content"] != request.message:
                transcript.append({"role": "user", "content": request.message})

        if is_logged_in and not request.interview_id and len(transcript) <= 1:
            # Initialize transcript with user message if not already done
            if not transcript or transcript[-1]["content"] != request.message:
                transcript.append({"role": "user", "content": request.message})

        # Step 3: Construct the prompt
        history_text = ""
        for msg in transcript[:-1]:  # Exclude current message
            role_name = "Junior" if msg["role"] == "user" else "Senior"
            history_text += f"{role_name}: {msg['content']}\n"

        system_prompt = f"""
        You are a friendly, sharp, and highly supportive senior student at IIT Kharagpur who recently cracked top Day 1 placements. 
        You are conducting a mock interview with a junior.
        
        Context from PlacementIQ Database: {context_text}
        
        Chat History:
        {history_text}
        
        Junior's Message: {request.message}
        """

        # Step 4: Get response
        ai_response = llm.invoke(system_prompt)
        reply_content = ai_response.content
        
        transcript.append({"role": "ai", "content": reply_content})

        # Step 5: Save to Supabase (only if logged in)
        interview_id = request.interview_id
        if is_logged_in:
            if request.interview_id:
                supabase.table("mock_interviews").update({"transcript": transcript}).eq("id", request.interview_id).execute()
            else:
                new_int = supabase.table("mock_interviews").insert({
                    "user_id": request.user_id,
                    "job_id": request.job_id,
                    "transcript": transcript
                }).execute()
                if new_int.data:
                    interview_id = new_int.data[0]["id"]

        return {"reply": reply_content, "interview_id": interview_id}
        
    except Exception as e:
        return {"reply": f"**Backend Crash Report:** `{str(e)}`"}


# What the Next.js frontend sends us
class TranscriptMessage(BaseModel):
    role: str
    content: str

class EvaluationRequest(BaseModel):
    messages: List[TranscriptMessage]
    job_context: str # e.g., "Google SDE L4"

# What Gemini will return to us
class ScorecardResult(BaseModel):
    technical_depth_score: int
    communication_score: int
    problem_solving_score: int
    strengths: List[str]
    areas_for_improvement: List[str]
    final_verdict: str

@app.post("/api/evaluate")
async def evaluate_interview(request: EvaluationRequest):
    try:
        # 1. Format the transcript into a single string for the AI to read
        transcript_text = "\n".join([f"{msg.role.upper()}: {msg.content}" for msg in request.messages])
        
        # 2. The Master Evaluator Prompt
        system_prompt = f"""
        You are a strict, FAANG-level Principal Engineer and Hiring Manager.
        Review the following interview transcript for a {request.job_context} role.
        
        Evaluate the candidate on a scale of 1-10 for:
        1. Technical Depth (Accuracy, system design, algorithm optimization)
        2. Communication (Clarity, structure, not rambling)
        3. Problem Solving (Handling edge cases, adapting to hints)
        
        Provide 2 specific strengths, 2 specific areas for improvement, and a final verdict (e.g., 'Strong Hire', 'Lean Hire', 'No Hire').
        You must be highly critical. Do not give 10/10 unless the candidate was flawless.
        
        TRANSCRIPT:
        {transcript_text}
        """

        # 3. Call Gemini, forcing it to return the exact Pydantic JSON structure
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash", # Flash is perfect and fast for this
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ScorecardResult,
                temperature=0.2 # Low temperature for consistent grading
            )
        )
        
        response = model.generate_content(system_prompt)
        
        # 4. Parse the JSON and return it to the Next.js frontend
        scorecard = json.loads(response.text)
        return {"status": "success", "scorecard": scorecard}

    except Exception as e:
        return {"status": "error", "message": str(e)}


class ScorecardRequest(BaseModel):
    interview_id: Optional[str] = None
    transcript: Optional[list] = None

@app.post("/api/scorecard")
async def generate_scorecard(request: ScorecardRequest):
    try:
        if request.interview_id:
            int_resp = supabase.table("mock_interviews").select("transcript").eq("id", request.interview_id).execute()
            if not int_resp.data:
                return {"error": "Interview not found"}
            transcript = int_resp.data[0]["transcript"]
        else:
            transcript = request.transcript or []

        if not transcript:
            return {"error": "No transcript provided"}
        
        history_text = ""
        for msg in transcript:
            role_name = "Junior" if msg["role"] == "user" else "Senior"
            history_text += f"{role_name}: {msg['content']}\n"
            
        scorecard_prompt = f"""
        You are an expert technical interviewer evaluating a mock interview transcript.
        Generate a scorecard in JSON format with the following keys:
        - technical_depth (string, e.g., '8/10')
        - communication (string, e.g., '7/10')
        - feedback (string, a paragraph of actionable feedback)
        
        Transcript:
        {history_text}
        
        Return ONLY valid JSON, no markdown formatting.
        """
        
        eval_response = llm.invoke(scorecard_prompt)
        
        try:
            scorecard_text = eval_response.content.strip().replace("```json", "").replace("```", "")
            scorecard_data = json.loads(scorecard_text)
        except Exception:
            scorecard_data = {"error": "Failed to parse JSON", "raw": eval_response.content}
            
        if request.interview_id:
            supabase.table("mock_interviews").update({"scorecard": scorecard_data}).eq("id", request.interview_id).execute()
        
        return scorecard_data
        
    except Exception as e:
        return {"error": str(e)}


# ==========================================================================
# RAG QUERY ENDPOINT — Retrieval-Augmented Generation for Placement Intel
# ==========================================================================

# Embedding model for query vectorization
rag_embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2")


class RAGQueryRequest(BaseModel):
    query: str
    schema_filter: Optional[str] = None  # 'interview', 'compensation', 'prep_resource', 'osint_tool'
    company_filter: Optional[str] = None
    max_results: int = 5


@app.post("/api/rag-query")
async def rag_query(request: RAGQueryRequest):
    """
    RAG-powered placement intelligence query endpoint.

    Multi-step retrieval:
      1. Embed the user query
      2. Pre-filter by metadata (schema_type, company_name)
      3. Semantic vector search using cosine similarity
      4. Synthesize response with Gemini using retrieved context
    """
    try:
        # Step 1: Embed the user's query
        query_vector = rag_embeddings.embed_query(request.query)

        # Step 2: Call the match_rag_documents Supabase function
        # This function handles both vector similarity AND metadata filtering
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": 0.3,
            "match_count": request.max_results,
        }
        if request.schema_filter:
            rpc_params["filter_schema_type"] = request.schema_filter
        if request.company_filter:
            rpc_params["filter_company"] = request.company_filter

        search_response = supabase.rpc("match_rag_documents", rpc_params).execute()
        results = search_response.data or []

        if not results:
            # Fallback: try broader search without filters
            fallback_params = {
                "query_embedding": query_vector,
                "match_threshold": 0.2,
                "match_count": request.max_results,
            }
            search_response = supabase.rpc("match_rag_documents", fallback_params).execute()
            results = search_response.data or []

        # Step 3: Build context from retrieved documents
        if not results:
            context_text = "No specific placement data found in the database for this query."
        else:
            context_blocks = []
            for i, result in enumerate(results, 1):
                context_blocks.append(
                    f"[Source {i} | Type: {result.get('schema_type', 'N/A')} | "
                    f"Company: {result.get('company_name', 'N/A')} | "
                    f"Similarity: {result.get('similarity', 0):.2f}]\n"
                    f"{result.get('content', 'No content')}"
                )
            context_text = "\n\n---\n\n".join(context_blocks)

        # Step 4: Synthesize with Gemini
        synthesis_prompt = f"""You are PlacementIQ, an expert advisor on IIT Kharagpur campus placements.
You have access to verified placement intelligence data. Use ONLY the provided context to answer.
If the context doesn't contain enough information, say so honestly — do NOT hallucinate.

FORMAT your response with clear sections, bullet points, and bold key terms using Markdown.

CONTEXT FROM RAG DATABASE:
{context_text}

USER QUERY: {request.query}

Provide a detailed, actionable response based strictly on the context above."""

        ai_response = llm.invoke(synthesis_prompt)

        # Build response with source attribution
        sources = [
            {
                "document_type": r.get("schema_type"),
                "company": r.get("company_name"),
                "similarity": round(r.get("similarity", 0), 3),
            }
            for r in results
        ]

        return {
            "answer": ai_response.content,
            "sources": sources,
            "total_sources_found": len(results),
            "query": request.query,
        }

    except Exception as e:
        return {"error": f"RAG query failed: {str(e)}", "answer": None, "sources": []}


# --------------------------------------------------------------------------
# Health check with RAG stats
# --------------------------------------------------------------------------
@app.get("/api/rag-stats")
async def rag_stats():
    """Return counts of RAG documents by schema type."""
    try:
        docs_resp = supabase.table("rag_documents").select("schema_type").execute()
        docs = docs_resp.data or []

        emb_resp = supabase.table("rag_document_embeddings").select("document_id").execute()
        emb_count = len(emb_resp.data) if emb_resp.data else 0

        # Count by schema type
        type_counts = {}
        for doc in docs:
            st = doc.get("schema_type", "unknown")
            type_counts[st] = type_counts.get(st, 0) + 1

        return {
            "total_documents": len(docs),
            "total_embeddings": emb_count,
            "documents_by_type": type_counts,
            "status": "healthy"
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

