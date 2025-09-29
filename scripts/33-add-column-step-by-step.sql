-- Step-by-step approach to add current_role column

-- Step 1: Add the column (run this first)
ALTER TABLE users ADD COLUMN current_role user_role;

-- Step 2: Update existing records (run this after step 1 succeeds)
-- UPDATE users SET current_role = role WHERE current_role IS NULL;
