import { Resend } from "resend"

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailTemplate) {
  // Skip email sending only if API key is not configured
  if (!process.env.RESEND_API_KEY) {
    console.log("📧 Email would be sent to:", to)
    console.log("📧 Subject:", subject)
    console.log("📧 Email sending skipped (no API key configured)")
    return { success: true, data: { id: 'dev-mode-skip' } }
  }

  try {
    if (!resend) {
      throw new Error("Resend not initialized - API key missing")
    }

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "College Search <noreply@collegesearch.app>",
      to,
      subject,
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': new Date().getTime().toString(),
      },
      tags: [
        {
          name: 'category',
          value: 'invitation'
        }
      ]
    })

    if (error) {
      console.error("Email sending error:", error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log("Email sent successfully:", data)
    return { success: true, data }
  } catch (error: any) {
    console.error("Email service error:", error)
    throw new Error(`Email delivery failed: ${error.message}`)
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
