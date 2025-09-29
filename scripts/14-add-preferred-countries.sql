-- Add new column for preferred countries
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS preferred_countries TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN student_profiles.preferred_countries IS 'Array of countries where the student would like to study';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_preferred_countries ON student_profiles USING GIN(preferred_countries); 