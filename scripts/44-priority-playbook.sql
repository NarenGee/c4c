-- Priority Playbook sessions for live workshop exercises
CREATE TABLE IF NOT EXISTS priority_playbook_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_step INT NOT NULL DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 9),
  session_number INT NOT NULL DEFAULT 1,
  reflection JSONB DEFAULT '{}'::jsonb,
  focus_areas JSONB DEFAULT '[]'::jsonb,
  future_self JSONB DEFAULT '{}'::jsonb,
  goals JSONB DEFAULT '[]'::jsonb,
  other_tasks JSONB DEFAULT '[]'::jsonb,
  rock_sort JSONB DEFAULT '{"big_rocks":[],"gravel":[],"sand":[]}'::jsonb,
  matrix JSONB DEFAULT '[]'::jsonb,
  matrix_reflection JSONB DEFAULT '{}'::jsonb,
  synced_to_dashboard_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_priority_playbook_student_id ON priority_playbook_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_priority_playbook_status ON priority_playbook_sessions(student_id, status);

ALTER TABLE priority_playbook_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own playbook sessions" ON priority_playbook_sessions;
DROP POLICY IF EXISTS "Students can insert own playbook sessions" ON priority_playbook_sessions;
DROP POLICY IF EXISTS "Students can update own playbook sessions" ON priority_playbook_sessions;
DROP POLICY IF EXISTS "Students can delete own playbook sessions" ON priority_playbook_sessions;
DROP POLICY IF EXISTS "Coaches can view completed playbook sessions" ON priority_playbook_sessions;

CREATE POLICY "Students can view own playbook sessions" ON priority_playbook_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own playbook sessions" ON priority_playbook_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own playbook sessions" ON priority_playbook_sessions
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can delete own playbook sessions" ON priority_playbook_sessions
  FOR DELETE USING (auth.uid() = student_id);

CREATE POLICY "Coaches can view completed playbook sessions" ON priority_playbook_sessions
  FOR SELECT USING (
    status = 'completed'
    AND EXISTS (
      SELECT 1 FROM coach_student_assignments
      WHERE coach_student_assignments.coach_id = auth.uid()
      AND coach_student_assignments.student_id = priority_playbook_sessions.student_id
      AND coach_student_assignments.is_active = true
    )
  );

DROP TRIGGER IF EXISTS update_priority_playbook_sessions_updated_at ON priority_playbook_sessions;

CREATE TRIGGER update_priority_playbook_sessions_updated_at
  BEFORE UPDATE ON priority_playbook_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
