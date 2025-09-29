"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { generateInvitationEmail, type InvitationEmailData } from "@/lib/email-templates"

export interface InviteResult {
  success: boolean
  error?: string
  invitationId?: string
  emailSent?: boolean
}

// Simple test function to check if server actions work
export async function testServerAction(): Promise<{ message: string }> {
  console.log("🧪 TEST SERVER ACTION: Function called")
  return { message: "Server action is working!" }
}

// ─────────────────────────────────────────────────────────
// INVITE USER (main invitation function)
// ─────────────────────────────────────────────────────────
export async function inviteUser(email: string, relationship: "parent" | "other", name?: string): Promise<InviteResult> {
  // Absolutely ensure we return a result - wrap everything in try-catch
  try {
    console.log("🚀 SERVER ACTION: inviteUser started")
    console.log("📧 SERVER ACTION: Input params:", { email, relationship, name })
    
    // Basic validation
    if (!email || !relationship) {
      const errorResult = { success: false, error: "Email and relationship are required" }
      console.log("❌ SERVER ACTION: Validation failed, returning:", errorResult)
      return errorResult
    }
    
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const errorResult = { success: false, error: "Database configuration missing" }
      console.log("❌ SERVER ACTION: Environment check failed, returning:", errorResult)
      return errorResult
    }
    
    console.log("✅ SERVER ACTION: Environment check passed")
    
    // Try to get current user
    let user
    try {
      user = await getCurrentUser()
      console.log("👤 SERVER ACTION: getCurrentUser result:", user)
    } catch (userError: any) {
      const errorResult = { success: false, error: `User authentication failed: ${userError.message}` }
      console.log("❌ SERVER ACTION: getCurrentUser failed, returning:", errorResult)
      return errorResult
    }
    
    if (!user) {
      const errorResult = { success: false, error: "User not authenticated" }
      console.log("❌ SERVER ACTION: No user found, returning:", errorResult)
      return errorResult
    }
    
    if (user.role !== "student") {
      const errorResult = { success: false, error: "Only students can send invitations" }
      console.log("❌ SERVER ACTION: User not student, returning:", errorResult)
      return errorResult
    }
    
    console.log("✅ SERVER ACTION: User validation passed")
    
    // Create Supabase client
    let supabase
    try {
      supabase = await createClient()
      console.log("✅ SERVER ACTION: Supabase client created")
    } catch (clientError: any) {
      const errorResult = { success: false, error: `Database connection failed: ${clientError.message}` }
      console.log("❌ SERVER ACTION: Supabase client creation failed, returning:", errorResult)
      return errorResult
    }
    
    // Check for existing invitation
    try {
      console.log("🔍 SERVER ACTION: Checking for existing invitation...")
      const { data: existingInvitation, error: checkError } = await supabase
        .from("invitation_tokens")
        .select("*")
        .eq("email", email)
        .eq("student_id", user.id)
        .eq("used", false)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        const errorResult = { success: false, error: `Database query failed: ${checkError.message}` }
        console.log("❌ SERVER ACTION: Existing invitation check failed, returning:", errorResult)
        return errorResult
      }
      
      if (existingInvitation && new Date(existingInvitation.expires_at) > new Date()) {
        const errorResult = { success: false, error: "An invitation has already been sent to this email address" }
        console.log("❌ SERVER ACTION: Existing invitation found, returning:", errorResult)
        return errorResult
      }
      
      console.log("✅ SERVER ACTION: No existing invitation found")
    } catch (checkError: any) {
      const errorResult = { success: false, error: `Error checking existing invitations: ${checkError.message}` }
      console.log("❌ SERVER ACTION: Invitation check error, returning:", errorResult)
      return errorResult
    }
    
    // Create invitation record
    try {
      console.log("💾 SERVER ACTION: Creating invitation record...")
      const insertData = {
        email,
        student_id: user.id,
        relationship,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
      
      console.log("📝 SERVER ACTION: Insert data:", insertData)
      
      const { data: invitation, error: insertError } = await supabase
        .from("invitation_tokens")
        .insert(insertData)
        .select()
        .single()
      
      if (insertError) {
        const errorResult = { success: false, error: `Failed to create invitation: ${insertError.message}` }
        console.log("❌ SERVER ACTION: Insert failed, returning:", errorResult)
        return errorResult
      }
      
      if (!invitation) {
        const errorResult = { success: false, error: "Failed to create invitation - no data returned" }
        console.log("❌ SERVER ACTION: No invitation data, returning:", errorResult)
        return errorResult
      }
      
      console.log("✅ SERVER ACTION: Invitation created successfully:", invitation.id)
      
      // Check if recipient already has an account
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single()
      
      const isExistingUser = !!existingUser
      console.log("👤 SERVER ACTION: Is existing user:", isExistingUser)
      
      // Generate email content
      const emailTemplate = generateInvitationEmail({
        studentName: user.full_name,
        studentEmail: user.email,
        relationship: relationship,
        invitationToken: invitation.id,
        recipientEmail: email,
        isExistingUser
      })
      
      console.log("📝 SERVER ACTION: Email template generated")
      
      try {
        // Send the email
        await sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })
        
        console.log("✅ SERVER ACTION: Email sent successfully")
        
        const successResult = {
          success: true,
          invitationId: invitation.id,
          emailSent: true,
          message: "Invitation sent successfully!"
        }
        
        console.log("🎉 SERVER ACTION: Returning success result:", successResult)
        return successResult
        
      } catch (emailError: any) {
        console.error("❌ SERVER ACTION: Email sending failed:", emailError)
        
        const partialSuccessResult = {
          success: true,
          invitationId: invitation.id,
          emailSent: false,
          error: `Invitation created but email failed: ${emailError.message || "Unknown error"}`
        }
        
        console.log("⚠️ SERVER ACTION: Returning partial success:", partialSuccessResult)
        return partialSuccessResult
      }
      
    } catch (insertError: any) {
      const errorResult = { success: false, error: `Database insert error: ${insertError.message}` }
      console.log("❌ SERVER ACTION: Insert error, returning:", errorResult)
      return errorResult
    }
    
  } catch (outerError: any) {
    console.error("💥 SERVER ACTION: Outer catch block:", outerError)
    const fallbackResult = { 
      success: false, 
      error: `Server error: ${outerError.message || "Unknown server error"}` 
    }
    console.log("🔄 SERVER ACTION: Returning fallback result:", fallbackResult)
    return fallbackResult
  }
}


