-- Create a function to describe table structure
CREATE OR REPLACE FUNCTION describe_table(table_name text)
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable boolean,
    column_default text,
    constraints text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH column_constraints AS (
        SELECT 
            c.column_name,
            array_agg(tc.constraint_type) as constraints
        FROM 
            information_schema.columns c
            LEFT JOIN information_schema.constraint_column_usage ccu 
                ON c.table_name = ccu.table_name 
                AND c.column_name = ccu.column_name
            LEFT JOIN information_schema.table_constraints tc 
                ON ccu.constraint_name = tc.constraint_name
        WHERE 
            c.table_name = $1
            AND c.table_schema = 'public'
        GROUP BY 
            c.column_name
    )
    SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::boolean,
        c.column_default::text,
        COALESCE(cc.constraints, ARRAY[]::text[])
    FROM 
        information_schema.columns c
        LEFT JOIN column_constraints cc ON c.column_name = cc.column_name
    WHERE 
        c.table_name = $1
        AND c.table_schema = 'public'
    ORDER BY 
        c.ordinal_position;
END;
$$; 