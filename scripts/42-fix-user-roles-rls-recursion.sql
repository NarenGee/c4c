-- Fix infinite recursion in user_roles RLS policies
-- The issue is that the policy references the same table it's protecting

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Coaches and super admins can view roles" ON user_roles;

-- Create a simpler policy that doesn't reference user_roles table
-- This policy allows users to manage their own roles and basic role viewing
CREATE POLICY "Users can manage their own roles"
  ON user_roles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create a separate policy for role viewing that doesn't cause recursion
-- This uses a function to check roles instead of a self-referencing query
CREATE POLICY "Allow role viewing for management"
  ON user_roles FOR SELECT
  USING (
    -- Allow users to see their own roles
    user_id = auth.uid()
    OR
    -- Allow super admins to see all roles (using JWT claim)
    (auth.jwt()->>'role')::text = 'super_admin'
    OR
    -- Allow coaches to see roles of their assigned students
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.coach_id = auth.uid()
      AND csa.student_id = user_roles.user_id
      AND csa.is_active = true
    )
  );

-- Ensure the table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;


