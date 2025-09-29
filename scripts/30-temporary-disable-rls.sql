-- Temporarily disable RLS on student_profiles to test if that's the issue
-- WARNING: This removes security - only for debugging!

-- Disable RLS temporarily
ALTER TABLE student_profiles DISABLE ROW LEVEL SECURITY;

-- Check what happens - if it works, we know it's an RLS issue
-- Remember to re-enable RLS after testing:
-- ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
