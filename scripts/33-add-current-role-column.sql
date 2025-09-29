-- Step 2: Add current_role column to users table

-- First, check if column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='current_role') THEN
        ALTER TABLE users ADD COLUMN current_role user_role;
    END IF;
END $$;

-- Update current_role to match existing role field
UPDATE users SET current_role = role WHERE current_role IS NULL;
