import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

interface CoachSignupRequest {
  email: string
  password?: string
  fullName: string
  organization: string
  addToExistingAccount?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, organization, addToExistingAccount }: CoachSignupRequest = await request.json()

    console.log("=== COACH SIGNUP (FIXED) ===")
    console.log("Input:", { email, fullName, organization, addToExistingAccount })

    // Validate input
    if (!email || !fullName || !organization) {
      return NextResponse.json(
        { success: false, error: "Email, full name, and organization are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Check if this is adding a role to an existing account
    if (addToExistingAccount) {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: "Must be logged in to add role to existing account" },
          { status: 401 }
        )
      }

      if (currentUser.email !== email) {
        return NextResponse.json(
          { success: false, error: "Email must match your current account" },
          { status: 400 }
        )
      }

      // Add coach role to existing user
      const { error: roleError } = await supabase.rpc('add_user_role', {
        target_role: 'coach',
        org: organization
      })

      if (roleError) {
        console.error("Failed to add coach role:", roleError)
        return NextResponse.json(
          { success: false, error: `Failed to add coach role: ${roleError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Coach role added to your account successfully"
      })
    }

    // For new accounts, check if user exists by trying to create directly
    // If user exists, auth creation will fail with a clear error
    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required for new accounts" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    console.log("Creating new auth user...")

    // Create auth user with metadata using admin client for immediate confirmation
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
        role: 'coach',
        organization: organization,
      },
      email_confirm: true, // Skip email confirmation for admin-created users
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      
      // Check if it's a "user already exists" error
      if (authError.message?.includes('already') || authError.message?.includes('exists')) {
        return NextResponse.json(
          { 
            success: false, 
            error: "A user with this email already exists. Please sign in and add the coach role to your existing account.",
            suggestAddRole: true
          },
          { status: 409 }
        )
      }
      
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

    console.log("Creating user profile...")

    // Create user profile using admin client
    const { error: userError } = await adminClient
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'coach',
        "current_role": 'coach',
      })

    if (userError) {
      console.error("User profile creation error:", userError)
      return NextResponse.json(
        { success: false, error: `Failed to create user profile: ${userError.message}` },
        { status: 500 }
      )
    }

    console.log("Created user profile")

    console.log("Adding coach role...")

    // Add coach role using the new system (this will also create coach_profiles)
    const { error: roleError } = await adminClient.rpc('add_user_role', {
      target_role: 'coach',
      org: organization
    })

    if (roleError) {
      console.error("Failed to add coach role (non-fatal):", roleError)
      // Continue anyway, role can be added later
    } else {
      console.log("Coach role added successfully")
    }

    console.log("Coach account creation completed successfully")

    return NextResponse.json({
      success: true,
      message: "Coach account created successfully"
    })

  } catch (error: any) {
    console.error("Coach signup error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
