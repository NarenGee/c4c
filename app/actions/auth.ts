"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { UserRoleType } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export interface SignupData {
  email: string
  password: string
  fullName: string
  role: UserRoleType
  invitationToken?: string // Add invitation token parameter
}

export interface AuthResult {
  success: boolean
  error?: string
  needsEmailConfirmation?: boolean
}

export async function signupUser(data: SignupData): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    // Step 1: If there's an invitation token, validate it first
    let invitationRecord = null
    if (data.invitationToken) {
      console.log("Validating invitation token:", data.invitationToken, "for email:", data.email)
      
      // Use admin client to bypass RLS on invitation_tokens
      const adminClient = createAdminClient()
      
      const { data: invitation, error: invitationError } = await adminClient
        .from("invitation_tokens")
        .select("*")
        .eq("id", data.invitationToken)
        .eq("email", data.email)
        .eq("used", false)
        .single()

      console.log("Invitation validation result:", invitation)
      console.log("Invitation validation error:", invitationError)

      if (invitationError || !invitation) {
        console.error("Invitation validation failed:", invitationError)
        return { success: false, error: "Invalid or expired invitation" }
      }

      // Check if invitation is expired
      const expiresAt = new Date(invitation.expires_at)
      const now = new Date()
      console.log("Invitation expires at:", expiresAt)
      console.log("Current time:", now)
      console.log("Is expired:", expiresAt <= now)

      if (expiresAt <= now) {
        console.error("Invitation has expired")
        return { success: false, error: "Invitation has expired" }
      }

      // Check if role matches
      console.log("Expected role:", invitation.relationship, "Provided role:", data.role)
      if (invitation.relationship !== data.role) {
        console.error("Role mismatch")
        return { success: false, error: "Role mismatch with invitation" }
      }

      console.log("Invitation validation successful")
      invitationRecord = invitation
    }

    // Step 2: For invited users, use admin client to create and confirm user directly
    if (data.invitationToken && invitationRecord) {
      try {
        console.log("=== HANDLING INVITED USER SIGNUP ===")
        const adminClient = createAdminClient()
        
        // Try to create user first, handle "already exists" case
        console.log("=== ATTEMPTING TO CREATE USER ===")
        console.log("Creating user with admin client for invitation:", data.invitationToken)
        
        let userId: string
        let userAlreadyExists = false
        
        // Create user with admin client and auto-confirm
        const { data: adminAuthData, error: adminAuthError } = await adminClient.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: data.fullName,
            role: data.role,
            invitation_token: data.invitationToken,
          },
        })

        if (adminAuthError) {
          // Check if error is because user already exists
          if (adminAuthError.message.toLowerCase().includes("already been registered") || 
              adminAuthError.message.toLowerCase().includes("already exists")) {
            console.log("=== USER ALREADY EXISTS ===")
            userAlreadyExists = true
            
            // Try to sign them in with the provided password
            console.log("=== SIGNING IN EXISTING USER ===")
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password,
            })

            if (signInError) {
              console.error("Sign-in error for existing user:", signInError)
              return { success: false, error: "Invalid email or password" }
            }
            
            console.log("Existing user signed in successfully")
            userId = signInData.user.id
          } else {
            console.error("Admin user creation error:", adminAuthError)
            return { success: false, error: adminAuthError.message }
          }
        } else {
          if (!adminAuthData.user) {
            console.error("Admin user creation failed - no user returned")
            return { success: false, error: "Failed to create user account" }
          }

          console.log("=== NEW USER CREATED ===")
          console.log("New user created successfully:", adminAuthData.user.id)
          userId = adminAuthData.user.id

          // Step 3: Create user profile for new user
          console.log("=== CREATING USER PROFILE ===")
          const { error: profileError } = await adminClient
            .from("users")
            .insert({
              id: userId,
              email: data.email,
              full_name: data.fullName,
              role: data.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (profileError) {
            console.error("Profile creation error:", profileError)
            // Continue anyway, user can complete profile later
          } else {
            console.log("User profile created successfully")
          }

          // Sign the new user in
          console.log("=== SIGNING IN NEW USER ===")
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          })

          if (signInError) {
            console.error("Auto sign-in error:", signInError)
            // User was created but couldn't sign in automatically
            // They can sign in manually, but we continue with linking
          }
        }

        // Step 4: Create user relationship for invitation (for both new and existing users)
        console.log("=== CREATING USER RELATIONSHIP ===")
        console.log("Creating relationship between student:", invitationRecord.student_id, "and user:", userId)
        
        // Check if relationship already exists
        const { data: existingRelationship } = await adminClient
          .from("user_relationships")
          .select("*")
          .eq("student_id", invitationRecord.student_id)
          .eq("linked_user_id", userId)
          .single()

        if (existingRelationship) {
          console.log("Relationship already exists, skipping creation")
        } else {
          const { error: linkError } = await adminClient
            .from("user_relationships")
            .insert({
              student_id: invitationRecord.student_id,
              linked_user_id: userId,
              relationship: invitationRecord.relationship,
              status: 'accepted',
              invited_email: data.email,
              linked_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (linkError) {
            console.error("User relationship creation error:", linkError)
            // Continue anyway, link can be created later
          } else {
            console.log("User relationship created successfully")
          }
        }

        // Step 5: Mark invitation as used
        console.log("=== MARKING INVITATION AS USED ===")
        const { error: markUsedError } = await adminClient
          .from("invitation_tokens")
          .update({ used: true })
          .eq("id", data.invitationToken)

        if (markUsedError) {
          console.error("Error marking invitation as used:", markUsedError)
          // Continue anyway
        } else {
          console.log("Invitation marked as used successfully")
        }

        console.log("=== INVITATION SIGNUP COMPLETE ===")
        // Success - user is linked and signed in
        return { success: true, needsEmailConfirmation: false }
      } catch (adminError) {
        console.error("Admin client error:", adminError)
        return { success: false, error: `Admin client error: ${adminError}` }
      }
    }

    // Step 3: Normal signup process for non-invited users
    const adminClient = createAdminClient()
    
    // Create user with admin client and auto-confirm
    const { data: adminAuthData, error: adminAuthError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false, // Don't auto-confirm, we'll send custom email
      user_metadata: {
        full_name: data.fullName,
        role: data.role,
        invitation_token: data.invitationToken || null,
      },
    })

    if (adminAuthError) {
      console.error("Admin user creation error:", adminAuthError)
      return { success: false, error: adminAuthError.message }
    }

    if (!adminAuthData.user) {
      return { success: false, error: "Failed to create user account" }
    }

    // Create user profile
    const { error: profileError } = await adminClient
      .from("users")
      .insert({
        id: adminAuthData.user.id,
        email: data.email,
        full_name: data.fullName,
        role: data.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Continue anyway, user can complete profile later
    }

         // Send custom email confirmation
     try {
       console.log("=== SENDING EMAIL CONFIRMATION ===")
       
       // Import the email confirmation function directly
       const { generateEmailConfirmationEmail } = await import("@/lib/email-templates")
       const { sendEmail } = await import("@/lib/email")
       const { createAdminClient } = await import("@/lib/supabase/admin")
       
       const adminClient = createAdminClient()
       const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

       // Generate a confirmation token
       const confirmationToken = crypto.randomUUID()
       const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

       // Store the confirmation token in the database
       const { error: tokenError } = await adminClient
         .from("email_confirmation_tokens")
         .insert({
           email: data.email,
           user_id: adminAuthData.user.id,
           token: confirmationToken,
           expires_at: expiresAt.toISOString(),
           created_at: new Date().toISOString(),
         })
       
       if (tokenError) {
         console.error("Error storing confirmation token:", tokenError)
         // Continue anyway, user can request email later
       } else {
         // Generate the confirmation URL
         const confirmationUrl = `${baseUrl}/auth/confirm?token=${confirmationToken}`

         // Generate the email content
         console.log("=== EMAIL CONFIRMATION DEBUG ===")
         console.log("Base URL:", baseUrl)
         console.log("Confirmation URL:", confirmationUrl)
         
         const emailContent = generateEmailConfirmationEmail({
           userName: data.fullName,
           confirmationUrl,
         })

         // Send the email
         await sendEmail({
           to: data.email,
           subject: emailContent.subject,
           html: emailContent.html,
           text: emailContent.text,
         })

         console.log("Email confirmation sent successfully")
       }
     } catch (emailError: any) {
       console.error("Email confirmation error:", emailError)
       console.error("Error details:", {
         name: emailError?.name,
         message: emailError?.message,
         stack: emailError?.stack
       })
       // Continue anyway, user can request email later
     }

    return {
      success: true,
      needsEmailConfirmation: true,
    }
  } catch (error: any) {
    console.error("Signup process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Login process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error("Sign out error:", error)
  }
  redirect("/login")
}
