import os
import json
import uvicorn
from typing import Optional, List
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local"))

app = FastAPI()

frontend_url = os.getenv("FRONTEND_URL")
origins = ["http://localhost:3000", "http://127.0.0.1:3000", "https://placement-saas-three.vercel.app"]
if frontend_url:
    origins.append(frontend_url)
origins.append("*") # Temporary fallback for initial deployment

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. INITIALIZE SUPABASE
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# 2. CONFIGURE GOOGLE API DIRECTLY
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# 3. LLM for the actual chat (LangChain is fine for this part)
llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite", temperature=0.7) 

class ChatRequest(BaseModel):
    message: str
    user_id: str
    job_id: str
    interview_id: Optional[str] = None
    history: Optional[list] = None

def get_user_id_from_token(authorization: Optional[str]) -> str:
    """Verifies JWT with Supabase and returns the user_id (UUID string)."""
    if not authorization or not authorization.startswith("Bearer "):
        return "00000000-0000-0000-0000-000000000000"
    token = authorization.split(" ")[1]
    try:
        user_resp = supabase.auth.get_user(token)
        if user_resp and user_resp.user:
            return user_resp.user.id
    except Exception:
        pass
    return "00000000-0000-0000-0000-000000000000"

@app.get("/")
async def root_health_check():
    """Default health check for Render to prevent 404s on the root path."""
    return {"status": "ok", "message": "Placement SaaS API is running securely."}

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest, authorization: Optional[str] = Header(None)):
    try:
        # Securely get user_id from token, overriding client's request.user_id
        request.user_id = get_user_id_from_token(authorization)
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

class ScorecardRequest(BaseModel):
    messages: List[TranscriptMessage]
    job_context: str # e.g., "Google SDE L4"
    interview_id: Optional[str] = None
    user_id: Optional[str] = None

# What Gemini will return to us
class ScorecardResult(BaseModel):
    technical_depth_score: int
    communication_score: int
    problem_solving_score: int
    strengths: List[str]
    areas_for_improvement: List[str]
    final_verdict: str

