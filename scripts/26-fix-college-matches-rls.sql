-- Fix RLS policies for college_matches table to allow AI-generated recommendations

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'college_matches';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only see their own college matches" ON college_matches;
DROP POLICY IF EXISTS "Users can only insert their own college matches" ON college_matches;
DROP POLICY IF EXISTS "Users can only update their own college matches" ON college_matches;
DROP POLICY IF EXISTS "Users can only delete their own college matches" ON college_matches;

-- Create more permissive policies that allow server-side insertion
CREATE POLICY "Users can view their own college matches" 
  ON college_matches FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Users and system can insert college matches" 
  ON college_matches FOR INSERT 
  WITH CHECK (
    auth.uid() = student_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Users and system can update college matches" 
  ON college_matches FOR UPDATE 
  USING (auth.uid() = student_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = student_id OR auth.role() = 'service_role');

CREATE POLICY "Users and system can delete college matches" 
  ON college_matches FOR DELETE 
  USING (auth.uid() = student_id OR auth.role() = 'service_role');

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'college_matches';
