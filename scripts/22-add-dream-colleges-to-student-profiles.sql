-- Migration: Add dream_colleges field to student_profiles
ALTER TABLE public.student_profiles
ADD COLUMN dream_colleges uuid[]; 