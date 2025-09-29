import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { generateInvitationEmail } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" })
    }

    const emailTemplate = generateInvitationEmail({
      studentName: "Test Student",
      studentEmail: "student@test.com",
      relationship: "parent",
      invitationToken: "test-token-123",
      recipientEmail: email,
      isExistingUser: false,
    })

    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    })

    const result = { success: true }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Test Supabase email error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to send test invitation",
    })
  }
}
