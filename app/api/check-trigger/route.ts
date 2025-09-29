import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const adminClient = createAdminClient()
    
    // Check if trigger exists
    const { data: triggerCheck, error: triggerError } = await adminClient
      .rpc('exec_sql', {
        sql: `
          SELECT 
            trigger_name,
            event_object_table,
            action_timing,
            event_manipulation
          FROM information_schema.triggers 
          WHERE trigger_name = 'on_auth_user_created'
        `
      })

    // Check recent auth users
    const { data: recentUsers, error: usersError } = await adminClient
      .rpc('exec_sql', {
        sql: `
          SELECT 
            id,
            email,
            raw_user_meta_data,
            created_at
          FROM auth.users 
          ORDER BY created_at DESC 
          LIMIT 5
        `
      })

    // Check if user profiles exist for recent users
    const { data: userProfiles, error: profilesError } = await adminClient
      .rpc('exec_sql', {
        sql: `
          SELECT 
            id,
            email,
            full_name,
            role,
            created_at
          FROM public.users 
          ORDER BY created_at DESC 
          LIMIT 5
        `
      })

    return NextResponse.json({ 
      success: true,
      trigger: {
        exists: triggerCheck && triggerCheck.length > 0,
        details: triggerCheck,
        error: triggerError
      },
      authUsers: {
        count: recentUsers?.length || 0,
        users: recentUsers,
        error: usersError
      },
      userProfiles: {
        count: userProfiles?.length || 0,
        profiles: userProfiles,
        error: profilesError
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
} 