-- Enhance student_notes table with additional metadata columns

-- Add college_name column for application-specific notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_notes' 
    AND column_name = 'college_name'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE student_notes ADD COLUMN college_name text;
  END IF;
END $$;

-- Add meeting_date column for meeting notes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_notes' 
    AND column_name = 'meeting_date'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE student_notes ADD COLUMN meeting_date date;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN student_notes.college_name IS 'Optional college name for application-specific notes';
COMMENT ON COLUMN student_notes.meeting_date IS 'Optional meeting date for meeting notes';
COMMENT ON TABLE student_notes IS 'Private notes about students written by coaches and super admins';

-- Show the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'student_notes' 
AND table_schema = 'public'
ORDER BY ordinal_position;


