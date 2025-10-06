import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Fetch all coach notes and actions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    // Get auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Not logged in" },
        { status: 401 }
      )
    }

    // Get user profile and verify super admin access
    const { data: user, error: userError } = await adminClient
      .from("users")
      .select("id, email, full_name, role, \"current_role\"")
      .eq("id", authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    // Check if user is a super_admin
    const isSuperAdmin = user.current_role === 'super_admin' || user.role === 'super_admin'

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Super admin access required" },
        { status: 401 }
      )
    }

    // Fetch all coach notes with related information
    const { data: notes, error: notesError } = await adminClient
      .from("student_notes")
      .select(`
        id,
        content,
        created_at,
        author_id,
        student_id,
        users!student_notes_author_id_fkey (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (notesError) {
      console.error("Error fetching coach notes:", notesError)
      return NextResponse.json(
        { success: false, error: `Failed to fetch notes: ${notesError.message}` },
        { status: 500 }
      )
    }

    // Fetch student information for each note
    const notesWithStudents = []
    for (const note of notes || []) {
      // Get student information
      const { data: student } = await adminClient
        .from("users")
        .select("full_name, email")
        .eq("id", note.student_id)
        .single()

      // Get coach information (author of the note)
      const coach = note.users

      notesWithStudents.push({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        coach: {
          id: note.author_id,
          name: coach?.full_name || "Unknown Coach",
          email: coach?.email || "unknown@example.com"
        },
        student: {
          id: note.student_id,
          name: student?.full_name || "Unknown Student",
          email: student?.email || "unknown@example.com"
        }
      })
    }

    // Fetch coach-student assignments for additional context
    const { data: assignments, error: assignmentsError } = await adminClient
      .from("coach_student_assignments")
      .select(`
        id,
        coach_id,
        student_id,
        assigned_at,
        is_active,
        coach:users!coach_student_assignments_coach_id_fkey (
          full_name,
          email
        ),
        student:users!coach_student_assignments_student_id_fkey (
          full_name,
          email
        )
      `)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false })

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError)
      return NextResponse.json(
        { success: false, error: `Failed to fetch assignments: ${assignmentsError.message}` },
        { status: 500 }
      )
    }

    // Format assignments data
    const formattedAssignments = assignments?.map(assignment => ({
      id: assignment.id,
      assigned_at: assignment.assigned_at,
      is_active: assignment.is_active,
      coach: {
        id: assignment.coach_id,
        name: assignment.coach?.full_name || "Unknown Coach",
        email: assignment.coach?.email || "unknown@example.com"
      },
      student: {
        id: assignment.student_id,
        name: assignment.student?.full_name || "Unknown Student",
        email: assignment.student?.email || "unknown@example.com"
      }
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        notes: notesWithStudents,
        assignments: formattedAssignments,
        totalNotes: notesWithStudents.length,
        totalAssignments: formattedAssignments.length
      }
    })

  } catch (error: any) {
    console.error("Error in GET /api/super-admin/coach-activity:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

