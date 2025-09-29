-- Add current_role column using quoted identifiers to avoid reserved word issues

-- Add the current_role column with quoted identifier
ALTER TABLE users ADD COLUMN "current_role" user_role;

-- Update all existing users to have current_role = role
UPDATE users SET "current_role" = role;

-- Verify the column was added and populated
SELECT id, email, role, "current_role" 
FROM users 
LIMIT 5;
