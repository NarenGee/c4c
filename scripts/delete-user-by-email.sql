-- Delete User By Email Script
-- This script safely deletes a user and all related data by email address
-- 
-- WARNING: This will permanently delete all user data including:
-- - User profile and authentication
-- - Student profiles and college lists
-- - Coach profiles and assignments
-- - Student-parent/counselor relationships
-- - College matches and recommendations
-- - Notes and email confirmations
-- - User roles and invitations
--
-- USAGE: Replace 'user@example.com' with the actual email address to delete

-- Enable detailed output for debugging
\set VERBOSITY verbose

-- Start transaction for safety
BEGIN;

-- Variables (modify these before running)
\set target_email 'user@example.com'

-- First, let's check if the user exists and show what will be deleted
DO $$
DECLARE
    user_record RECORD;
    user_count INTEGER;
    related_data_summary TEXT := '';
BEGIN
    -- Check if user exists in auth.users
    SELECT INTO user_count COUNT(*) 
    FROM auth.users 
    WHERE email = :'target_email';
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No user found with email: %', :'target_email';
        RETURN;
    END IF;
    
    -- Get user details
    SELECT INTO user_record 
        id, email, created_at, email_confirmed_at
    FROM auth.users 
    WHERE email = :'target_email';
    
    RAISE NOTICE '=== USER DELETION SUMMARY ===';
    RAISE NOTICE 'Email: %', user_record.email;
    RAISE NOTICE 'User ID: %', user_record.id;
    RAISE NOTICE 'Created: %', user_record.created_at;
    RAISE NOTICE 'Email Confirmed: %', COALESCE(user_record.email_confirmed_at::text, 'No');
    RAISE NOTICE '';
    
    -- Check related data in public.users table
    SELECT INTO user_count COUNT(*) 
    FROM public.users 
    WHERE email = :'target_email';
    
    IF user_count > 0 THEN
        related_data_summary := related_data_summary || format('- %s user profile(s)', user_count) || E'\n';
    END IF;
    
    -- Check student profiles
    SELECT INTO user_count COUNT(*) 
    FROM student_profiles sp
    JOIN public.users u ON sp.user_id = u.id
    WHERE u.email = :'target_email';
    
    IF user_count > 0 THEN
        related_data_summary := related_data_summary || format('- %s student profile(s)', user_count) || E'\n';
    END IF;
    
    -- Check coach profiles
    SELECT INTO user_count COUNT(*) 
    FROM coach_profiles cp
    JOIN public.users u ON cp.user_id = u.id
    WHERE u.email = :'target_email';
    
    IF user_count > 0 THEN
        related_data_summary := related_data_summary || format('- %s coach profile(s)', user_count) || E'\n';
    END IF;
    
    -- Check user roles
    SELECT INTO user_count COUNT(*) 
    FROM user_roles ur
    JOIN auth.users au ON ur.user_id = au.id
    WHERE au.email = :'target_email';
    
    IF user_count > 0 THEN
        related_data_summary := related_data_summary || format('- %s user role(s)', user_count) || E'\n';
    END IF;
    
    -- Check college lists
    SELECT INTO user_count COUNT(*) 
    FROM my_college_list mcl
    JOIN public.users u ON mcl.student_id = u.id
    WHERE u.email = :'target_email';
    
    IF user_count > 0 THEN
        related_data_summary := related_data_summary || format('- %s college list entries', user_count) || E'\n';
    END IF;
    
    -- Check student links (as student)
    SELECT INTO user_count COUNT(*) 
    FROM student_links sl
    JOIN public.users u ON sl.student_id = u.id
    WHERE u.email = :'target_email';
    
    IF user_count > 0 THEN
        related_data_summary := related_data_summary || format('- %s student link(s) as student', user_count) || E'\n';
    END IF;
    
    -- Check student links (as linked user)
    SELECT INTO user_count COUNT(*) 
    FROM student_links sl
    JOIN public.users u ON sl.linked_user_id = u.id
    WHERE u.email = :'target_email';
    
    IF user_count > 0 THEN
        related_data_summary := related_data_summary || format('- %s student link(s) as parent/counselor', user_count) || E'\n';
    END IF;
    
    -- Check coach assignments
    SELECT INTO user_count COUNT(*) 
    FROM coach_student_assignments csa
    JOIN public.users u ON (csa.coach_id = u.id OR csa.student_id = u.id)
    WHERE u.email = :'target_email';
    
    IF user_count > 0 THEN
        related_data_summary := related_data_summary || format('- %s coach assignment(s)', user_count) || E'\n';
    END IF;
    
    RAISE NOTICE 'Related data to be deleted:';
    IF related_data_summary = '' THEN
        RAISE NOTICE '- No related data found';
    ELSE
        RAISE NOTICE '%', related_data_summary;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'This deletion will cascade through all related tables due to foreign key constraints.';
    RAISE NOTICE '';
END $$;

-- Prompt for confirmation (you'll need to uncomment the next line when ready to delete)
-- \prompt 'Type "DELETE" to confirm deletion: ' confirmation

-- Perform the actual deletion
-- Note: All related data will be automatically deleted due to CASCADE constraints

DELETE FROM auth.users 
WHERE email = :'target_email';

-- Check deletion result
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT INTO user_count COUNT(*) 
    FROM auth.users 
    WHERE email = :'target_email';
    
    IF user_count = 0 THEN
        RAISE NOTICE 'SUCCESS: User % has been completely deleted from the system.', :'target_email';
    ELSE
        RAISE NOTICE 'ERROR: User % still exists in the system.', :'target_email';
    END IF;
END $$;

-- Commit the transaction
COMMIT;

-- Alternative version for multiple users (uncomment to use)
/*
-- Delete multiple users by email pattern
-- BE EXTREMELY CAREFUL WITH THIS!

BEGIN;

-- Show users that would be deleted
SELECT 
    email, 
    id, 
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email LIKE '%@testdomain.com%';  -- Modify pattern as needed

-- Uncomment the line below to actually delete (after reviewing the list above)
-- DELETE FROM auth.users WHERE email LIKE '%@testdomain.com%';

COMMIT;
*/

-- Individual user deletion template (modify and uncomment to use)
/*
-- Quick single user deletion (replace the email)
DELETE FROM auth.users WHERE email = 'specific@email.com';
*/
