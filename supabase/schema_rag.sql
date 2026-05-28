-- ==========================================================================
-- RAG Document Store Schema
-- Extends the existing placement-saas database with tables for storing
-- normalized OSINT intelligence payloads and their vector embeddings.
-- ==========================================================================

-- Enable pgvector extension (required for vector similarity search)
-- NOTE: Run this in Supabase SQL Editor. If pgvector is already enabled, this is a no-op.
create extension if not exists vector with schema extensions;

-- --------------------------------------------------------------------------
-- 1. RAG Documents Table
-- Stores the full normalized JSON payload for each extracted document.
-- Supports 4 schema types: interview, compensation, prep_resource, osint_tool
-- --------------------------------------------------------------------------
create table if not exists public.rag_documents (
  id uuid default gen_random_uuid() primary key,
  document_id text unique not null,
  schema_type text not null check (schema_type in ('interview', 'compensation', 'prep_resource', 'osint_tool')),
  source_type text not null,
  source_url text,
  academic_year text,
  company_name text,
  role_title text,
  payload jsonb not null,
  extraction_date timestamp with time zone default timezone('utc'::text, now()) not null,
  confidence_score numeric default 0.8,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for common query patterns
create index if not exists idx_rag_documents_schema_type on public.rag_documents(schema_type);
create index if not exists idx_rag_documents_company on public.rag_documents(company_name);
create index if not exists idx_rag_documents_academic_year on public.rag_documents(academic_year);
create index if not exists idx_rag_documents_source_type on public.rag_documents(source_type);

-- GIN index on payload for JSONB queries (e.g., payload->>'company_name')
create index if not exists idx_rag_documents_payload on public.rag_documents using gin(payload);

-- --------------------------------------------------------------------------
-- 2. RAG Document Embeddings Table
-- Stores vector embeddings for semantic similarity search.
-- Each document can have one embedding (the flattened natural-language summary).
-- --------------------------------------------------------------------------
create table if not exists public.rag_document_embeddings (
  id uuid default gen_random_uuid() primary key,
  document_id text not null references public.rag_documents(document_id) on delete cascade,
  content text not null,
  embedding vector(3072),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- Unique constraint: one embedding per document
create unique index if not exists idx_rag_embeddings_doc_id on public.rag_document_embeddings(document_id);

-- --------------------------------------------------------------------------
-- 3. Row Level Security
-- --------------------------------------------------------------------------
alter table public.rag_documents enable row level security;
alter table public.rag_document_embeddings enable row level security;

-- RAG documents are publicly readable (the data is OSINT, meant to be shared)
create policy "RAG documents are publicly viewable"
  on public.rag_documents for select using (true);

-- RAG embeddings are publicly readable (needed for vector search)
create policy "RAG embeddings are publicly viewable"
  on public.rag_document_embeddings for select using (true);

-- --------------------------------------------------------------------------
-- 4. Similarity Search Function
-- Called by the RAG query engine to find the most relevant documents.
-- --------------------------------------------------------------------------
create or replace function match_rag_documents(
  query_embedding vector(3072),
  match_threshold float default 0.5,
  match_count int default 10,
  filter_schema_type text default null,
  filter_company text default null
)
returns table (
  document_id text,
  content text,
  similarity float,
  schema_type text,
  company_name text,
  payload jsonb
)
language plpgsql
as $$
begin
  return query
  select
    rd.document_id,
    rde.content,
    1 - (rde.embedding <=> query_embedding) as similarity,
    rd.schema_type,
    rd.company_name,
    rd.payload
  from public.rag_document_embeddings rde
  join public.rag_documents rd on rd.document_id = rde.document_id
  where
    1 - (rde.embedding <=> query_embedding) > match_threshold
    and (filter_schema_type is null or rd.schema_type = filter_schema_type)
    and (filter_company is null or rd.company_name ilike '%' || filter_company || '%')
  order by rde.embedding <=> query_embedding
  limit match_count;
end;
$$;
