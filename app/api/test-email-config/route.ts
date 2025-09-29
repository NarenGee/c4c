import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" })
    }

    console.log("=== EMAIL CONFIG TEST ===")
    console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY)
    console.log("FROM_EMAIL:", process.env.FROM_EMAIL)
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL)
    console.log("Target email:", email)

    // Test email sending
    const testResult = await sendEmail({
      to: email,
      subject: "Email Configuration Test - Coaching for College",
      html: `
        <h1>Email Configuration Test</h1>
        <p>This is a test email to verify that email sending is working correctly on Vercel.</p>
        <p>If you receive this email, the email configuration is working properly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: `
Email Configuration Test

This is a test email to verify that email sending is working correctly on Vercel.

If you receive this email, the email configuration is working properly.

Timestamp: ${new Date().toISOString()}
      `
    })

    console.log("Email test result:", testResult)

    return NextResponse.json({ 
      success: true, 
      message: "Email configuration test completed",
      result: testResult,
      config: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.FROM_EMAIL,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }
    })

  } catch (error: any) {
    console.error("Email config test error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to test email configuration",
      config: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.FROM_EMAIL,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }
    }, { status: 500 })
  }
} 