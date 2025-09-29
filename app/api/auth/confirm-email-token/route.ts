import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    console.log("=== EMAIL CONFIRMATION TOKEN API ===")
    console.log("Environment check:")
    console.log("- SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set")
    console.log("- SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set")
    
    const { token } = await request.json()

    if (!token) {
      console.log("❌ No token provided")
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      )
    }

    console.log("✅ Token received:", token.substring(0, 10) + "...")

    // Check environment variables before creating client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Missing Supabase environment variables")
      return NextResponse.json(
        { success: false, error: "Database configuration missing" },
        { status: 500 }
      )
    }

    const adminClient = createAdminClient()
    console.log("✅ Admin client created")

    // Get the confirmation token from the database
    console.log("🔍 Looking up token in database...")
    const { data: tokenData, error: tokenError } = await adminClient
      .from("email_confirmation_tokens")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .single()

    if (tokenError) {
      console.error("❌ Database error:", tokenError)
      return NextResponse.json(
        { success: false, error: `Database error: ${tokenError.message}` },
        { status: 500 }
      )
    }

    if (!tokenData) {
      console.log("❌ Token not found or already used")
      return NextResponse.json(
        { success: false, error: "Invalid or expired confirmation link" },
        { status: 400 }
      )
    }

    console.log("✅ Token found in database")

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()
    if (expiresAt <= now) {
      return NextResponse.json(
        { success: false, error: "Confirmation link has expired" },
        { status: 400 }
      )
    }

    // Confirm the user's email
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    )

    if (confirmError) {
      console.error("Error confirming email:", confirmError)
      return NextResponse.json(
        { success: false, error: "Failed to confirm email" },
        { status: 500 }
      )
    }

    // Mark the token as used
    await adminClient
      .from("email_confirmation_tokens")
      .update({ used: true })
      .eq("token", token)

    return NextResponse.json({ 
      success: true, 
      message: "Email confirmed successfully" 
    })

  } catch (error: any) {
    console.error("Email confirmation error:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 