@app.post("/api/scorecard")
async def generate_scorecard(request: ScorecardRequest, authorization: Optional[str] = Header(None)):
    try:
        # Securely get user_id from token
        request.user_id = get_user_id_from_token(authorization)
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
        
        Provide 2-3 specific strengths, 2-3 specific areas for improvement, and a final verdict (e.g., 'Strong Hire', 'Lean Hire', 'No Hire').
        You must be highly critical. Do not give 10/10 unless the candidate was flawless.
        
        TRANSCRIPT:
        {transcript_text}
        """

        # 3. Call Gemini, forcing it to return the exact Pydantic JSON structure
        model = genai.GenerativeModel(
            model_name="gemini-3.1-flash-lite", # Flash is perfect and fast for this
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ScorecardResult,
                temperature=0.2 # Low temperature for consistent grading
            )
        )
        
        response = model.generate_content(system_prompt)
        
        # 4. Parse the JSON
        scorecard = json.loads(response.text)
        
        # 5. Save to Supabase (if interview_id provided)
        if request.interview_id:
            transcript_dicts = [{"role": m.role, "content": m.content} for m in request.messages]
            supabase.table("mock_interviews").update({
                "scorecard": scorecard,
                "transcript": transcript_dicts
            }).eq("id", request.interview_id).execute()

        return {"status": "success", "scorecard": scorecard}

    except Exception as e:
        return {"status": "error", "message": str(e)}


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
    High-Recall RAG retrieval with Query Expansion, Hybrid Search, and RRF.
    """
    try:
        # --- Phase 1: Query Expansion ---
        expansion_prompt = f"""
        Extract core technical concepts from the following query. 
        Return ONLY a comma-separated list of 3-5 keywords, synonyms, alternative tool names, or related engineering terms. 
        Do not include conversational words.
        Query: {request.query}
        """
        expansion_response = llm.invoke(expansion_prompt)
        
        expansion_content = expansion_response.content
        if isinstance(expansion_content, list):
            expansion_content = " ".join([str(item.get("text", item)) if isinstance(item, dict) else str(item) for item in expansion_content])
        elif not isinstance(expansion_content, str):
            expansion_content = str(expansion_content)
            
        expanded_keywords = [k.strip() for k in expansion_content.split(',') if len(k.strip()) > 2]
        expanded_query = request.query + " " + " ".join(expanded_keywords)

        # --- Phase 2: Hybrid Retrieval ---
        # 2a. Vector Search
        query_vector = rag_embeddings.embed_query(expanded_query)
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": 0.2, # Lower threshold for wider net
            "match_count": 10,      # Top 10 for expansion
        }
        if request.schema_filter:
            rpc_params["filter_schema_type"] = request.schema_filter
        if request.company_filter:
            rpc_params["filter_company"] = request.company_filter

        vector_response = supabase.rpc("match_rag_documents", rpc_params).execute()
        vector_results = vector_response.data or []

        # 2b. Keyword Search using expanded keywords
        keyword_results = []
        if expanded_keywords:
            # Build ilike conditions for rag_document_embeddings content
            or_conditions = ",".join([f"content.ilike.%{kw}%" for kw in expanded_keywords])
            kw_resp = supabase.table("rag_document_embeddings") \
                .select("document_id, content, rag_documents(schema_type, company_name)") \
                .or_(or_conditions) \
                .limit(20) \
                .execute()
            
            # Format to match vector results structure
            for item in (kw_resp.data or []):
                rd = item.get("rag_documents")
                if isinstance(rd, list) and len(rd) > 0:
                    rd = rd[0]
                elif not isinstance(rd, dict):
                    rd = {}
                keyword_results.append({
                    "document_id": item["document_id"],
                    "content": item["content"],
                    "schema_type": rd.get("schema_type", "N/A"),
                    "company_name": rd.get("company_name", "N/A"),
                })

        # --- Phase 3: RRF Merge & Context Compacting ---
        merged_results = {}
        RRF_K = 60

        # Score Vector results
        for rank, res in enumerate(vector_results):
            doc_id = res["document_id"]
            merged_results[doc_id] = merged_results.get(doc_id, {"data": res, "score": 0})
            merged_results[doc_id]["score"] += 1.0 / (RRF_K + rank + 1)
            
        # Score Keyword results
        for rank, res in enumerate(keyword_results):
            doc_id = res["document_id"]
            if doc_id not in merged_results:
                merged_results[doc_id] = {"data": res, "score": 0}
            merged_results[doc_id]["score"] += 1.0 / (RRF_K + rank + 1)

        # Sort and select Top 10
        sorted_results = sorted(merged_results.values(), key=lambda x: x["score"], reverse=True)[:10]
        top_candidates = [item["data"] for item in sorted_results]

        # Compact context
        if not top_candidates:
            context_text = "No specific placement data found in the database for this query."
        else:
            context_blocks = []
            for i, result in enumerate(top_candidates, 1):
                # Truncate content to 1000 characters to prevent token overflow
                content_snippet = result.get('content', 'No content')
                if len(content_snippet) > 1000:
                    content_snippet = content_snippet[:1000] + "... [truncated]"
                
                context_blocks.append(
                    f"[Source {i} | Type: {result.get('schema_type', 'N/A')} | "
                    f"Company: {result.get('company_name', 'N/A')}]\n"
                    f"{content_snippet}"
                )
            context_text = "\n\n---\n\n".join(context_blocks)

        # --- Phase 4: Synthesize with Gemini ---
        synthesis_prompt = f"""You are PlacementIQ, an expert advisor on IIT Kharagpur campus placements.
You have access to verified placement intelligence data. Use ONLY the provided context to answer.
If the context doesn't contain enough information, say so honestly — do NOT hallucinate.

FORMAT your response with clear sections, bullet points, and bold key terms using Markdown.

CONTEXT FROM RAG DATABASE:
{context_text}

USER QUERY: {request.query}
EXPANDED QUERY TERMS: {', '.join(expanded_keywords)}

Provide a detailed, actionable response based strictly on the context above."""

        ai_response = llm.invoke(synthesis_prompt)

        ai_content = ai_response.content
        if isinstance(ai_content, list):
            ai_content = " ".join([str(item.get("text", item)) if isinstance(item, dict) else str(item) for item in ai_content])
        elif not isinstance(ai_content, str):
            ai_content = str(ai_content)

        sources = [
            {
                "document_type": r.get("schema_type"),
                "company": r.get("company_name")
            }
            for r in top_candidates
        ]

        return {
            "answer": ai_content,
            "sources": sources,
            "total_sources_found": len(merged_results),
            "expanded_keywords": expanded_keywords,
            "query": request.query,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"RAG query failed: {str(e)}", "answer": None, "sources": []}


