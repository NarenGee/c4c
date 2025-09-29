import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, organization, addToExistingAccount } = await request.json()

    console.log("=== COACH SIGNUP DEBUG ===")
    console.log("Input data:", { email, fullName, organization, addToExistingAccount, hasPassword: !!password })

    // Step 1: Validate input
    if (!email || !fullName || !organization) {
      return NextResponse.json({
        step: "validation",
        success: false,
        error: "Email, full name, and organization are required"
      })
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    console.log("Step 1: Input validation - PASSED")

    // Step 2: Check if adding to existing account
    if (addToExistingAccount) {
      console.log("Step 2: Adding to existing account flow")
      
      const currentUser = await getCurrentUser()
      console.log("Current user:", currentUser ? `${currentUser.id} (${currentUser.email})` : "null")
      
      if (!currentUser) {
        return NextResponse.json({
          step: "existing_account_auth",
          success: false,
          error: "Must be logged in to add role to existing account"
        })
      }

      if (currentUser.email !== email) {
        return NextResponse.json({
          step: "existing_account_email_match",
          success: false,
          error: "Email must match your current account"
        })
      }

      // Test the RPC function
      console.log("Step 3: Testing add_user_role RPC function")
      const { data: rpcData, error: roleError } = await supabase.rpc('add_user_role', {
        target_role: 'coach',
        org: organization
      })

      console.log("RPC result:", { rpcData, roleError })

      if (roleError) {
        return NextResponse.json({
          step: "add_user_role_rpc",
          success: false,
          error: roleError.message,
          details: roleError
        })
      }

      return NextResponse.json({
        step: "existing_account_complete",
        success: true,
        message: "Coach role added to your account successfully"
      })
    }

    // Step 3: Skip user existence check - let auth creation handle it
    console.log("Step 3: Skipping user existence check (will be handled by auth creation)")

    // Step 4: Validate password for new account
    if (!password) {
      return NextResponse.json({
        step: "password_validation",
        success: false,
        error: "Password is required for new accounts"
      })
    }

    if (password.length < 8) {
      return NextResponse.json({
        step: "password_length",
        success: false,
        error: "Password must be at least 8 characters"
      })
    }

    console.log("Step 4: Password validation - PASSED")

    // Step 5: Create auth user
    console.log("Step 5: Creating auth user")
    let authData
    try {
      const result = await adminClient.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: fullName,
          role: 'coach',
          organization: organization,
        },
        email_confirm: true,
      })
      authData = result.data
      
      if (result.error) {
        console.log("Auth creation error:", result.error)
        
        // Check if it's a "user already exists" error
        if (result.error.message?.includes('already') || result.error.message?.includes('exists')) {
          return NextResponse.json({
            step: "user_already_exists",
            success: false,
            error: "A user with this email already exists. Please sign in and add the coach role to your existing account.",
            suggestAddRole: true
          })
        }
        
        return NextResponse.json({
          step: "create_auth_user",
          success: false,
          error: result.error.message,
          details: result.error
        })
      }
    } catch (error) {
      console.log("Auth creation exception:", error)
      return NextResponse.json({
        step: "create_auth_user_exception",
        success: false,
        error: "Failed to create auth user",
        details: error
      })
    }

    if (!authData.user) {
      return NextResponse.json({
        step: "auth_user_null",
        success: false,
        error: "Failed to create user account - no user returned"
      })
    }

    console.log("Step 5: Auth user created:", authData.user.id)

    // Step 6: Create user profile
    console.log("Step 6: Creating user profile")
    try {
      const { error: userError } = await adminClient
        .from("users")
        .upsert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'coach',
          "current_role": 'coach',
        })

      if (userError) {
        console.log("User profile creation error:", userError)
        return NextResponse.json({
          step: "create_user_profile",
          success: false,
          error: userError.message,
          details: userError
        })
      }
    } catch (error) {
      console.log("User profile creation exception:", error)
      return NextResponse.json({
        step: "create_user_profile_exception",
        success: false,
        error: "Failed to create user profile",
        details: error
      })
    }

    console.log("Step 6: User profile created")

    // Step 7: Add coach role
    console.log("Step 7: Adding coach role via RPC")
    try {
      const { error: roleError } = await adminClient.rpc('add_user_role', {
        target_role: 'coach',
        org: organization
      })

      if (roleError) {
        console.log("Add coach role error (non-fatal):", roleError)
        // Don't fail here, just log it
      } else {
        console.log("Step 7: Coach role added successfully")
      }
    } catch (error) {
      console.log("Add coach role exception (non-fatal):", error)
    }

    return NextResponse.json({
      step: "complete",
      success: true,
      message: "Coach account created successfully",
      userId: authData.user.id
    })

  } catch (error: any) {
    console.error("=== COACH SIGNUP DEBUG ERROR ===", error)
    return NextResponse.json({
      step: "unexpected_error",
      success: false,
      error: "Internal server error",
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
