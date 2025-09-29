-- 16-add-website-url-column.sql
-- Adds the website_url column to the college_matches table
-- Run this in your Supabase SQL Editor

alter table college_matches
  add column if not exists website_url text;

-- Optional: add an index for better performance when filtering by website presence
create index if not exists idx_college_matches_website_url
  on college_matches (student_id, website_url) where website_url is not null; 