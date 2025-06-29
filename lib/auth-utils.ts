import { createClient } from "@/lib/supabase/server"
import type { User } from "@/lib/auth"

export async function getCurrentUserWithRetry(maxRetries = 3): Promise<User | null> {
  const supabase = await createClient()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error(`Auth error (attempt ${attempt}):`, authError)
        if (attempt === maxRetries) return null
        continue
      }

      if (!authUser) return null

      const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      if (userError) {
        console.error(`User profile error (attempt ${attempt}):`, userError)
        if (attempt === maxRetries) return null
        continue
      }

      return user
    } catch (error) {
      console.error(`Unexpected error (attempt ${attempt}):`, error)
      if (attempt === maxRetries) return null
    }

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
  }

  return null
}

export async function ensureUserProfile(authUserId: string, email: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    // Check if user profile exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("id", authUserId).single()

    if (existingUser) {
      return true // Profile already exists
    }

    // Profile doesn't exist, this shouldn't happen in normal flow
    console.error("User profile missing for authenticated user:", authUserId)
    return false
  } catch (error) {
    console.error("Error checking user profile:", error)
    return false
  }
}
