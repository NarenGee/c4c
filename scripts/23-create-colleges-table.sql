n-- Migration: Create colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  country text NOT NULL
);
-- You can extend this with region, ranking, etc. as needed. 