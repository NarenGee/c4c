-- Check the actual status of the current_role column

-- Check if current_role column exists (both quoted and unquoted)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name LIKE '%role%'
ORDER BY column_name;

-- Check actual data in the column (try both ways)
SELECT id, email, role, 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_role') 
    THEN 'current_role exists (unquoted)'
    ELSE 'current_role does not exist (unquoted)'
  END as unquoted_status
FROM users LIMIT 3;

-- Try to see if quoted version has data
DO $$
BEGIN
  BEGIN
    PERFORM "current_role" FROM users LIMIT 1;
    RAISE NOTICE 'Quoted current_role column exists and is accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Quoted current_role column issue: %', SQLERRM;
  END;
END $$;
