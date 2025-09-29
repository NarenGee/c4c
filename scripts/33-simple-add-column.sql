-- Simple approach: Add current_role column to users table

-- First, let's see what we're working with
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
