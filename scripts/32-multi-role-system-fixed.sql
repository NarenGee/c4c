-- Multi-role system: Allow users to have multiple roles
-- Step 1: Create user_roles table and basic structure

-- Create user_roles table to store multiple roles per user
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  organization text, -- For coach/counselor roles
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false, -- One role should be primary
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role) -- Prevent duplicate role assignments
);

-- Add RLS to user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can manage their own roles
CREATE POLICY "Users can manage their own roles"
  ON user_roles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coaches and super admins can view roles for management purposes
CREATE POLICY "Coaches and super admins can view roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('coach', 'super_admin')
      AND ur.is_active = true
    )
  );
