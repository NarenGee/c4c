import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { User } from "@/lib/auth"

export async function getCurrentCoach(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return null
    }

    // Get user profile from users table
    const { data: user, error: userError } = await adminClient
      .from("users")
      .select("id, email, full_name, role, \"current_role\", created_at, updated_at")
      .eq("id", authUser.id)
      .single()

    if (userError || !user) {
      return null
    }

    // Check if user has coach role
    const { data: coachRole } = await adminClient
      .from("user_roles")
      .select("role, organization")
      .eq("user_id", authUser.id)
      .eq("role", "coach")
      .single()

    if (!coachRole) {
      return null // User doesn't have coach role
    }

    // Get all user roles
    const { data: allRoles } = await adminClient
      .from("user_roles")
      .select("*")
      .eq("user_id", authUser.id)

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      current_role: user.current_role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: allRoles || [],
      organization: coachRole.organization
    } as User

  } catch (error) {
    console.error("getCurrentCoach error:", error)
    return null
  }
}














