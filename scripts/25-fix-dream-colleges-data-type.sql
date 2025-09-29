-- Migration: Fix dream_colleges data type from uuid[] to text[]
-- This allows us to store college names instead of UUIDs for better user experience

-- First, drop the existing column
ALTER TABLE public.student_profiles
DROP COLUMN IF EXISTS dream_colleges;

-- Add the column back with the correct data type
ALTER TABLE public.student_profiles
ADD COLUMN dream_colleges text[];

-- Add comment for documentation
COMMENT ON COLUMN public.student_profiles.dream_colleges IS 'Array of college names selected as dream colleges by the student';

-- Create index for better performance when searching dream colleges
CREATE INDEX IF NOT EXISTS idx_student_profiles_dream_colleges 
ON public.student_profiles USING GIN (dream_colleges);

-- Update the comment on the table if it exists
COMMENT ON TABLE public.student_profiles IS 'Student profiles with academic information, preferences, and dream colleges';
