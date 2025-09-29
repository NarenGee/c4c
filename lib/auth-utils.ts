import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { User } from "@/lib/auth"

export async function getCurrentUserWithRetry(maxRetries = 3): Promise<User | null> {
  console.log("getCurrentUserWithRetry called")
  const supabase = await createClient()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Getting auth user...`)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) {
        console.error(`Auth error (attempt ${attempt}):`, authError)
        if (attempt === maxRetries) return null
        continue
      }

      if (!authUser) {
        console.log("No auth user found")
        return null
      }

      console.log(`Auth user found: ${authUser.id}`)
      console.log("Auth user object:", JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata,
        app_metadata: authUser.app_metadata
      }, null, 2))

      console.log("Attempting to fetch user profile from database...")
      
      // Try with regular client first, including user roles
      const { data: user, error: userError } = await supabase
        .from("users")
        .select(`
          id,
          email,
          full_name,
          role,
          "current_role",
          created_at,
          updated_at,
          roles:user_roles(*)
        `)
        .eq("id", authUser.id)
        .single()
      
      // If that fails, try with admin client to bypass RLS
      if (userError && userError.code !== 'PGRST116') {
        console.log("Regular query failed, trying with admin client...")
        const adminClient = createAdminClient()
        const { data: adminUser, error: adminError } = await adminClient
          .from("users")
          .select(`
            id,
            email,
            full_name,
            role,
            "current_role",
            created_at,
            updated_at,
            roles:user_roles(*)
          `)
          .eq("id", authUser.id)
          .single()
        console.log("Admin query result:", { adminUser, adminError })
        
        if (!adminError && adminUser) {
          console.log("Found user with admin client - likely RLS issue")
          // Add organization from current role
          if (adminUser.roles) {
            const currentRole = adminUser.roles.find((r: any) => r.role === adminUser.current_role)
            ;(adminUser as any).organization = currentRole?.organization
          }
          return adminUser
        }
      }
      
      console.log("Database query result:", { user, userError })
      console.log("User error type:", typeof userError)
      console.log("User error constructor:", userError?.constructor?.name)

      if (!userError && user) {
        // Add organization from current role
        if (user.roles) {
          const currentRole = user.roles.find((r: any) => r.role === user.current_role)
          ;(user as any).organization = currentRole?.organization
        }
        return user
      }

      if (userError) {
        console.error(`User profile error (attempt ${attempt}):`, userError)
        console.error("Full userError object:", JSON.stringify(userError, null, 2))
        console.error("Error keys:", Object.keys(userError))
        console.error("Error type:", typeof userError)
        
        // For any error (including empty objects), try to create/recreate the profile
        // This is more aggressive but will handle all edge cases
        console.log("User profile error detected - attempting to create/recreate profile")
        
        try {
          // Use admin client to bypass RLS for profile creation
          const adminClient = createAdminClient()
            
            // Validate and normalize the role
            const userRole = authUser.user_metadata?.role || 'student'
            const validRoles = ['student', 'parent', 'counselor', 'coach', 'super_admin']
            const normalizedRole = validRoles.includes(userRole) ? userRole : 'student'
            
            console.log("Creating user profile with role:", normalizedRole)
            console.log("Auth user metadata:", authUser.user_metadata)
            
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
              if (attempt === maxRetries) return null
              continue
            }

            console.log("Successfully created user profile")

            // If user is a coach, also create a coach profile if organization is available
            if (newUser.role === 'coach' && authUser.user_metadata?.organization) {
              try {
                const { error: coachProfileError } = await adminClient
                  .from("coach_profiles")
                  .insert({
                    user_id: newUser.id,
                    organization: authUser.user_metadata.organization,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })

                if (coachProfileError) {
                  console.error("Failed to create coach profile:", coachProfileError)
                  // Continue anyway, coach profile can be created later
                } else {
                  console.log("Successfully created coach profile")
                }
              } catch (coachProfileError) {
                console.error("Error creating coach profile:", coachProfileError)
                // Continue anyway
              }
            }

            // If user is a student, also create a student profile
            if (newUser.role === 'student') {
              try {
                const { error: studentProfileError } = await adminClient
                  .from("student_profiles")
                  .insert({
                    user_id: newUser.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })

                if (studentProfileError) {
                  console.error("Failed to create student profile:", studentProfileError)
                  // Continue anyway, student profile can be created later
                } else {
                  console.log("Successfully created student profile")
                }
              } catch (studentProfileError) {
                console.error("Error creating student profile:", studentProfileError)
                // Continue anyway
              }
            }

            return newUser
          } catch (createError) {
            console.error("Error creating user profile:", createError)
            if (attempt === maxRetries) return null
            continue
          }
        }
        
        if (attempt === maxRetries) return null
        continue
      }

      // This should not be reached since we handle both user success and user error cases above
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
