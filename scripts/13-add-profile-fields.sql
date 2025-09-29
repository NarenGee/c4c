-- Add new columns for additional profile information
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS country_of_residence TEXT,
ADD COLUMN IF NOT EXISTS state_province TEXT,
ADD COLUMN IF NOT EXISTS college_size TEXT,
ADD COLUMN IF NOT EXISTS campus_setting TEXT,
ADD COLUMN IF NOT EXISTS college_preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS class_rank TEXT;

-- Add comments for documentation
COMMENT ON COLUMN student_profiles.country_of_residence IS 'Student''s country of residence';
COMMENT ON COLUMN student_profiles.state_province IS 'Student''s state/province/region';
COMMENT ON COLUMN student_profiles.college_size IS 'Preferred college size: Small/Medium/Large';
COMMENT ON COLUMN student_profiles.campus_setting IS 'Preferred campus setting: Urban/Suburban/Rural';
COMMENT ON COLUMN student_profiles.college_preferences IS 'Additional college preferences as JSON';
COMMENT ON COLUMN student_profiles.class_rank IS 'Student''s class rank (e.g. "Top 10%", "15 out of 200")';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_country ON student_profiles(country_of_residence);
CREATE INDEX IF NOT EXISTS idx_student_profiles_campus ON student_profiles(campus_setting);
CREATE INDEX IF NOT EXISTS idx_student_profiles_class_rank ON student_profiles(class_rank); 