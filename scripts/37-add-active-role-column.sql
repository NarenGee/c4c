-- Alternative: Use 'active_role' instead of 'current_role' to avoid any reserved word issues

-- Add the active_role column 
ALTER TABLE users ADD COLUMN active_role user_role;

-- Update all existing users to have active_role = role
UPDATE users SET active_role = role;

-- Verify the column was added and populated
SELECT id, email, role, active_role 
FROM users 
LIMIT 5;
