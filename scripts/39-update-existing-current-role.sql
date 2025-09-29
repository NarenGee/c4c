-- Since current_role column exists (quoted), let's just update it

-- Update the existing "current_role" column with role values
UPDATE users SET "current_role" = role WHERE "current_role" IS NULL;

-- Check the results
SELECT id, email, role, "current_role" 
FROM users 
LIMIT 5;
