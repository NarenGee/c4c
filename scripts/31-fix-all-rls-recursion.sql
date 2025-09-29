-- Fix all RLS recursion issues by simplifying policies

-- 1. Fix users table policies (remove recursion)
DROP POLICY IF EXISTS "Extended access to student data" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;

-- Simple, non-recursive policies for users table
CREATE POLICY "Users can access their own record"
  ON users FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Fix student_profiles policies (remove any reference to users table)
DROP POLICY IF EXISTS "Students can manage their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Family members can view student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Coaches can view assigned student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Super admins can view all student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Extended access to student profiles" ON student_profiles;

-- Simple, direct policies for student_profiles (no joins with users table)
CREATE POLICY "Users can manage their own student profile"
  ON student_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Family members can view connected student profiles"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = student_profiles.user_id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    )
  );

CREATE POLICY "Coaches can view assigned student profiles"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.student_id = student_profiles.user_id
      AND csa.coach_id = auth.uid()
      AND csa.is_active = true
    )
  );

-- 3. Fix college list policies
DROP POLICY IF EXISTS "Extended access to college lists" ON my_college_list;
DROP POLICY IF EXISTS "Students can manage their own college list" ON my_college_list;

CREATE POLICY "Users can manage their own college list"
  ON my_college_list FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Family members can view college lists"
  ON my_college_list FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = my_college_list.student_id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    )
  );

CREATE POLICY "Coaches can view and update assigned student college lists"
  ON my_college_list FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.student_id = my_college_list.student_id
      AND csa.coach_id = auth.uid()
      AND csa.is_active = true
    )
  );

-- 4. Fix college matches policies
DROP POLICY IF EXISTS "Students can view their own college matches" ON college_matches;

CREATE POLICY "Users can view their own college matches"
  ON college_matches FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Family members can view college matches"
  ON college_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = college_matches.student_id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    )
  );

CREATE POLICY "Coaches can view assigned student college matches"
  ON college_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.student_id = college_matches.student_id
      AND csa.coach_id = auth.uid()
      AND csa.is_active = true
    )
  );
