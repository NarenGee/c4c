-- Add additional columns to student_notes table for enhanced note functionality

-- Add college_name for application-specific notes
ALTER TABLE student_notes 
ADD COLUMN IF NOT EXISTS college_name text;

-- Add meeting_date for meeting notes
ALTER TABLE student_notes 
ADD COLUMN IF NOT EXISTS meeting_date date;

-- Update the table comment
COMMENT ON TABLE student_notes IS 'Private notes about students written by coaches and super admins';
COMMENT ON COLUMN student_notes.college_name IS 'Optional college name for application-specific notes';
COMMENT ON COLUMN student_notes.meeting_date IS 'Optional meeting date for meeting notes';














