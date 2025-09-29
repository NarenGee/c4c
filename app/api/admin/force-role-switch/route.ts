import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// This should be set as an environment variable in production
const SUPER_ADMIN_CODE = process.env.SUPER_ADMIN_CODE || "COACHING4COLLEGE2024!"

export async function POST(request: NextRequest) {
  try {
    const { email, adminCode } = await request.json()

    // Verify admin code
    if (adminCode !== SUPER_ADMIN_CODE) {
      return NextResponse.json(
        { success: false, error: "Invalid admin authorization code" },
        { status: 403 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get user by email
    const { data: user, error: userError } = await adminClient
      .from("users")
      .select("id, email, role, \"current_role\"")
      .eq("email", email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user has super admin role
    const { data: superAdminRole, error: roleError } = await adminClient
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .single()

    if (roleError || !superAdminRole) {
      return NextResponse.json(
        { success: false, error: "User does not have super admin role" },
        { status: 403 }
      )
    }

    // Force update current_role to super_admin
    const { error: updateError } = await adminClient
      .from("users")
      .update({ 
        "current_role": 'super_admin',
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Failed to update role: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Also update user_roles to set super_admin as primary
    const { error: roleUpdateError } = await adminClient
      .from("user_roles")
      .update({ is_primary: false })
      .eq("user_id", user.id)

    if (!roleUpdateError) {
      await adminClient
        .from("user_roles")
        .update({ is_primary: true })
        .eq("user_id", user.id)
        .eq("role", "super_admin")
    }

    // Get updated user info
    const { data: updatedUser } = await adminClient
      .from("users")
      .select("id, email, role, \"current_role\"")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      success: true,
      message: "Role switched to super admin successfully",
      before: user,
      after: updatedUser
    })

  } catch (error: any) {
    console.error("Force role switch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}