// ─────────────────────────────────────────────────────────
// GET PENDING INVITATIONS
// ─────────────────────────────────────────────────────────
export interface PendingInvitation {
  id: string
  email: string
  relationship: "parent" | "other"
  invitee_name?: string
  created_at: string
  expires_at: string
}

export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return []
  }

  const supabase = await createClient()

  try {
    // Try to select with invitee_name first
    let { data: invitations, error } = await supabase
      .from("invitation_tokens")
      .select("id, email, relationship, invitee_name, created_at, expires_at")
      .eq("student_id", user.id)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    // If error is due to missing column, retry without invitee_name
    if (error && error.message?.includes('invitee_name')) {
      const { data: retryInvitations, error: retryError } = await supabase
        .from("invitation_tokens")
        .select("id, email, relationship, created_at, expires_at")
        .eq("student_id", user.id)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (retryError) {
        console.error("Get pending invitations error:", retryError)
        return []
      }

      // Add undefined invitee_name to maintain interface consistency
      invitations = (retryInvitations || []).map((inv: Omit<PendingInvitation, 'invitee_name'>) => ({
        ...inv,
        invitee_name: undefined
      }))
    } else if (error) {
      console.error("Get pending invitations error:", error)
      return []
    }

    return invitations || []
  } catch (err: any) {
    console.error("Get pending invitations error:", err)
    return []
  }
}

