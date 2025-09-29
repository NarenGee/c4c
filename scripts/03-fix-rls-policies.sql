-- Drop existing policies to recreate them properly
drop policy if exists "Users can view their own profile" on users;
drop policy if exists "Users can update their own profile" on users;
drop policy if exists "Parents and counselors can view linked students" on users;

-- Create comprehensive RLS policies for users table
create policy "Users can insert their own profile during signup"
  on users for insert
  with check (auth.uid() = id);

create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on users for update
  using (auth.uid() = id);

create policy "Parents and counselors can view linked students"
  on users for select
  using (
    auth.uid() = id or
    exists (
      select 1 from user_relationships ur
      where ur.primary_user_id = users.id
      and ur.secondary_user_id = auth.uid()
      and ur.status = 'approved'
    )
  );

-- Fix student profiles policies
drop policy if exists "Students can manage their own profile" on student_profiles;

create policy "Students can insert their own profile"
  on student_profiles for insert
  with check (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = student_profiles.user_id
      and users.role = 'student'
    )
  );

create policy "Students can view their own profile"
  on student_profiles for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = student_profiles.user_id
      and users.role = 'student'
    )
  );

create policy "Students can update their own profile"
  on student_profiles for update
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = student_profiles.user_id
      and users.role = 'student'
    )
  );
