import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    // Try both regular client and admin client
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // If no token provided, list all invitation tokens
    if (!token) {
      console.log("Fetching all invitation tokens...")
      
      // Try with regular client first
      const { data: regularTokens, error: regularError } = await supabase
        .from("invitation_tokens")
        .select(`
          id,
          email,
          relationship,
          used,
          expires_at,
          created_at,
          student_id
        `)
        .order("created_at", { ascending: false })

      console.log("Regular client result:", regularTokens)
      console.log("Regular client error:", regularError)

      // Try with admin client
      const { data: adminTokens, error: adminError } = await adminClient
        .from("invitation_tokens")
        .select(`
          id,
          email,
          relationship,
          used,
          expires_at,
          created_at,
          student_id
        `)
        .order("created_at", { ascending: false })

      console.log("Admin client result:", adminTokens)
      console.log("Admin client error:", adminError)

      // Try a simple count query
      const { count: tokenCount, error: countError } = await adminClient
        .from("invitation_tokens")
        .select("*", { count: "exact", head: true })

      console.log("Token count:", tokenCount)
      console.log("Count error:", countError)

      return NextResponse.json({
        success: true,
        message: "All invitation tokens debug",
        regularClient: {
          tokens: regularTokens || [],
          count: regularTokens?.length || 0,
          error: regularError
        },
        adminClient: {
          tokens: adminTokens || [],
          count: adminTokens?.length || 0,
          error: adminError
        },
        totalCount: tokenCount,
        countError
      })
    }

    if (!email) {
      return NextResponse.json({
        success: false,
        error: "Missing email parameter"
      })
    }

    // Use admin client for token validation
    console.log("Checking token with admin client:", token)
    
    const { data: tokenCheck, error: tokenError } = await adminClient
      .from("invitation_tokens")
      .select("*")
      .eq("id", token)
      .single()

    console.log("Token check result:", tokenCheck)
    console.log("Token check error:", tokenError)

    if (tokenError || !tokenCheck) {
      return NextResponse.json({
        success: false,
        error: "Token not found in database",
        details: { tokenError, token }
      })
    }

    // Check if email matches
    if (tokenCheck.email !== email) {
      return NextResponse.json({
        success: false,
        error: "Email mismatch",
        details: {
          expectedEmail: tokenCheck.email,
          providedEmail: email
        }
      })
    }

    // Check if already used
    if (tokenCheck.used) {
      return NextResponse.json({
        success: false,
        error: "Invitation already used",
        details: { usedAt: tokenCheck.used_at }
      })
    }

    // Check if expired
    const expiresAt = new Date(tokenCheck.expires_at)
    const now = new Date()
    const isExpired = expiresAt <= now

    if (isExpired) {
      return NextResponse.json({
        success: false,
        error: "Invitation expired",
        details: {
          expiresAt: expiresAt.toISOString(),
          currentTime: now.toISOString()
        }
      })
    }

    // Get student info
    const { data: student, error: studentError } = await adminClient
      .from("users")
      .select("full_name")
      .eq("id", tokenCheck.student_id)
      .single()

    return NextResponse.json({
      success: true,
      message: "Invitation is valid",
      invitation: {
        id: tokenCheck.id,
        email: tokenCheck.email,
        relationship: tokenCheck.relationship,
        studentName: student?.full_name || "Unknown Student",
        expiresAt: tokenCheck.expires_at,
        used: tokenCheck.used
      }
    })

  } catch (error: any) {
    console.error("Test invitation error:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 