// ─────────────────────────────────────────────────────────
// CANCEL INVITATION
// ─────────────────────────────────────────────────────────
export async function cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can cancel invitations" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("invitation_tokens")
      .update({ used: true }) // Mark as used to effectively cancel
      .eq("id", invitationId)
      .eq("student_id", user.id)

    if (error) {
      console.error("Cancel invitation error:", error)
      return { success: false, error: "Failed to cancel invitation" }
    }

    return { success: true }
  } catch (err: any) {
    console.error("Cancel invitation error:", err)
    return { success: false, error: err.message || "Failed to cancel invitation" }
  }
}

// ─────────────────────────────────────────────────────────
// RESEND INVITATION (for cases where email delivery failed)
// ─────────────────────────────────────────────────────────
export async function resendInvitation(invitationId: string): Promise<InviteResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can resend invitations" }
  }

  const supabase = await createClient()

  try {
    // Get the pending invitation (still valid, not used)
    const { data: invitation, error } = await supabase
      .from("invitation_tokens")
      .select("*")
      .eq("id", invitationId)
      .eq("student_id", user.id)
      .eq("used", false)
      .single()

    if (error || !invitation) {
      return { success: false, error: "No pending invitation found" }
    }

    // Check if expired
    if (new Date(invitation.expires_at) <= new Date()) {
      return { success: false, error: "Invitation has expired. Please send a new one." }
    }

    // Does the recipient already have an account?
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", invitation.email).single()

    // Send email invitation
    const emailData: InvitationEmailData = {
      studentName: user.full_name,
      studentEmail: user.email,
      relationship: invitation.relationship,
      invitationToken: invitation.token,
      recipientEmail: invitation.email,
      isExistingUser: !!existingUser,
    }

    const emailTemplate = generateInvitationEmail(emailData)

    try {
      await sendEmail({
        to: invitation.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      })

      return {
        success: true,
        invitationId: invitation.id,
        emailSent: true,
      }
    } catch (emailError: any) {
      console.error("Resend email error:", emailError)
      return {
        success: false,
        error: "Failed to resend invitation email",
      }
    }
  } catch (err: any) {
    console.error("Resend invitation error:", err)
    return { success: false, error: err.message || "Failed to resend invitation" }
  }
}

// ─────────────────────────────────────────────────────────
// GET LINKED USERS (People who have accepted invitations)
// ─────────────────────────────────────────────────────────
export interface LinkedUser {
  id: string
  email: string
  full_name: string
  relationship: "parent" | "other"
  linked_at: string
}

export async function getLinkedUsers(): Promise<LinkedUser[]> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return []
  }

  const supabase = await createClient()

  try {
    const { data: linkedUsers, error } = await supabase
      .from("student_links")
      .select(`
        id,
        relationship,
        linked_at,
        linked_user:users!student_links_linked_user_id_fkey (
          id,
          email,
          full_name
        )
      `)
      .eq("student_id", user.id)
      .eq("status", "accepted")
      .not("linked_at", "is", null)
      .order("linked_at", { ascending: false })

    if (error) {
      console.error("Get linked users error:", error)
      return []
    }

    return (linkedUsers || []).map((link: any) => ({
      id: link.linked_user.id,
      email: link.linked_user.email,
      full_name: link.linked_user.full_name,
      relationship: link.relationship,
      linked_at: link.linked_at,
    }))
  } catch (err: any) {
    console.error("Get linked users error:", err)
    return []
  }
}

export async function getStudentLinks(): Promise<{
  success: boolean
  error?: string
  links?: StudentLink[]
}> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "student") {
      return { success: false, error: "Only students can view their links" }
    }

    const supabase = await createClient()

    const { data: links, error } = await supabase
      .from("student_links")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load student links:", error)
      return { success: false, error: "Failed to load connections" }
    }

    return { success: true, links: links || [] }
  } catch (error: any) {
    console.error("Get student links error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export interface StudentLink {
  id: string
  linked_user_id: string | null
  relationship: string
  status: 'pending' | 'accepted' | 'declined'
  invited_email: string
  created_at: string
  linked_at?: string
  invitation_token: string
}
