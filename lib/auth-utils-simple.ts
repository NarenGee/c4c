import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { User } from "@/lib/auth"

export async function getCurrentUserSimple(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    console.log("Getting auth user...")
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      console.log("No auth user found:", authError)
      return null
    }

    console.log("Auth user found:", authUser.id, authUser.email)

    // Try to get user profile with admin client (bypass RLS issues)
    console.log("Fetching user profile...")
    const { data: user, error: userError } = await adminClient
      .from("users")
      .select(`
        id,
        email,
        full_name,
        role,
        "current_role",
        created_at,
        updated_at
      `)
      .eq("id", authUser.id)
      .single()

    if (user && !userError) {
      console.log("User profile found successfully")
      
      // Fetch user roles separately
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("*")
        .eq("user_id", authUser.id)

      // Add roles to user object
      ;(user as any).roles = roles || []
      
      // Add organization from current role
      if (roles) {
        const currentRole = roles.find((r: any) => r.role === user.current_role)
        ;(user as any).organization = currentRole?.organization
      }
      return user
    }

    console.log("User profile not found or error:", userError)
    console.log("Creating user profile from auth metadata...")

    // Create user profile from auth metadata
    const userRole = authUser.user_metadata?.role || 'student'
    const validRoles = ['student', 'parent', 'counselor', 'coach', 'super_admin']
    const normalizedRole = validRoles.includes(userRole) ? userRole : 'student'

    const { data: newUser, error: createError } = await adminClient
      .from("users")
      .upsert({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email,
        role: normalizedRole,
        "current_role": normalizedRole,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error("Failed to create user profile:", createError)
      return null
    }

    console.log("Successfully created user profile")

    // Create role-specific profiles if needed
    if (newUser.role === 'coach' && authUser.user_metadata?.organization) {
      try {
        await adminClient.from("coach_profiles").upsert({
          user_id: newUser.id,
          organization: authUser.user_metadata.organization,
          updated_at: new Date().toISOString(),
        })
        console.log("Created/updated coach profile")
      } catch (error) {
        console.log("Coach profile creation failed (non-fatal):", error)
      }
    }

    if (newUser.role === 'student') {
      try {
        await adminClient.from("student_profiles").upsert({
          user_id: newUser.id,
          updated_at: new Date().toISOString(),
        })
        console.log("Created/updated student profile")
      } catch (error) {
        console.log("Student profile creation failed (non-fatal):", error)
      }
    }

    return newUser

  } catch (error) {
    console.error("getCurrentUser error:", error)
    return null
  }
}

