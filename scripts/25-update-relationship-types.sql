-- Update relationship constraints to replace 'counselor' with 'other'

-- Update student_links table constraint
ALTER TABLE student_links DROP CONSTRAINT IF EXISTS student_links_relationship_check;
ALTER TABLE student_links ADD CONSTRAINT student_links_relationship_check 
  CHECK (relationship IN ('parent', 'other'));

-- Update invitation_tokens table constraint  
ALTER TABLE invitation_tokens DROP CONSTRAINT IF EXISTS invitation_tokens_relationship_check;
ALTER TABLE invitation_tokens ADD CONSTRAINT invitation_tokens_relationship_check 
  CHECK (relationship IN ('parent', 'other'));

-- Update any existing 'counselor' relationships to 'other'
UPDATE student_links SET relationship = 'other' WHERE relationship = 'counselor';
UPDATE invitation_tokens SET relationship = 'other' WHERE relationship = 'counselor';

-- Update the user_relationships table constraint (if still used)
ALTER TABLE user_relationships DROP CONSTRAINT IF EXISTS user_relationships_relationship_type_check;
ALTER TABLE user_relationships ADD CONSTRAINT user_relationships_relationship_type_check 
  CHECK (relationship_type IN ('parent', 'other'));

UPDATE user_relationships SET relationship_type = 'other' WHERE relationship_type = 'counselor';
```

