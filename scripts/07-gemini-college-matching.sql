-- Create college_matches table for storing AI-generated recommendations
create table college_matches (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id) on delete cascade,
  college_name text not null,
  match_score decimal(3,2) not null check (match_score >= 0 and match_score <= 1),
  justification text not null,
  source_links text[],
  country text,
  city text,
  program_type text,
  estimated_cost text,
  admission_requirements text,
  generated_at timestamp with time zone default now(),
  profile_snapshot jsonb -- Store the student profile used for this recommendation
);

-- Create gemini_logs table for debugging and monitoring AI interactions
create table gemini_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id) on delete cascade,
  prompt_text text not null,
  response_text text,
  model_used text default 'gemini-2.5-flash',
  tokens_used integer,
  processing_time_ms integer,
  success boolean default true,
  error_message text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table college_matches enable row level security;
alter table gemini_logs enable row level security;

-- RLS Policies for college_matches
create policy "Students can view their own college matches"
  on college_matches for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = college_matches.student_id
      and users.role = 'student'
    )
  );

create policy "Students can manage their own college matches"
  on college_matches for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = college_matches.student_id
      and users.role = 'student'
    )
  );

create policy "Parents and counselors can view linked student matches"
  on college_matches for select
  using (
    exists (
      select 1 from user_relationships ur
      where ur.primary_user_id = college_matches.student_id
      and ur.secondary_user_id = auth.uid()
      and ur.status = 'approved'
    )
  );

-- RLS Policies for gemini_logs
create policy "Students can view their own gemini logs"
  on gemini_logs for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = gemini_logs.student_id
      and users.role = 'student'
    )
  );

create policy "Students can insert their own gemini logs"
  on gemini_logs for insert
  with check (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = gemini_logs.student_id
      and users.role = 'student'
    )
  );

-- Create indexes for better performance
create index idx_college_matches_student_id on college_matches(student_id);
create index idx_college_matches_score on college_matches(student_id, match_score desc);
create index idx_gemini_logs_student_id on gemini_logs(student_id);
create index idx_gemini_logs_created_at on gemini_logs(created_at desc);
