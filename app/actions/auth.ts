"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { UserRole } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export interface SignupData {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export interface AuthResult {
  success: boolean
  error?: string
  needsEmailConfirmation?: boolean
}

export async function signupUser(data: SignupData): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    // Step 1: Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: data.role,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user account" }
    }

    // Step 2: Create user profile record
    const dbForProfile = authData.session ? supabase : createAdminClient()

    const { error: profileError } = await dbForProfile.from("users").insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Try to clean up the auth user if profile creation fails
      try {
        await supabase.auth.signOut()
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError)
      }
      return { success: false, error: `Failed to create user profile: ${profileError.message}` }
    }

    // Step 3: Create student profile if needed
    if (data.role === "student") {
      const db = authData.session ? supabase : createAdminClient()
      const { error: studentError } = await db.from("student_profiles").insert({
        user_id: authData.user.id,
      })
      if (studentError) {
        console.error("Student profile creation error:", studentError)
        // Don't fail the entire process for this
      }
    }

    // Check if email confirmation is required
    if (!authData.session) {
      return {
        success: true,
        needsEmailConfirmation: true,
      }
    }

    return { success: true }
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
