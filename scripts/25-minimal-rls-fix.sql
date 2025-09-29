-- Minimal RLS fix - only allow users to view their own profiles for now

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all policies
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

-- Create ONLY the basic self-access policy (no cross-table references)
CREATE POLICY "users_basic_access"
  ON users FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Test: Let's verify this works before adding the complex student_links logic


