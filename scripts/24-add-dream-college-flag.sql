-- Migration: Add is_dream_college flag to college_matches table
-- This allows us to mark colleges that were selected as dream colleges by the student

ALTER TABLE public.college_matches
ADD COLUMN IF NOT EXISTS is_dream_college BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN public.college_matches.is_dream_college IS 'Indicates if this college was selected as a dream college by the student';

-- Create index for better performance when filtering by dream colleges
CREATE INDEX IF NOT EXISTS idx_college_matches_dream_college 
ON public.college_matches (student_id, is_dream_college) 
WHERE is_dream_college = TRUE;

-- Update existing records to ensure the column exists
UPDATE public.college_matches 
SET is_dream_college = FALSE 
WHERE is_dream_college IS NULL;
