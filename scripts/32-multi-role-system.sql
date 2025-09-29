-- Multi-role system: Allow users to have multiple roles
-- This allows the same email to be registered as student, parent, coach, etc.

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

-- Add current_role to users table to track active role
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_role user_role;

-- Update users table: current_role should match the role field initially
UPDATE users SET current_role = role WHERE current_role IS NULL;

-- Migrate existing users to user_roles table
INSERT INTO user_roles (user_id, role, is_active, is_primary, organization)
SELECT 
  id as user_id,
  role,
  true as is_active,
  true as is_primary,
  CASE 
    WHEN role = 'coach' THEN (
      SELECT organization FROM coach_profiles WHERE user_id = users.id LIMIT 1
    )
    ELSE NULL
  END as organization
FROM users
ON CONFLICT (user_id, role) DO NOTHING;

-- Create function to switch user roles
CREATE OR REPLACE FUNCTION switch_user_role(target_role user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has this role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = target_role 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'User does not have access to role: %', target_role;
  END IF;
  
  -- Update current_role in users table
  UPDATE users 
  SET current_role = target_role,
      updated_at = now()
  WHERE id = auth.uid();
  
  -- Update primary role in user_roles
  UPDATE user_roles 
  SET is_primary = (role = target_role),
      updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- Create function to add role to existing user
CREATE OR REPLACE FUNCTION add_user_role(target_role user_role, org text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth.uid()) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Add the new role
  INSERT INTO user_roles (user_id, role, organization, is_active, is_primary)
  VALUES (
    auth.uid(), 
    target_role, 
    org,
    true,
    false -- New roles are not primary by default
  )
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = true,
    organization = COALESCE(EXCLUDED.organization, user_roles.organization),
    updated_at = now();
    
  -- If this is the user's first role, make it primary
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND is_primary = true
  ) THEN
    UPDATE user_roles 
    SET is_primary = true 
    WHERE user_id = auth.uid() 
    AND role = target_role;
    
    UPDATE users 
    SET current_role = target_role 
    WHERE id = auth.uid();
  END IF;
  
  -- Create role-specific profiles if needed
  IF target_role = 'coach' AND org IS NOT NULL THEN
    INSERT INTO coach_profiles (user_id, organization)
    VALUES (auth.uid(), org)
    ON CONFLICT (user_id) DO UPDATE SET
      organization = EXCLUDED.organization,
      updated_at = now();
  END IF;
  
  IF target_role = 'student' THEN
    INSERT INTO student_profiles (user_id)
    VALUES (auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION switch_user_role(user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_role(user_role, text) TO authenticated;
