-- Update my_college_list table for Kanban board functionality
-- Migration script: 10-kanban-college-list-update.sql

-- First, update the application_status constraint to support Kanban stages
alter table my_college_list drop constraint if exists my_college_list_application_status_check;

alter table my_college_list add constraint my_college_list_application_status_check 
check (application_status in (
  'Considering', 
  'Planning to Apply', 
  'Applied', 
  'Interviewing', 
  'Accepted', 
  'Rejected', 
  'Enrolled'
));

-- Update default application_status to new Kanban stage
alter table my_college_list alter column application_status set default 'Considering';

-- Add new columns for enhanced functionality
alter table my_college_list add column if not exists is_favorite boolean default false;
alter table my_college_list add column if not exists tasks jsonb default '[]'::jsonb;
alter table my_college_list add column if not exists stage_order integer default 0;

-- Update existing records to new default stage if they have old statuses
update my_college_list set application_status = 'Considering' where application_status = 'Not Started';
update my_college_list set application_status = 'Applied' where application_status = 'In Progress';
update my_college_list set application_status = 'Applied' where application_status = 'Submitted';
update my_college_list set application_status = 'Rejected' where application_status = 'Waitlisted';

-- Create indexes for better performance with new columns
create index if not exists idx_my_college_list_stage on my_college_list(student_id, application_status);
create index if not exists idx_my_college_list_favorite on my_college_list(student_id, is_favorite);
create index if not exists idx_my_college_list_order on my_college_list(student_id, application_status, stage_order);

-- Add some sample task structure comments for reference
comment on column my_college_list.tasks is 'JSON array of tasks: [{"id": "uuid", "text": "Task description", "completed": false, "created_at": "timestamp"}]';
comment on column my_college_list.stage_order is 'Order within the stage column for drag and drop positioning';
comment on column my_college_list.is_favorite is 'Whether this college is marked as favorite by the student'; 