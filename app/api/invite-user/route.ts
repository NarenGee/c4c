import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { generateInvitationEmail } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API: invite-user POST started")
    
    const body = await request.json()
    const { email, relationship } = body

    console.log("📧 API: Input params:", { email, relationship })

    // Validate input
    if (!email || !relationship) {
      return NextResponse.json(
        { success: false, error: "Email and relationship are required" },
        { status: 400 }
      )
    }

    if (!["parent", "other"].includes(relationship)) {
      return NextResponse.json(
        { success: false, error: "Invalid relationship type. Must be 'parent' or 'other'" },
        { status: 400 }
      )
    }
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log("❌ API ROUTE: Environment check failed")
      return NextResponse.json({ 
        success: false, 
        error: "Database configuration missing" 
      })
    }
    
    console.log("✅ API ROUTE: Environment check passed")
    
    // Get current user
    const user = await getCurrentUser()
    console.log("👤 API ROUTE: getCurrentUser result:", user)
    
    if (!user) {
      console.log("❌ API ROUTE: No user found")
      return NextResponse.json({ 
        success: false, 
        error: "User not authenticated" 
      })
    }
    
    if (user.role !== "student") {
      console.log("❌ API ROUTE: User not student")
      return NextResponse.json({ 
        success: false, 
        error: "Only students can send invitations" 
      })
    }
    
    console.log("✅ API ROUTE: User validation passed")
    
    // Create Supabase client
    const supabase = await createClient()
    console.log("✅ API ROUTE: Supabase client created")
    
    // Check for existing invitation
    const { data: existingInvitation, error: checkError } = await supabase
      .from("invitation_tokens")
      .select("*")
      .eq("email", email)
      .eq("student_id", user.id)
      .eq("used", false)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log("❌ API ROUTE: Check error:", checkError)
      return NextResponse.json({ 
        success: false, 
        error: `Database query failed: ${checkError.message}` 
      })
    }
    
    if (existingInvitation && new Date(existingInvitation.expires_at) > new Date()) {
      console.log("❌ API ROUTE: Existing invitation found")
      return NextResponse.json({ 
        success: false, 
        error: "An invitation has already been sent to this email address" 
      })
    }
    
    console.log("✅ API ROUTE: No existing invitation found")
    
    // Create invitation record
    const insertData = {
      email,
      student_id: user.id,
      relationship,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
    
    console.log("📝 API ROUTE: Insert data:", insertData)
    
    const { data: invitation, error: insertError } = await supabase
      .from("invitation_tokens")
      .insert(insertData)
      .select()
      .single()
    
    if (insertError) {
      console.log("❌ API ROUTE: Insert failed:", insertError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to create invitation: ${insertError.message}` 
      })
    }
    
    if (!invitation) {
      console.log("❌ API ROUTE: No invitation data")
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create invitation - no data returned" 
      })
    }
    
    console.log("✅ API ROUTE: Invitation created successfully:", invitation.id)
    
    // Send invitation email
    let emailSent = false
    let emailError = null
    
    try {
      console.log("📧 API ROUTE: Preparing to send email...")
      
      // Check if recipient already has an account
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single()
      
      const isExistingUser = !!existingUser
      console.log("👤 API ROUTE: Is existing user:", isExistingUser)
      
      // Generate email content
      const emailTemplate = generateInvitationEmail({
        studentName: user.full_name,
        studentEmail: user.email,
        relationship: relationship as "parent" | "other",
        invitationToken: invitation.id,
        recipientEmail: email,
        isExistingUser
      })
      
      console.log("📝 API ROUTE: Email template generated")
      
      // Send the email
      await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      })
      
      emailSent = true
      console.log("✅ API ROUTE: Email sent successfully")
      
    } catch (error: any) {
      console.error("❌ API ROUTE: Email sending failed:", error)
      emailError = error.message || "Failed to send email"
      // Don't fail the entire request if email fails
    }
    
    const result = {
      success: true,
      invitationId: invitation.id,
      emailSent,
      emailError,
      message: emailSent 
        ? "Invitation sent successfully!" 
        : `Invitation created but email failed: ${emailError}`
    }
    
    console.log("🎉 API ROUTE: Returning result:", result)
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error("💥 API ROUTE: Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: `API error: ${error.message || "Unknown error"}` 
    }, { status: 500 })
  }
} 