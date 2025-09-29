import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Missing token parameter"
      })
    }

    const adminClient = createAdminClient()

    // Get invitation details
    const { data: invitation, error: invitationError } = await adminClient
      .from("invitation_tokens")
      .select("*")
      .eq("id", token)
      .eq("used", false)
      .single()

    if (invitationError || !invitation) {
      console.error("Invitation fetch error:", invitationError)
      return NextResponse.json({
        success: false,
        error: "Invalid or expired invitation"
      })
    }

    // Get student details separately
    const { data: student, error: studentError } = await adminClient
      .from("users")
      .select("full_name")
      .eq("id", invitation.student_id)
      .single()

    // Check if expired
    const expiresAt = new Date(invitation.expires_at)
    const now = new Date()
    const isExpired = expiresAt <= now

    if (isExpired) {
      return NextResponse.json({
        success: false,
        error: "Invitation has expired"
      })
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        relationship: invitation.relationship,
        studentName: student?.full_name || "Unknown Student",
        expiresAt: invitation.expires_at
      }
    })

  } catch (error: any) {
    console.error("Validate invitation error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to validate invitation"
    })
  }
} 