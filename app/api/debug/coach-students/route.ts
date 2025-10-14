import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Get user info by email
    const { data: user, error: userError } = await adminClient
      .from("users")
      .select("id, email, full_name, role, \"current_role\"")
      .eq("email", email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        error: "User not found",
        email
      })
    }

    // Check if user has coach role
    const { data: coachRole, error: roleError } = await adminClient
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "coach")

    // Get all assignments for this coach
    const { data: assignments, error: assignmentsError } = await adminClient
      .from("coach_student_assignments")
      .select("*")
      .eq("coach_id", user.id)

    // Get assignments with student details
    const { data: assignmentsWithStudents, error: detailsError } = await adminClient
      .from("coach_student_assignments")
      .select(`
        id,
        coach_id,
        student_id,
        assigned_at,
        is_active,
        notes,
        student:users!coach_student_assignments_student_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq("coach_id", user.id)

    // Test the query from the original API
    const supabase = await createClient()
    
    // Try to get current user
    const currentUser = await getCurrentUser()

    return NextResponse.json({
      step: "complete",
      email,
      user_info: user,
      has_coach_role: !!coachRole,
      coach_role_details: coachRole,
      assignments_count: assignments?.length || 0,
      assignments,
      assignments_with_students: assignmentsWithStudents,
      current_user_from_lib: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        current_role: currentUser.current_role
      } : null,
      errors: {
        user_error: userError?.message || null,
        role_error: roleError?.message || null,
        assignments_error: assignmentsError?.message || null,
        details_error: detailsError?.message || null
      }
    })

  } catch (error: any) {
    console.error("Debug coach students error:", error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}











