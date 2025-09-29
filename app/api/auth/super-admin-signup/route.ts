import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// This should be set as an environment variable in production
const SUPER_ADMIN_CODE = process.env.SUPER_ADMIN_CODE || "COACHING4COLLEGE2024!"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, adminCode } = await request.json()

    // Validate input
    if (!email || !password || !fullName || !adminCode) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      )
    }

    // Verify admin code
    if (adminCode !== SUPER_ADMIN_CODE) {
      return NextResponse.json(
        { success: false, error: "Invalid admin authorization code" },
        { status: 403 }
      )
    }

    // Strong password validation
    if (password.length < 12) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 12 characters" },
        { status: 400 }
      )
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return NextResponse.json(
        { success: false, error: "Password must contain uppercase, lowercase, number, and special character" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check if super admin already exists
    const { data: existingAdmin } = await adminClient
      .from("users")
      .select("id")
      .eq("role", "super_admin")
      .limit(1)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "Super admin account already exists" },
        { status: 409 }
      )
    }

    // Create auth user with metadata using admin client for immediate confirmation
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        role: 'super_admin',
      },
      email_confirm: true, // Skip email confirmation for admin-created users
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "Failed to create user account" },
        { status: 400 }
      )
    }

    console.log("Created auth user:", authData.user.id)

    // Small delay to ensure auth user is fully created
    await new Promise(resolve => setTimeout(resolve, 100))

    // Create user profile using admin client
    const { error: userError } = await adminClient
      .from("users")
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'super_admin',
        "current_role": 'super_admin',
      })

    if (userError) {
      console.error("User profile creation error:", userError)
      return NextResponse.json(
        { success: false, error: `Failed to create super admin profile: ${userError.message}` },
        { status: 500 }
      )
    }

    console.log("Created super admin profile")

    return NextResponse.json({
      success: true,
      message: "Super admin account created successfully",
    })

  } catch (error: any) {
    console.error("Super admin signup error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
