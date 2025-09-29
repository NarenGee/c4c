-- Step 1: Add new enum values (run this first, then commit)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coach';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- COMMIT; -- You need to commit here before proceeding

-- Step 2: Create tables (run this after the above is committed)
-- Copy and run the rest separately after the enum changes are committed
