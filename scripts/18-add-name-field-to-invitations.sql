-- Add name field to invitation_tokens table for displaying invitee names
-- Migration script: 18-add-name-field-to-invitations.sql

ALTER TABLE invitation_tokens 
ADD COLUMN IF NOT EXISTS invitee_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN invitation_tokens.invitee_name IS 'Name of the person being invited (parent/guardian or counselor)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_invitee_name ON invitation_tokens(invitee_name); 