-- Enforce at most one in-progress playbook session per student.
-- Run after 44-priority-playbook.sql. Cleans up duplicates before creating the index.

DELETE FROM priority_playbook_sessions a
USING priority_playbook_sessions b
WHERE a.student_id = b.student_id
  AND a.status = 'in_progress'
  AND b.status = 'in_progress'
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_priority_playbook_one_in_progress_per_student
  ON priority_playbook_sessions (student_id)
  WHERE status = 'in_progress';
