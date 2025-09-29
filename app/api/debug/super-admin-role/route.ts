import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { email, adminCode } = await request.json()

    // Validate admin code (simple check for debug)
    const SUPER_ADMIN_CODE = process.env.SUPER_ADMIN_CODE || "COACHING4COLLEGE2024!"
    if (adminCode !== SUPER_ADMIN_CODE) {
      return NextResponse.json(
        { error: "Invalid admin code" },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()

    // Step 1: Check if user exists
    const { data: existingUser, error: userError } = await adminClient
      .from("users")
      .select("id, email, role, \"current_role\"")
      .eq("email", email)
      .single()

    if (userError) {
      return NextResponse.json({
        step: "user_lookup",
        error: userError.message,
        success: false
      })
    }

    if (!existingUser) {
      return NextResponse.json({
        step: "user_not_found",
        error: "User not found",
        success: false
      })
    }

    // Step 2: Check if user already has super admin role
    const { data: existingRole, error: roleCheckError } = await adminClient
      .from("user_roles")
      .select("*")
      .eq("user_id", existingUser.id)
      .eq("role", "super_admin")
      .single()

    if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json({
        step: "role_check",
        error: roleCheckError.message,
        success: false
      })
    }

    if (existingRole) {
      return NextResponse.json({
        step: "role_exists",
        message: "User already has super admin role",
        existing_role: existingRole,
        success: true
      })
    }

    // Step 3: Try to add super admin role
    const { data: newRole, error: insertError } = await adminClient
      .from("user_roles")
      .upsert({
        user_id: existingUser.id,
        role: 'super_admin',
        organization: null,
        is_active: true,
        is_primary: false
      }, {
        onConflict: 'user_id,role'
      })
      .select()

    if (insertError) {
      return NextResponse.json({
        step: "role_insert",
        error: insertError.message,
        error_details: insertError,
        success: false
      })
    }

    // Step 4: Update current_role
    const { error: updateError } = await adminClient
      .from("users")
      .update({ 
        "current_role": 'super_admin',
        updated_at: new Date().toISOString()
      })
      .eq("id", existingUser.id)

    return NextResponse.json({
      step: "complete",
      message: "Super admin role added successfully",
      user_id: existingUser.id,
      new_role: newRole,
      update_error: updateError?.message || null,
      success: true
    })

  } catch (error: any) {
    console.error("Debug super admin role error:", error)
    return NextResponse.json({
      step: "exception",
      error: error.message,
      success: false
    }, { status: 500 })
  }
}


