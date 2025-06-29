-- Create student_links table for managing parent/counselor relationships
create table student_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id) on delete cascade,
  linked_user_id uuid references users(id) on delete cascade,
  relationship text not null check (relationship in ('parent', 'counselor')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  invited_email text not null,
  invitation_token uuid default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(student_id, linked_user_id)
);

-- Enable RLS
alter table student_links enable row level security;

-- RLS Policies for student_links
create policy "Students can manage their own links"
  on student_links for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = student_links.student_id
      and users.role = 'student'
    )
  );

create policy "Linked users can view their relationships"
  on student_links for select
  using (
    linked_user_id = auth.uid() or
    student_id = auth.uid()
  );

create policy "Linked users can update relationship status"
  on student_links for update
  using (
    linked_user_id = auth.uid()
  )
  with check (
    linked_user_id = auth.uid()
  );

-- Create invitation tokens table for email invitations
create table invitation_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  student_id uuid references users(id) on delete cascade,
  relationship text not null check (relationship in ('parent', 'counselor')),
  token uuid not null default gen_random_uuid(),
  expires_at timestamp with time zone not null default (now() + interval '7 days'),
  used boolean default false,
  created_at timestamp with time zone default now()
);

alter table invitation_tokens enable row level security;

create policy "Students can manage their invitations"
  on invitation_tokens for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = invitation_tokens.student_id
      and users.role = 'student'
    )
  );
