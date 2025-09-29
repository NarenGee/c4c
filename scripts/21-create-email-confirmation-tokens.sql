-- Create email_confirmation_tokens table
CREATE TABLE IF NOT EXISTS email_confirmation_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_token ON email_confirmation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_email ON email_confirmation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_user_id ON email_confirmation_tokens(user_id);

-- Enable RLS
ALTER TABLE email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only allow admins to read/write all tokens
CREATE POLICY "Admin can manage all email confirmation tokens" ON email_confirmation_tokens
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow users to read their own tokens (for verification)
CREATE POLICY "Users can read their own email confirmation tokens" ON email_confirmation_tokens
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Create function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_email_confirmation_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM email_confirmation_tokens 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up expired tokens
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_tokens()
RETURNS trigger AS $$
BEGIN
  -- Clean up expired tokens every time a new token is inserted
  PERFORM cleanup_expired_email_confirmation_tokens();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_tokens_trigger
  AFTER INSERT ON email_confirmation_tokens
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired_tokens();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON email_confirmation_tokens TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 