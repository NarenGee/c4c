-- Add unique constraint on user_id to ensure one profile per user
ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_user_id_key UNIQUE (user_id);

-- Add index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id); 