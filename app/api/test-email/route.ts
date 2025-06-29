import { type NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { generateInvitationEmail, generateWelcomeEmail } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" })
    }

    let emailTemplate

    if (type === "invitation") {
      emailTemplate = generateInvitationEmail({
        studentName: "Test Student",
        studentEmail: "student@test.com",
        relationship: "parent",
        invitationToken: "test-token-123",
        recipientEmail: email,
        isExistingUser: false,
      })
    } else {
      emailTemplate = generateWelcomeEmail("Test User", "parent")
    }

    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Test email error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to send test email",
    })
  }
}
