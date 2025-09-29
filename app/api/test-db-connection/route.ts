import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const adminClient = createAdminClient()
    
    // Test basic connection
    const { data: testData, error: testError } = await adminClient
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      return NextResponse.json({ 
        success: false, 
        error: testError.message 
      })
    }

    // Check if trigger exists
    const { data: triggerData, error: triggerError } = await adminClient
      .rpc('exec_sql', {
        sql: `SELECT EXISTS(
          SELECT 1 
          FROM information_schema.triggers 
          WHERE trigger_name = 'on_auth_user_created' 
          AND event_object_table = 'users'
        ) as trigger_exists`
      })

    let triggerExists = false
    if (!triggerError && triggerData && triggerData.length > 0) {
      triggerExists = triggerData[0].trigger_exists
    }

    // Check if we can access auth.users schema
    const { data: authData, error: authError } = await adminClient
      .rpc('exec_sql', {
        sql: `SELECT COUNT(*) as user_count FROM auth.users LIMIT 1`
      })

    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      details: {
        canAccessUsers: !testError,
        triggerExists,
        canAccessAuthUsers: !authError,
        authUserCount: authData ? authData[0]?.user_count : 'unknown'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
} 