# ==========================================================================
# STRUCTURED SEARCH ENDPOINT — Lightning-fast role search for Explore Portal
# ==========================================================================

class SearchRolesRequest(BaseModel):
    query: str
    department: Optional[str] = None
    min_cgpa: Optional[float] = None


@app.post("/api/search-roles")
async def search_roles(request: SearchRolesRequest):
    """
    Structured vector search for the /explore portal.
    Returns raw metadata as JSON — no LLM synthesis, so it's instant.
    """
    try:
        # Step 1: Vectorize the query
        query_vector = rag_embeddings.embed_query(request.query)

        # Step 2: Vector similarity search against Supabase
        rpc_params = {
            "query_embedding": query_vector,
            "match_threshold": 0.45,
            "match_count": 15,
        }
        vector_response = supabase.rpc("match_rag_documents", rpc_params).execute()
        raw_results = vector_response.data or []

        # Step 3: Format into structured role cards
        roles = []
        seen_ids = set()

        for result in raw_results:
            doc_id = result.get("document_id", "")
            if doc_id in seen_ids:
                continue
            seen_ids.add(doc_id)

            schema_type = result.get("schema_type", "unknown")
            company = result.get("company_name") or "Unknown"
            payload = result.get("payload") or {}
            content = result.get("content", "")
            similarity = result.get("similarity", 0)

            # Extract structured fields based on schema type
            role_title = "N/A"
            skills = []
            departments = []
            difficulty = None
            hiring_volume = None
            compensation_tier = None
            description = ""

            if schema_type == "interview":
                entity = payload.get("entity", {})
                pipeline = payload.get("assessment_pipeline", {})
                prep = payload.get("preparation_strategy", {})

                role_title = entity.get("role_title", "N/A")
                departments = entity.get("target_departments", [])
                hiring_volume = entity.get("hiring_volume")
                compensation_tier = entity.get("compensation_tier")

                # Gather skills from OA topics + prep critical topics
                oa = pipeline.get("online_assessment", {})
                if oa:
                    skills.extend(oa.get("core_topics_tested", []))
                    difficulty = oa.get("difficulty_rating")
                if prep:
                    skills.extend(prep.get("critical_topics", []))

                description = f"Interview experience for {role_title} at {company}"

            elif schema_type == "compensation":
                comp = payload.get("specific_compensation_data", {})
                macro = payload.get("macro_placement_context", {})
                if comp:
                    role_title = comp.get("role_title", "N/A")
                    description = f"Compensation data for {role_title} at {company}"
                elif macro:
                    role_title = "Macro Statistics"
                    description = f"IIT KGP placement statistics"
                    company = macro.get("institute", "IIT Kharagpur")

            elif schema_type == "prep_resource":
                details = payload.get("resource_details", {})
                role_title = details.get("resource_title", "Prep Resource")
                skills = details.get("core_theoretical_topics", [])
                departments = details.get("target_disciplines", [])
                description = details.get("description", "")

            elif schema_type == "osint_tool":
                arch = payload.get("tool_architecture", {})
                role_title = arch.get("tool_name", "OSINT Tool")
                skills = arch.get("technology_stack", [])
                description = arch.get("primary_function", "")

            # Deduplicate skills
            skills = list(dict.fromkeys(skills))[:8]

            # Apply department filter (if provided)
            if request.department:
                dept_lower = request.department.lower()
                dept_match = any(dept_lower in d.lower() for d in departments)
                content_match = dept_lower in content.lower()
                if not dept_match and not content_match and departments:
                    continue

            role_card = {
                "company": company,
                "role": role_title,
                "schema_type": schema_type,
                "skills": skills,
                "departments": departments,
                "difficulty": difficulty,
                "hiring_volume": hiring_volume,
                "compensation_tier": compensation_tier,
                "description": description,
                "similarity_score": round(similarity, 3),
                "document_id": doc_id,
            }
            roles.append(role_card)

        # Filter out junk rows (seed artifacts with no real company/role data)
        clean_results = [
            role for role in roles
            if role["company"] not in ("Various", "Unknown", "N/A")
            and role["role"] not in ("N/A", "Macro Statistics")
        ]

        return {
            "results": clean_results,
            "total": len(clean_results),
            "query": request.query,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Search failed: {str(e)}", "results": [], "total": 0}


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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))

