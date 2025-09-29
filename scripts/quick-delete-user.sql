-- Quick User Deletion Script
-- Simple script to delete a user by email address
-- 
-- WARNING: This permanently deletes all user data!
-- All related data will be automatically deleted due to CASCADE constraints.
--
-- INSTRUCTIONS:
-- 1. Replace 'user@example.com' with the actual email
-- 2. Run this script in your Supabase SQL editor

-- Method 1: Direct deletion (replace email address)
DELETE FROM auth.users 
WHERE email = 'user@example.com';

-- Method 2: Check before deletion (safer approach)
-- Step 1: First check what exists
/*
SELECT 
    u.email,
    u.id,
    u.created_at,
    u.email_confirmed_at,
    pu.full_name,
    pu.role
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
WHERE u.email = 'user@example.com';
*/

-- Step 2: Then delete if confirmed
/*
DELETE FROM auth.users 
WHERE email = 'user@example.com';
*/

-- Method 3: Delete multiple users by pattern (BE VERY CAREFUL!)
/*
-- First see what would be deleted:
SELECT email, id, created_at FROM auth.users 
WHERE email LIKE '%@testdomain.com';

-- Then delete if confirmed:
DELETE FROM auth.users 
WHERE email LIKE '%@testdomain.com';
*/

-- Verification: Check if user was deleted
/*
SELECT COUNT(*) as remaining_users 
FROM auth.users 
WHERE email = 'user@example.com';
-- Should return 0 if deletion was successful
*/
