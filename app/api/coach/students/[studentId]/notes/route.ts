import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Fetch notes for a student
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
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

    // Get user profile
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

    // Check if user is a coach or super_admin
    const isAuthorized = user.current_role === 'coach' || 
                        user.current_role === 'super_admin' || 
                        user.role === 'coach' || 
                        user.role === 'super_admin'

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Coach or admin access required" },
        { status: 401 }
      )
    }

    // If coach, verify they have access to this student
    if (user.current_role === 'coach' || user.role === 'coach') {
      const { data: assignment } = await adminClient
        .from("coach_student_assignments")
        .select("id")
        .eq("coach_id", user.id)
        .eq("student_id", params.studentId)
        .eq("is_active", true)
        .single()

      if (!assignment) {
        return NextResponse.json(
          { success: false, error: "Unauthorized - No access to this student" },
          { status: 403 }
        )
      }
    }

    // Fetch notes - start with basic columns first
    const { data: notes, error: notesError } = await adminClient
      .from("student_notes")
      .select(`
        id,
        note_type,
        content,
        created_at,
        author_id
      `)
      .eq("student_id", params.studentId)
      .order("created_at", { ascending: false })

    if (notesError) {
      console.error("Error fetching notes:", notesError)
      return NextResponse.json(
        { success: false, error: `Failed to fetch notes: ${notesError.message}` },
        { status: 500 }
      )
    }

    // Fetch author names separately to avoid join issues
    const notesWithAuthors = []
    for (const note of notes || []) {
      const { data: author } = await adminClient
        .from("users")
        .select("full_name")
        .eq("id", note.author_id)
        .single()

      notesWithAuthors.push({
        id: note.id,
        note_type: note.note_type,
        content: note.content,
        college_name: null, // Will add these columns later
        meeting_date: null,
        created_at: note.created_at,
        author_name: author?.full_name || "Unknown"
      })
    }

    return NextResponse.json({
      success: true,
      notes: notesWithAuthors
    })

  } catch (error: any) {
    console.error("Error in GET /api/coach/students/[studentId]/notes:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Add a new note
export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
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

    // Get user profile
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

    // Check if user is a coach or super_admin
    const isAuthorized = user.current_role === 'coach' || 
                        user.current_role === 'super_admin' || 
                        user.role === 'coach' || 
                        user.role === 'super_admin'

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Coach or admin access required" },
        { status: 401 }
      )
    }

    // If coach, verify they have access to this student
    if (user.current_role === 'coach' || user.role === 'coach') {
      const { data: assignment } = await adminClient
        .from("coach_student_assignments")
        .select("id")
        .eq("coach_id", user.id)
        .eq("student_id", params.studentId)
        .eq("is_active", true)
        .single()

      if (!assignment) {
        return NextResponse.json(
          { success: false, error: "Unauthorized - No access to this student" },
          { status: 403 }
        )
      }
    }

    // Parse request body
    const body = await request.json()
    const { note_type, content, college_name, meeting_date } = body

    // Validate required fields
    if (!note_type || !content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: note_type, content" },
        { status: 400 }
      )
    }

    if (!["general", "application", "meeting"].includes(note_type)) {
      return NextResponse.json(
        { success: false, error: "Invalid note_type. Must be: general, application, or meeting" },
        { status: 400 }
      )
    }

    // Create note (without optional columns for now)
    const { data: note, error: noteError } = await adminClient
      .from("student_notes")
      .insert({
        student_id: params.studentId,
        author_id: user.id,
        note_type,
        content: content.trim()
        // TODO: Add college_name and meeting_date once columns are added
      })
      .select()
      .single()

    if (noteError) {
      console.error("Error creating note:", noteError)
      return NextResponse.json(
        { success: false, error: "Failed to create note" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Note added successfully",
      note
    })

  } catch (error: any) {
    console.error("Error in POST /api/coach/students/[studentId]/notes:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
