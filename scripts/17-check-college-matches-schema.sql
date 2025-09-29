-- 17-check-college-matches-schema.sql
-- Diagnostic script to check if all required columns exist in college_matches table
-- Run this in your Supabase SQL Editor to verify your schema

-- Check all columns in college_matches table
select column_name, data_type, is_nullable
from information_schema.columns 
where table_name = 'college_matches' 
  and table_schema = 'public'
order by ordinal_position;

-- Check if all required columns exist
select 
  case 
    when count(*) >= 16 then 'All required columns present'
    else 'Missing columns - expected 16, found ' || count(*)
  end as schema_status
from information_schema.columns 
where table_name = 'college_matches' 
  and table_schema = 'public'
  and column_name in (
    'id', 'student_id', 'college_name', 'match_score', 'justification',
    'source_links', 'country', 'city', 'program_type', 'estimated_cost',
    'admission_requirements', 'generated_at', 'profile_snapshot',
    'admission_chance', 'fit_category', 'acceptance_rate', 'student_count',
    'campus_setting', 'tuition_annual', 'match_reasons', 'website_url'
  ); 