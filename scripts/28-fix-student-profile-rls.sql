-- Fix the student_profiles RLS policy that's blocking student access

-- Drop the broken policy
DROP POLICY IF EXISTS "Extended access to student profiles" ON student_profiles;

-- Recreate the correct policy with proper syntax
CREATE POLICY "Extended access to student profiles"
  ON student_profiles FOR SELECT
  USING (
    -- Students can see their own
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = student_profiles.user_id
      AND users.role = 'student'
    ) OR
    -- Family members
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = student_profiles.user_id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    ) OR
    -- Coaches
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.student_id = student_profiles.user_id
      AND csa.coach_id = auth.uid()
      AND csa.is_active = true
    ) OR
    -- Super admins
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Also ensure students can insert and update their own profiles
CREATE POLICY "Students can manage their own profile"
  ON student_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = student_profiles.user_id
      AND users.role = 'student'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = student_profiles.user_id
      AND users.role = 'student'
    )
  );
