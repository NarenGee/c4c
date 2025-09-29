-- Run this AFTER running the enum script and committing

-- Create coach profiles table
CREATE TABLE IF NOT EXISTS coach_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  organization text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create coach-student assignments table (managed by super admin)
CREATE TABLE IF NOT EXISTS coach_student_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL, -- super admin who made the assignment
  assigned_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  notes text, -- Admin notes about the assignment
  UNIQUE(coach_id, student_id)
);

-- Create student notes table
CREATE TABLE IF NOT EXISTS student_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE, -- coach or super_admin who wrote the note
  note_type text NOT NULL CHECK (note_type IN ('general', 'application', 'meeting')),
  content text NOT NULL,
  is_private boolean DEFAULT true, -- notes are private by default
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add application status tracking to college list if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'my_college_list' AND column_name = 'application_stage') THEN
    ALTER TABLE my_college_list ADD COLUMN application_stage text 
      CHECK (application_stage IN ('considering', 'planning_to_apply', 'applied', 'interviewing', 'accepted', 'rejected', 'enrolled'))
      DEFAULT 'considering';
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_profiles
CREATE POLICY "Coaches can view and update their own profile"
  ON coach_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = coach_profiles.user_id
      AND users.role = 'coach'
    )
  );

CREATE POLICY "Super admins can manage all coach profiles"
  ON coach_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- RLS Policies for coach_student_assignments
CREATE POLICY "Coaches can view their assigned students"
  ON coach_student_assignments FOR SELECT
  USING (
    coach_id = auth.uid() 
    AND is_active = true
  );

CREATE POLICY "Super admins can manage all assignments"
  ON coach_student_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- RLS Policies for student_notes
CREATE POLICY "Coaches can manage notes for their assigned students"
  ON student_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.coach_id = auth.uid()
      AND csa.student_id = student_notes.student_id
      AND csa.is_active = true
    ) OR
    auth.uid() = author_id
  );

CREATE POLICY "Super admins can manage all student notes"
  ON student_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Update existing RLS policies to include coaches and super admins
DROP POLICY IF EXISTS "Extended access to student data" ON users;
CREATE POLICY "Extended access to student data"
  ON users FOR SELECT
  USING (
    auth.uid() = id OR
    -- Family members via student_links
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = users.id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    ) OR
    -- Coaches via assignments
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.student_id = users.id
      AND csa.coach_id = auth.uid()
      AND csa.is_active = true
    ) OR
    -- Super admins can see everyone
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Update student profiles policy
DROP POLICY IF EXISTS "Extended access to student profiles" ON student_profiles;
CREATE POLICY "Extended access to student profiles"
  ON student_profiles FOR SELECT
  USING (
    -- Students can see their own
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.id = student_profiles.user_id
      AND users.role = 'student'
    ) OR
    -- Family members
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = student_profiles.user_id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    ) OR
    -- Coaches
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.student_id = student_profiles.user_id
      AND csa.coach_id = auth.uid()
      AND csa.is_active = true
    ) OR
    -- Super admins
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Update college list policies
DROP POLICY IF EXISTS "Extended access to college lists" ON my_college_list;
CREATE POLICY "Extended access to college lists"
  ON my_college_list FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM student_links sl
      WHERE sl.student_id = my_college_list.student_id
      AND sl.linked_user_id = auth.uid()
      AND sl.status = 'accepted'
    ) OR
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.student_id = my_college_list.student_id
      AND csa.coach_id = auth.uid()
      AND csa.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Coaches and super admins can update college list" ON my_college_list;
CREATE POLICY "Coaches and super admins can update college list"
  ON my_college_list FOR UPDATE
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM coach_student_assignments csa
      WHERE csa.student_id = my_college_list.student_id
      AND csa.coach_id = auth.uid()
      AND csa.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_student_assignments_coach_id ON coach_student_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_student_assignments_student_id ON coach_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_author_id ON student_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_my_college_list_application_stage ON my_college_list(application_stage);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON coach_profiles(user_id);
