-- Debug script: Check the current state of users table and enum types

-- 1. Check if user_role enum exists and what values it has
SELECT enumlabel as role_values
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- 2. Check current structure of users table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if current_role column exists
SELECT CASE 
    WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'current_role'
    ) THEN 'current_role column EXISTS'
    ELSE 'current_role column DOES NOT EXIST'
END as column_status;

-- 4. Sample a few users to see current data
SELECT id, email, role, 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'current_role'
    ) THEN 'column exists but check manually'
    ELSE 'column does not exist'
    END as current_role_status
FROM users 
LIMIT 3;
