"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { UserRoleType } from "@/lib/auth"

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const urlRole = searchParams.get("role") as UserRoleType | null
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('oauth_role') as UserRoleType | null : null
  const role = urlRole || storedRole


  useEffect(() => {
    if (code) {
      handleOAuthCallback()
    } else {
      // No code, redirect to login
      window.location.href = "/login?error=no_code"
    }
  }, [code, role])

  const handleOAuthCallback = async () => {
    try {
      const supabase = createClient()

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.user) {
        console.error("Session error:", sessionError)
        window.location.href = "/login?error=session_failed"
        return
      }

      // Check if user already exists in our user_roles table
      let existingUser = null
      let userError = null
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        existingUser = data
        userError = error
      } catch (err) {
        // If there's an RLS error, assume no existing user and proceed
        userError = { code: 'PGRST116' } // Simulate "not found" error
      }

      // If user doesn't exist, create a new user role entry
      // Also proceed if there's an RLS error (infinite recursion)
      const shouldCreateUser = !existingUser && (
        !userError || 
        userError.code === 'PGRST116' || 
        userError.message?.includes('infinite recursion')
      )
      
      if (shouldCreateUser) {
        const defaultRole: UserRoleType = role || 'student'
        
        // Create user_roles entry - use INSERT ON CONFLICT to handle existing entries
        try {
          // First check if the role already exists
          const { data: existingRoleEntry } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('role', defaultRole)
            .single()

          if (!existingRoleEntry) {
            // Only insert if it doesn't exist
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: session.user.id,
                role: defaultRole,
                is_active: true,
                is_primary: true,
                organization: null
              })

            if (insertError) {
              // If it's an RLS error or duplicate key error, continue anyway
              if (insertError.message.includes('infinite recursion') || 
                  insertError.message.includes('policy') ||
                  insertError.message.includes('duplicate') ||
                  insertError.code === '23505') { // PostgreSQL unique violation code
                console.log('Role entry already exists or RLS issue, continuing...')
              } else {
                console.error('Role creation error:', insertError)
                // Don't fail for role creation errors - user can still proceed
              }
            }
          }
        } catch (err) {
          console.log('Role creation exception:', err)
          // Continue despite role creation error
        }

        // Check if user already exists in users table
        const { data: existingUserInUsers, error: usersCheckError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (existingUserInUsers) {
          // Update existing user - preserve edited name
          try {
            // Only update the name if the existing name is empty, null, or still looks like a default Google name
            const shouldUpdateName = !existingUserInUsers.full_name || 
                                    existingUserInUsers.full_name.trim() === '' ||
                                    existingUserInUsers.full_name === 'Google User'
            
            const updateData: any = {
              role: defaultRole,
              current_role: defaultRole,
              updated_at: new Date().toISOString()
            }

            // Only update name if it hasn't been customized by the user
            if (shouldUpdateName) {
              updateData.full_name = session.user.user_metadata?.full_name || 
                                     session.user.user_metadata?.name || 
                                     session.user.email || 
                                     'Google User'
            }

            const { error: updateError } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', session.user.id)
            
            if (updateError) {
              console.error('User update error:', updateError)
              // Continue anyway - user exists
            }
          } catch (err) {
            console.log('User update exception:', err)
            // Continue anyway
          }
        } else {
          // Create new user
          try {
            const { error: userInsertError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || 'Google User',
                role: defaultRole,
                current_role: defaultRole
              })
            
            if (userInsertError) {
              console.error('User insert error:', userInsertError)
              // If it's a duplicate key error, that's okay - user exists
              if (!userInsertError.message.includes('duplicate') && userInsertError.code !== '23505') {
                // Only log non-duplicate errors
                console.error('Unexpected user insert error:', userInsertError)
              }
            }
          } catch (err) {
            console.log('User insert exception:', err)
            // Continue anyway
          }
        }

        // Create appropriate profile based on role
        if (defaultRole === 'student') {
          // Check if student profile already exists
          try {
            const { data: existingStudentProfile } = await supabase
              .from('student_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single()

            if (!existingStudentProfile) {
              const { error: profileError } = await supabase
                .from('student_profiles')
                .insert({
                  user_id: session.user.id
                })

              if (profileError && !profileError.message.includes('duplicate') && profileError.code !== '23505') {
                console.error('Student profile creation error:', profileError)
              }
            }
          } catch (err) {
            console.log('Student profile exception:', err)
            // Continue anyway
          }
        } else if (defaultRole === 'coach') {
          // Check if coach profile already exists
          try {
            const { data: existingCoachProfile } = await supabase
              .from('coach_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single()

            if (!existingCoachProfile) {
              const { error: profileError } = await supabase
                .from('coach_profiles')
                .insert({
                  user_id: session.user.id,
                  organization: null // Will be set later by the coach
                })

              if (profileError && !profileError.message.includes('duplicate') && profileError.code !== '23505') {
                console.error('Coach profile creation error:', profileError)
              }
            }
          } catch (err) {
            console.log('Coach profile exception:', err)
            // Continue anyway
          }
        }
      } else if (existingUser || userError?.message?.includes('infinite recursion')) {
        // User exists, check if we need to add a new role
        // Also handle case where we can't check existing user due to RLS error
        
        if (role && (!existingUser || role !== existingUser.role)) {
          // Check if user already has this role
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('role', role)
            .single()

          if (!existingRole) {
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: session.user.id,
                role: role,
                is_active: true,
                is_primary: false, // Don't make it primary since user already has a role
                organization: null
              })

            // Create appropriate profile if needed
            if (role === 'coach') {
              const { error: profileError } = await supabase
                .from('coach_profiles')
                .insert({
                  user_id: session.user.id,
                  organization: null
                })
            }
          }
        }
      }

      // Clean up localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('oauth_role')
      }

      // Success - redirect to dashboard immediately
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("OAuth callback error:", error)
      window.location.href = "/login?error=oauth_failed"
    }
  }

  // Show nothing while processing
  return null
}
