export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ── JOB ───────────────────────────────────────────────────────────────────────
export interface Job {
  id: string
  company: string
  role: string
  ctc: number | null
  currency: string
  location: string | null
  category: string | null
  category_group: string | null
  college_tag: string
  apply_link: string | null
  is_active: boolean
  source: string
  posted_at: string
}

// ── PROFILE ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  college: string
  created_at: string
}

// ── APPLICATION ──────────────────────────────────────────────────────────────
export type ApplicationStatus = 'Preparing' | 'Applied' | 'Shortlisted' | 'Rejected'

export interface Application {
  id: string
  user_id: string
  job_id: string
  status: ApplicationStatus
  notes: string | null
  updated_at: string
}

// Application joined with job data (for dashboard view)
export interface ApplicationWithJob extends Application {
  jobs: Job
}

// ── PREP RESOURCE ─────────────────────────────────────────────────────────────
export interface PrepResource {
  id: string
  company_name: string
  top_topics: string[] | null
  prep_links: Record<string, string> | null
  interview_exp_links: string[] | null
  interview_patterns: string[] | null
  difficulty: 'Easy' | 'Medium' | 'Hard' | null
  avg_rounds: number | null
  company_summary: string | null
  updated_at: string
}

// ── CATEGORY CONFIG ───────────────────────────────────────────────────────────
export interface CategoryConfig {
  group: 'tech' | 'biz' | 'core' | 'other'
  badge: string
  icon: string
  sub: string
}

// ── FILTER STATE ──────────────────────────────────────────────────────────────
export interface FilterState {
  search: string
  category: string        // 'all' or one of the 39 keys
  ctcRange: string        // 'all' | '0-10' | '10-20' | '20-30' | '30-50' | '50+'
  currency: string        // 'all' | 'INR' | 'USD' | ...
  status: string          // 'all' | ApplicationStatus
  sort: 'asc' | 'desc' | 'alpha'
}
