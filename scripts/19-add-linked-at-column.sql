-- Add linked_at column to student_links table
alter table student_links add column linked_at timestamp with time zone;

-- Update existing records with linked_at set to created_at for accepted links
update student_links 
set linked_at = created_at 
where status = 'accepted' and linked_at is null;

-- Create an index for better performance on linked_at queries
create index idx_student_links_linked_at on student_links(student_id, linked_at desc); 