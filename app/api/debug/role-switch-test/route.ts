import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const supabase = await createClient()

    // Step 1: Check current user from getCurrentUser
    const currentUser = await getCurrentUser()

    // Step 2: Check users table current_role
    const { data: userProfile, error: profileError } = await adminClient
      .from("users")
      .select("id, email, role, \"current_role\"")
      .eq("id", userId)
      .single()

    // Step 3: Check user_roles table
    const { data: userRoles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)

    // Step 4: Try to switch role
    const { error: switchError } = await supabase.rpc('switch_user_role', {
      target_role: 'super_admin'
    })

    // Step 5: Check current_role after switch
    const { data: updatedProfile, error: updatedError } = await adminClient
      .from("users")
      .select("id, email, role, \"current_role\"")
      .eq("id", userId)
      .single()

    // Step 6: Check auth session
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()

    return NextResponse.json({
      step: "complete",
      userId,
      current_user_from_lib: currentUser,
      user_profile_before: userProfile,
      user_roles: userRoles,
      switch_error: switchError?.message || null,
      user_profile_after: updatedProfile,
      auth_session_user: user ? {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      } : null,
      session_error: sessionError?.message || null,
      profile_error: profileError?.message || null,
      roles_error: rolesError?.message || null,
      updated_error: updatedError?.message || null
    })

  } catch (error: any) {
    console.error("Role switch test error:", error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}


