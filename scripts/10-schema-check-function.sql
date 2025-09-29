-- Create a function to check student_profiles schema
CREATE OR REPLACE FUNCTION check_student_profiles_schema()
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable text,
    column_default text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.table_name = 'student_profiles'
    ORDER BY c.ordinal_position;
END;
$$; 