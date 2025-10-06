-- Create student_task_states table
CREATE TABLE IF NOT EXISTS student_task_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'not_started',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, task_id)
);

-- Drop and recreate student_notes table to avoid constraint issues
DROP TABLE IF EXISTS student_notes CASCADE;

-- Create student_notes table
CREATE TABLE student_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  college_name VARCHAR(255),
  country VARCHAR(100),
  action_status VARCHAR(20),
  priority VARCHAR(50),
  due_date DATE,
  visible_to_student BOOLEAN DEFAULT FALSE,
  parent_note_id UUID REFERENCES student_notes(id) ON DELETE CASCADE,
  is_reply BOOLEAN DEFAULT FALSE
);

-- Add constraints after table creation
ALTER TABLE student_notes 
ADD CONSTRAINT check_type CHECK (type IN ('note', 'action'));

ALTER TABLE student_notes 
ADD CONSTRAINT check_action_status CHECK (action_status IN ('not_started', 'in_progress', 'complete'));

ALTER TABLE student_notes 
ADD CONSTRAINT check_priority CHECK (priority IN ('urgent_important', 'important_not_urgent', 'urgent_not_important', 'not_urgent_not_important'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_task_states_student_id ON student_task_states(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_type ON student_notes(type);
CREATE INDEX IF NOT EXISTS idx_student_notes_created_at ON student_notes(created_at);

-- Enable RLS
ALTER TABLE student_task_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own task states" ON student_task_states;
DROP POLICY IF EXISTS "Students can insert their own task states" ON student_task_states;
DROP POLICY IF EXISTS "Students can update their own task states" ON student_task_states;
DROP POLICY IF EXISTS "Students can delete their own task states" ON student_task_states;

DROP POLICY IF EXISTS "Students can view their own notes" ON student_notes;
DROP POLICY IF EXISTS "Students can insert their own notes" ON student_notes;
DROP POLICY IF EXISTS "Students can update their own notes" ON student_notes;
DROP POLICY IF EXISTS "Students can delete their own notes" ON student_notes;

-- Create RLS policies for student_task_states
CREATE POLICY "Students can view their own task states" ON student_task_states
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own task states" ON student_task_states
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own task states" ON student_task_states
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own task states" ON student_task_states
  FOR DELETE USING (auth.uid() = student_id);

-- Create RLS policies for student_notes
CREATE POLICY "Students can view their own notes" ON student_notes
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own notes" ON student_notes
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own notes" ON student_notes
  FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Students can delete their own notes" ON student_notes
  FOR DELETE USING (auth.uid() = student_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_student_task_states_updated_at ON student_task_states;

-- Create trigger for student_task_states
CREATE TRIGGER update_student_task_states_updated_at
  BEFORE UPDATE ON student_task_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
