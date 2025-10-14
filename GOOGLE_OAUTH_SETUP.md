# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Coaching for College application.

## Prerequisites

- Supabase project set up
- Google Cloud Console account
- Domain configured for your application

## Step 1: Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)

## Step 2: Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 3: Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Step 4: Database Setup

⚠️ **Note**: If you get an error saying `relation "user_roles" already exists`, you can **SKIP this step** - your database is already configured correctly!

The OAuth integration will automatically create user records in your `user_roles` table. If you need to create this table (only if it doesn't exist), use:

```sql
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'counselor', 'coach', 'super_admin')),
  organization TEXT,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Your `user_roles` table already exists**, so you're good to proceed to Step 5!

## Step 5: Testing

1. Start your development server: `npm run dev`
2. Go to `/login` or `/signup`
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected to `/dashboard`

## Features

- **Automatic User Creation**: New Google OAuth users are automatically created with a 'student' role
- **Seamless Integration**: Works alongside existing email/password authentication
- **Error Handling**: Proper error messages for failed authentication
- **Responsive Design**: Google OAuth button matches your existing design system

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**:
   - Check that your redirect URI in Google Cloud Console matches exactly
   - Ensure the URI is added to both Google Cloud Console and Supabase

2. **"Client ID not found" error**:
   - Verify your Google OAuth credentials are correctly entered in Supabase
   - Check that the Google+ API is enabled

3. **User not created in database**:
   - Check that the `user_roles` table exists
   - Verify the server action has proper permissions

### Debug Steps

1. Check browser console for client-side errors
2. Check server logs for server-side errors
3. Verify Supabase logs in the dashboard
4. Test with a fresh browser session

## Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate your OAuth credentials
- Monitor for suspicious authentication attempts

## Next Steps

After successful setup, consider:
- Adding role selection for OAuth users
- Implementing user profile completion flow
- Adding additional OAuth providers (GitHub, Microsoft, etc.)
- Setting up proper error monitoring
