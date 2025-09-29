-- Fix the infinite recursion in RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Extended access to student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Students can manage their own profile" ON student_profiles;

-- Create simpler, non-recursive policies for student_profiles
-- Students can manage their own profiles (direct auth.uid() check)
CREATE POLICY "Students can manage their own profile"
  ON student_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Family members can view profiles of connected students
CREATE POLICY "Family members can view student profiles"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = student_profiles.user_id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    )
  );

-- Coaches can view profiles of assigned students
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

-- Super admins can view all profiles (using app metadata instead of users table)
CREATE POLICY "Super admins can view all student profiles"
  ON student_profiles FOR SELECT
  USING (
    (auth.jwt()->>'role')::text = 'super_admin'
  );
