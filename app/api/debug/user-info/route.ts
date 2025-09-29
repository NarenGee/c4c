import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get user from users table
    const { data: userProfile, error: userError } = await adminClient
      .from("users")
      .select("id, email, full_name, role, \"current_role\", created_at")
      .eq("email", email)
      .single()

    if (userError) {
      return NextResponse.json({
        step: "user_lookup",
        email,
        error: userError.message,
        user_found: false
      })
    }

    // Get all roles for this user
    const { data: userRoles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("*")
      .eq("user_id", userProfile.id)

    if (rolesError) {
      return NextResponse.json({
        step: "roles_lookup",
        email,
        user_profile: userProfile,
        error: rolesError.message
      })
    }

    // Check auth.users table
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userProfile.id)

    return NextResponse.json({
      step: "complete",
      email,
      user_profile: userProfile,
      user_roles: userRoles,
      auth_user: authUser.user ? {
        id: authUser.user.id,
        email: authUser.user.email,
        email_confirmed_at: authUser.user.email_confirmed_at,
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at
      } : null,
      auth_error: authError?.message || null,
      has_super_admin: userRoles?.some(r => r.role === 'super_admin') || false,
      total_roles: userRoles?.length || 0
    })

  } catch (error: any) {
    console.error("User info debug error:", error)
    return NextResponse.json({
      step: "exception",
      error: error.message
    }, { status: 500 })
  }
}


