-- Users table policies
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

-- Student profiles policies
create policy "Students can manage their own profile"
  on student_profiles for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = student_profiles.user_id
      and users.role = 'student'
    )
  );

create policy "Parents and counselors can view linked student profiles"
  on student_profiles for select
  using (
    exists (
      select 1 from user_relationships ur
      join users u on u.id = student_profiles.user_id
      where ur.primary_user_id = student_profiles.user_id
      and ur.secondary_user_id = auth.uid()
      and ur.status = 'approved'
    )
  );

-- User relationships policies
create policy "Users can view their own relationships"
  on user_relationships for select
  using (
    auth.uid() = primary_user_id or
    auth.uid() = secondary_user_id
  );

create policy "Students can create relationships"
  on user_relationships for insert
  with check (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.id = primary_user_id
      and users.role = 'student'
    )
  );

create policy "Users can update relationship status"
  on user_relationships for update
  using (
    auth.uid() = primary_user_id or
    auth.uid() = secondary_user_id
  );
