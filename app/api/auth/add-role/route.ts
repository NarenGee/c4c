import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import type { UserRoleType } from "@/lib/auth"

interface AddRoleRequest {
  role: UserRoleType
  organization?: string
}

export async function POST(request: NextRequest) {
  try {
    const { role, organization }: AddRoleRequest = await request.json()

    // Validate input
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role is required" },
        { status: 400 }
      )
    }

    const validRoles: UserRoleType[] = ['student', 'parent', 'counselor', 'coach', 'super_admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      )
    }

    // For coach role, organization is required
    if (role === 'coach' && !organization) {
      return NextResponse.json(
        { success: false, error: "Organization is required for coach role" },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Use the database function to add role
    const supabase = await createClient()
    const { error: roleError } = await supabase.rpc('add_user_role', {
      target_role: role,
      org: organization || null
    })

    if (roleError) {
      console.error("Failed to add role:", roleError)
      return NextResponse.json(
        { success: false, error: `Failed to add role: ${roleError.message}` },
        { status: 500 }
      )
    }

    // If this is a coach role, ensure coach profile exists
    if (role === 'coach' && organization) {
      const adminClient = createAdminClient()
      const { error: coachProfileError } = await adminClient
        .from("coach_profiles")
        .upsert({
          user_id: currentUser.id,
          organization,
          updated_at: new Date().toISOString(),
        })

      if (coachProfileError) {
        console.error("Failed to create/update coach profile:", coachProfileError)
        // Don't fail the request, coach profile can be created later
      }
    }

    // If this is a student role, ensure student profile exists
    if (role === 'student') {
      const adminClient = createAdminClient()
      const { error: studentProfileError } = await adminClient
        .from("student_profiles")
        .upsert({
          user_id: currentUser.id,
          updated_at: new Date().toISOString(),
        })

      if (studentProfileError) {
        console.error("Failed to create/update student profile:", studentProfileError)
        // Don't fail the request, student profile can be created later
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${role} role`
    })

  } catch (error) {
    console.error("Add role error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
