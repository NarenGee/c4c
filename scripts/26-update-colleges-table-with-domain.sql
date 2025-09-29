-- Migration: Update colleges table to include domain field and populate with CSV data
-- This migration adds the domain field and populates the colleges table with comprehensive data

-- First, add the domain column to the existing colleges table
ALTER TABLE public.colleges 
ADD COLUMN IF NOT EXISTS domain text;

-- Add comment for documentation
COMMENT ON COLUMN public.colleges.domain IS 'College domain/website identifier';

-- Create index for better performance when searching by domain
CREATE INDEX IF NOT EXISTS idx_colleges_domain 
ON public.colleges (domain) 
WHERE domain IS NOT NULL;

-- Create index for better performance when searching by name
CREATE INDEX IF NOT EXISTS idx_colleges_name 
ON public.colleges USING gin(to_tsvector('english', name));

-- Create index for better performance when searching by country
CREATE INDEX IF NOT EXISTS idx_colleges_country 
ON public.colleges (country);

-- Note: The colleges table should be populated with data from colleges_name_country_domain.csv
-- This can be done using Supabase's import functionality or by running a data migration script
-- The CSV contains 10,186 colleges with name, country, and domain information

-- Update the table comment
COMMENT ON TABLE public.colleges IS 'Comprehensive list of colleges and universities with name, country, and domain information for search functionality';



