-- 08-update-college-matches-table.sql
-- Adds the extra columns used by the AI recommendation feature.
-- Run this once (or include it in your Supabase Migrations) before
-- re-testing /college-recommendations.

alter table college_matches
  add column if not exists admission_chance  decimal(4,3),   -- 0.000-1.000
  add column if not exists fit_category      text,           -- Safety | Match | Reach
  add column if not exists acceptance_rate   decimal(4,3),   -- public data the AI may supply
  add column if not exists student_count     integer,
  add column if not exists campus_setting    text,           -- Urban | Suburban | Rural
  add column if not exists tuition_annual    text,           -- e.g. "$32,000"
  add column if not exists match_reasons     text[];

-- Optional: index for faster ordering / filtering
create index if not exists idx_college_matches_fit_category
  on college_matches (student_id, fit_category);
