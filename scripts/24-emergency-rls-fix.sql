-- Emergency RLS fix - completely reset users table policies

-- First, disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies (being very explicit)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON users';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a single, simple policy for all SELECT operations
CREATE POLICY "users_select_policy"
  ON users FOR SELECT
  USING (
    -- Users can view their own profile
    auth.uid() = id
    OR
    -- Parents and counselors can view linked students
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    )
  );

-- Create separate policies for other operations
CREATE POLICY "users_insert_policy"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_policy"
  ON users FOR UPDATE
  USING (auth.uid() = id);


