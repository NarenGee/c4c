-- Create user role enum
create type user_role as enum ('student', 'parent', 'counselor');

-- Create users table with role information
create table users (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null,
  role user_role not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create student profiles table
create table student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  grade_level text,
  gpa decimal(3,2),
  sat_score integer,
  act_score integer,
  interests text[],
  preferred_majors text[],
  budget_range text,
  location_preferences text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create user relationships table (for parent-student, counselor-student links)
create table user_relationships (
  id uuid primary key default gen_random_uuid(),
  primary_user_id uuid references users(id) on delete cascade, -- student
  secondary_user_id uuid references users(id) on delete cascade, -- parent or counselor
  relationship_type text not null check (relationship_type in ('parent', 'counselor')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table users enable row level security;
alter table student_profiles enable row level security;
alter table user_relationships enable row level security;
