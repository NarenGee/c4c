import { type NextRequest, NextResponse } from "next/server"
import { sendInvitationViaSupabase } from "@/lib/email-supabase"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" })
    }

    const result = await sendInvitationViaSupabase({
      studentName: "Test Student",
      studentEmail: "student@test.com",
      relationship: "parent",
      invitationToken: "test-token-123",
      recipientEmail: email,
      isExistingUser: false,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Test Supabase email error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to send test invitation",
    })
  }
}
