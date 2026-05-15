-- 1. Create Jobs Table
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  company text not null,
  role text not null,
  ctc numeric,
  currency text default 'INR',
  location text default 'India',
  category text,
  category_group text,
  college_tag text default 'IITKGP',
  apply_link text,
  source text,
  is_active boolean default true,
  posted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (company, role)
);

-- 2. Create Profiles Table (Linked to Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Applications Table (Student tracking)
create type application_status as enum ('Preparing', 'Applied', 'Shortlisted', 'Rejected');

create table public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  status application_status not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, job_id)
);

-- 4. Create Prep Resources Table
create table public.prep_resources (
  id uuid default gen_random_uuid() primary key,
  company_name text unique not null,
  company_summary text,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  avg_rounds integer,
  interview_patterns text[],
  top_topics text[],
  prep_links jsonb default '{}'::jsonb,
  interview_exp_links text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Row Level Security (RLS)
alter table public.jobs enable row level security;
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.prep_resources enable row level security;

-- Jobs are readable by anyone, but only writable by service_role
create policy "Jobs are publicly viewable" on public.jobs for select using (true);

-- Prep Resources are readable by anyone
create policy "Prep resources are publicly viewable" on public.prep_resources for select using (true);

-- Profiles are readable and writable only by the user
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Applications are readable and writable only by the user
create policy "Users can view their own applications" on public.applications for select using (auth.uid() = user_id);
create policy "Users can insert their own applications" on public.applications for insert with check (auth.uid() = user_id);
create policy "Users can update their own applications" on public.applications for update using (auth.uid() = user_id);
create policy "Users can delete their own applications" on public.applications for delete using (auth.uid() = user_id);

-- 6. Automate Profile Creation on Google Sign In
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Seed Initial Prep Data
insert into public.prep_resources (company_name, company_summary, difficulty, avg_rounds, interview_patterns, top_topics, prep_links)
values 
  ('Google', 'Product-based tech giant focused on highly scalable systems.', 'Hard', 4, array['Online Assessment', '2x DSA Interviews', 'System Design', 'Googlyness (HR)'], array['Graphs', 'Dynamic Programming', 'Trees'], '{"LeetCode Tag": "https://leetcode.com/company/google/", "System Design Primer": "https://github.com/donnemartin/system-design-primer"}'),
  ('Microsoft', 'Enterprise software and cloud computing leader.', 'Medium', 3, array['Online Assessment', '2x DSA/System Design', 'As-App (Managerial)'], array['Arrays', 'Strings', 'Linked Lists', 'OOPs'], '{"LeetCode Tag": "https://leetcode.com/company/microsoft/"}'),
  ('Graviton', 'High Frequency Trading firm offering massive compensation.', 'Hard', 5, array['Math/Aptitude Test', 'C++ Low Latency Round', 'Algorithms & OS', 'Quant/Probability'], array['C++ Internals', 'Operating Systems', 'Probability', 'Advanced DSA'], '{}')
on conflict (company_name) do nothing;
