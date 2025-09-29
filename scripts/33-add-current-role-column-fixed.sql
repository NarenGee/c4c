-- Step 2: Add current_role column to users table (Fixed version)

-- First, let's check the current structure of the users table
-- Run this to see what columns exist:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- Add the column with a more explicit approach
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'current_role'
    ) THEN
        -- Add the column
        EXECUTE 'ALTER TABLE public.users ADD COLUMN current_role user_role';
        RAISE NOTICE 'Added current_role column to users table';
    ELSE
        RAISE NOTICE 'current_role column already exists';
    END IF;
END $$;

-- Now update the column with existing role values
DO $$
BEGIN
    -- Only update if the column exists and has NULL values
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'current_role'
    ) THEN
        EXECUTE 'UPDATE public.users SET current_role = role WHERE current_role IS NULL';
        RAISE NOTICE 'Updated current_role values';
    END IF;
END $$;
