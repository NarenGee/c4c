-- Create a function to handle user profile creation and invitation processing
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  invitation_token_id UUID;
  invitation_record RECORD;
BEGIN
  -- Get user metadata from the auth.users record
  user_metadata := NEW.raw_user_meta_data;
  
  -- Extract data from metadata
  IF user_metadata IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create user profile
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(user_metadata->>'full_name', NEW.email),
    COALESCE(user_metadata->>'role', 'student')::user_role,
    NOW(),
    NOW()
  );
  
  -- Create student profile if role is student
  IF (user_metadata->>'role') = 'student' THEN
    INSERT INTO public.student_profiles (
      user_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NOW(),
      NOW()
    );
  END IF;
  
  -- Handle invitation processing if invitation_token is present
  invitation_token_id := (user_metadata->>'invitation_token')::UUID;
  
  IF invitation_token_id IS NOT NULL THEN
    -- Get the invitation record
    SELECT * INTO invitation_record
    FROM public.invitation_tokens
    WHERE id = invitation_token_id
      AND email = NEW.email
      AND used = false
      AND expires_at > NOW();
    
    IF FOUND THEN
      -- Create student link
      INSERT INTO public.student_links (
        student_id,
        linked_user_id,
        relationship,
        status,
        invited_email,
        linked_at,
        created_at,
        updated_at
      ) VALUES (
        invitation_record.student_id,
        NEW.id,
        invitation_record.relationship,
        'accepted',
        NEW.email,
        NOW(),
        NOW(),
        NOW()
      );
      
      -- Mark invitation as used
      UPDATE public.invitation_tokens
      SET used = true
      WHERE id = invitation_token_id;
      
      -- Log successful invitation processing
      RAISE LOG 'Successfully processed invitation % for user %', invitation_token_id, NEW.id;
    ELSE
      -- Log if invitation not found or invalid
      RAISE LOG 'Invitation token % not found or invalid for user %', invitation_token_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.users TO supabase_auth_admin;
GRANT ALL ON public.student_profiles TO supabase_auth_admin;
GRANT ALL ON public.student_links TO supabase_auth_admin;
GRANT ALL ON public.invitation_tokens TO supabase_auth_admin; 