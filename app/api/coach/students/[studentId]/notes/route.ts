import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Fetch notes for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
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
        .eq("student_id", studentId)
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
            type,
            content,
            created_at,
            author_id,
            visible_to_student,
            parent_note_id,
            is_reply
          `)
          .eq("student_id", studentId)
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
            type: note.type,
            content: note.content,
            college_name: null, // Will add these columns later
            meeting_date: null,
            created_at: note.created_at,
            author_name: author?.full_name || "Unknown",
            author_id: note.author_id,
            visible_to_student: note.visible_to_student,
            parent_note_id: note.parent_note_id,
            is_reply: note.is_reply
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
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
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
        .eq("student_id", studentId)
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
    const { content, college_name, meeting_date, visible_to_student } = body

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Missing required field: content" },
        { status: 400 }
      )
    }

        // Create note (always set to note type)
        const { data: note, error: noteError } = await adminClient
          .from("student_notes")
          .insert({
            student_id: studentId,
            author_id: user.id,
            author: user.full_name || "Unknown Coach",
            type: "note",
            content: content.trim(),
            visible_to_student: visible_to_student || false,
            parent_note_id: body.parent_note_id || null,
            is_reply: body.is_reply || false
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

// PATCH - Update note visibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
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
        .eq("student_id", studentId)
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
    const { noteId, visible_to_student } = body

    // Validate required fields
    if (!noteId || typeof visible_to_student !== 'boolean') {
      return NextResponse.json(
        { success: false, error: "Missing required fields: noteId and visible_to_student" },
        { status: 400 }
      )
    }

    // Update note visibility
    const { data: note, error: noteError } = await adminClient
      .from("student_notes")
      .update({
        visible_to_student: visible_to_student
      })
      .eq("id", noteId)
      .eq("student_id", studentId)
      .select()
      .single()

    if (noteError) {
      console.error("Error updating note:", noteError)
      return NextResponse.json(
        { success: false, error: "Failed to update note" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Note visibility updated successfully",
      note
    })

  } catch (error: any) {
    console.error("Error in PATCH /api/coach/students/[studentId]/notes:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
