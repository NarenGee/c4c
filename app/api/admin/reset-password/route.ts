import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// This should be set as an environment variable in production
const SUPER_ADMIN_CODE = process.env.SUPER_ADMIN_CODE || "COACHING4COLLEGE2024!"

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, adminCode } = await request.json()

    // Verify admin code
    if (adminCode !== SUPER_ADMIN_CODE) {
      return NextResponse.json(
        { success: false, error: "Invalid admin authorization code" },
        { status: 403 }
      )
    }

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email and new password are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Reset password using admin client
    const { data, error } = await adminClient.auth.admin.updateUserById(
      "296af00b-ea80-4dfe-a4ac-25d7f15d893c", // Your user ID
      { password: newPassword }
    )

    if (error) {
      console.error("Password reset error:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })

  } catch (error: any) {
    console.error("Admin password reset error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}











