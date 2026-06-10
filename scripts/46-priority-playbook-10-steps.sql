-- Expand Priority Playbook to 10 steps (new focus-areas review step after Life Focus Areas)
UPDATE priority_playbook_sessions
SET current_step = current_step + 1
WHERE status = 'in_progress'
  AND current_step >= 3;

ALTER TABLE priority_playbook_sessions
  DROP CONSTRAINT IF EXISTS priority_playbook_sessions_current_step_check;

ALTER TABLE priority_playbook_sessions
  ADD CONSTRAINT priority_playbook_sessions_current_step_check
  CHECK (current_step >= 1 AND current_step <= 10);
