import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateEmailConfirmationEmail } from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, userId } = await request.json()

    if (!email || !fullName || !userId) {
      return NextResponse.json(
        { success: false, error: "Email, full name, and user ID are required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Generate a confirmation token
    const confirmationToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store the confirmation token in the database
    const { error: tokenError } = await adminClient
      .from("email_confirmation_tokens")
      .insert({
        email,
        user_id: userId,
        token: confirmationToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      })

    if (tokenError) {
      console.error("Error storing confirmation token:", tokenError)
      return NextResponse.json(
        { success: false, error: "Failed to create confirmation token" },
        { status: 500 }
      )
    }

    // Generate the confirmation URL
    const confirmationUrl = `${baseUrl}/auth/confirm?token=${confirmationToken}`

    // Generate the email content
    console.log("=== EMAIL CONFIRMATION DEBUG ===")
    console.log("Base URL:", baseUrl)
    console.log("Logo URL:", `${baseUrl}/logo.png`)
    console.log("Confirmation URL:", confirmationUrl)
    
    const emailContent = generateEmailConfirmationEmail({
      userName: fullName,
      confirmationUrl,
    })

    // Send the email
    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Email confirmation error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 