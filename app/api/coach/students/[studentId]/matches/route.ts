import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

    // Fetch student college matches
    const { data: matches, error: matchesError } = await adminClient
      .from("college_matches")
      .select("*")
      .eq("student_id", studentId)
      .order("match_score", { ascending: false })
      
    console.log(`🎯 Matches query:`, {
      found: matches?.length || 0,
      error: matchesError,
      studentId: studentId
    })

    if (matchesError) {
      console.error("Error fetching matches:", matchesError)
      return NextResponse.json(
        { success: false, error: "Failed to fetch matches" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      matches: matches || []
    })

  } catch (error: any) {
    console.error("Error in GET /api/coach/students/[studentId]/matches:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}



