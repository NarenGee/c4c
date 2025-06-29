import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required")
}

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailTemplate) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "College Search <noreply@collegesearch.app>",
      to,
      subject,
      html,
      text,
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
