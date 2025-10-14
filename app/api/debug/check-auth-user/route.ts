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

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserByEmail(email)

    if (authError) {
      return NextResponse.json({
        exists_in_auth: false,
        auth_error: authError.message,
        email
      })
    }

    // Check if user exists in our users table
    const { data: userProfile, error: profileError } = await adminClient
      .from("users")
      .select("id, email, role, \"current_role\", created_at")
      .eq("email", email)
      .single()

    // Get user roles if profile exists
    let userRoles = null
    if (userProfile) {
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("*")
        .eq("user_id", userProfile.id)
      userRoles = roles
    }

    return NextResponse.json({
      email,
      exists_in_auth: !!authUser.user,
      exists_in_profile: !!userProfile,
      auth_user: authUser.user ? {
        id: authUser.user.id,
        email: authUser.user.email,
        email_confirmed_at: authUser.user.email_confirmed_at,
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
        user_metadata: authUser.user.user_metadata
      } : null,
      user_profile: userProfile,
      user_roles: userRoles,
      profile_error: profileError?.message || null,
      diagnosis: {
        can_login: !!authUser.user && !!authUser.user.email_confirmed_at,
        needs_confirmation: !!authUser.user && !authUser.user.email_confirmed_at,
        missing_from_auth: !authUser.user,
        missing_from_profile: !userProfile
      }
    })

  } catch (error: any) {
    console.error("Check auth user error:", error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}











