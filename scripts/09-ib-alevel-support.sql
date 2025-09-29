-- Add IB and A-Level support to student_profiles table
-- Run this migration to add new columns for academic data

ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS grading_system TEXT,
ADD COLUMN IF NOT EXISTS a_level_subjects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ib_subjects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ib_total_points INTEGER,
ADD COLUMN IF NOT EXISTS extracurricular_details JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN student_profiles.grading_system IS 'Primary grading system: US GPA, International Baccalaureate (IB), A-Levels, Other';
COMMENT ON COLUMN student_profiles.a_level_subjects IS 'Array of A-Level subjects with grades: [{"subject": "Mathematics", "grade": "A*"}]';
COMMENT ON COLUMN student_profiles.ib_subjects IS 'Array of IB subjects with levels and grades: [{"subject": "Mathematics HL", "level": "HL", "grade": "7"}]';
COMMENT ON COLUMN student_profiles.ib_total_points IS 'Total IB score out of 45 points';
COMMENT ON COLUMN student_profiles.extracurricular_details IS 'Array of extracurricular activities with tiers and descriptions: [{"activity": "Student Government", "tier": "2", "description": "Class President"}]';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_grading_system ON student_profiles(grading_system);
CREATE INDEX IF NOT EXISTS idx_student_profiles_ib_total_points ON student_profiles(ib_total_points) WHERE ib_total_points IS NOT NULL; 