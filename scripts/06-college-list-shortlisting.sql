-- Create my_college_list table for student college shortlisting
create table my_college_list (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id) on delete cascade,
  college_name text not null,
  college_location text,
  college_type text, -- e.g. 'Public', 'Private', 'Community'
  tuition_range text,
  acceptance_rate decimal(5,2),
  source text not null default 'Manually Added', -- e.g. 'AI Recommended', 'Manually Added', 'Search Result'
  notes text,
  priority integer default 0, -- 1=High, 2=Medium, 3=Low, 0=Not set
  application_status text default 'Not Started' check (application_status in ('Not Started', 'In Progress', 'Submitted', 'Accepted', 'Rejected', 'Waitlisted')),
  application_deadline date,
  added_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(student_id, college_name)
);

-- Enable RLS
alter table my_college_list enable row level security;

-- RLS Policies
create policy "Students can manage their own college list"
  on my_college_list for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = my_college_list.student_id
      and users.role = 'student'
    )
  );

create policy "Parents and counselors can view linked student college lists"
  on my_college_list for select
  using (
    exists (
      select 1 from user_relationships ur
      where ur.primary_user_id = my_college_list.student_id
      and ur.secondary_user_id = auth.uid()
      and ur.status = 'approved'
    )
  );

-- Create indexes for better performance
create index idx_my_college_list_student_id on my_college_list(student_id);
create index idx_my_college_list_priority on my_college_list(student_id, priority);
create index idx_my_college_list_status on my_college_list(student_id, application_status);
