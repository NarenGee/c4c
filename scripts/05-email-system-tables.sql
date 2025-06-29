-- Create email invitations tracking table
create table email_invitations (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  student_name text not null,
  student_email text not null,
  relationship text not null check (relationship in ('parent', 'counselor')),
  invitation_token uuid not null,
  is_existing_user boolean not null default false,
  email_sent boolean default false,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create user notifications table for existing users
create table user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  type text not null,
  title text not null,
  message text not null,
  data jsonb,
  read boolean default false,
  created_at timestamp with time zone default now(),
  read_at timestamp with time zone
);

-- Enable RLS
alter table email_invitations enable row level security;
alter table user_notifications enable row level security;

-- RLS policies for email_invitations
create policy "Students can view their own invitations"
  on email_invitations for select
  using (
    exists (
      select 1 from users
      where users.email = email_invitations.student_email
      and users.id = auth.uid()
      and users.role = 'student'
    )
  );

-- RLS policies for user_notifications  
create policy "Users can view their own notifications"
  on user_notifications for select
  using (
    exists (
      select 1 from users
      where users.email = user_notifications.user_email
      and users.id = auth.uid()
    )
  );

create policy "Users can update their own notifications"
  on user_notifications for update
  using (
    exists (
      select 1 from users
      where users.email = user_notifications.user_email
      and users.id = auth.uid()
    )
  );
