# Supabase Setup Guide

## Issue
You're getting an error when trying to save your profile because Supabase is not properly configured. The error shows `{}` because the application is using a mock client instead of a real Supabase connection.

## Solution

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter a project name (e.g., "college-search-tool")
6. Enter a database password
7. Choose a region close to you
8. Click "Create new project"

### 2. Get Your Project Credentials
1. In your Supabase dashboard, go to Settings → API
2. Copy the "Project URL" (looks like: `https://your-project-id.supabase.co`)
3. Copy the "anon public" key (starts with `eyJ...`)

### 3. Create Environment File
1. In your project root directory, create a file called `.env.local`
2. Add the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace the values with your actual Supabase project URL and anon key.

### 4. Set Up Database Schema
1. In your Supabase dashboard, go to SQL Editor
2. Run the SQL scripts in the `scripts/` folder in order:
   - `01-create-user-roles.sql`
   - `02-create-rls-policies.sql`
   - `03-fix-rls-policies.sql`
   - `04-create-student-links.sql`
   - `05-email-system-tables.sql`
   - `06-college-list-shortlisting.sql`
   - `07-gemini-college-matching.sql`
   - `08-update-college-matches-table.sql`
   - `09-ib-alevel-support.sql`

### 5. Restart Your Development Server
```bash
npm run dev
```

### 6. Test the Application
1. Go to your application
2. Try to sign up or log in
3. Try to save your profile again

## Troubleshooting

### If you still get errors:
1. Check the browser console for more detailed error messages
2. Make sure your `.env.local` file is in the root directory
3. Verify that your Supabase project is active
4. Check that all SQL scripts have been executed successfully
5. Ensure your database has the required tables and policies

### Common Issues:
- **"Supabase not configured"**: Your environment variables are missing or incorrect
- **"Authentication error"**: There's an issue with the auth configuration
- **"Database error"**: The database schema might not be set up correctly

## Need Help?
If you continue to have issues, check the browser console for detailed error messages and ensure all the setup steps have been completed correctly. 