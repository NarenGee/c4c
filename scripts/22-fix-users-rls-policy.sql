-- Fix RLS policy on users table to work with student_links instead of user_relationships

-- First, let's check what policies currently exist
-- You can run this to see current policies:
-- SELECT schemaname, tablename, policyname, cmd, qual FROM pg_policies WHERE tablename = 'users';

-- Drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile during signup" ON users;
DROP POLICY IF EXISTS "Parents and counselors can view linked students" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can insert their own profile during signup"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view profiles they have access to"
  ON users FOR SELECT
  USING (
    -- Users can view their own profile
    auth.uid() = id
    OR
    -- Parents and counselors can view linked students
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = users.id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
