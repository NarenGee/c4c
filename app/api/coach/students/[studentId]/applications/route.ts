import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

    // Fetch student applications from my_college_list
    const { data: applications, error: applicationsError } = await adminClient
      .from("my_college_list")
      .select(`
        id,
        college_name,
        application_status,
        application_deadline,
        updated_at
      `)
      .eq("student_id", params.studentId)
      .order("updated_at", { ascending: false })
      
    console.log(`🎓 Applications query:`, {
      found: applications?.length || 0,
      error: applicationsError,
      studentId: params.studentId
    })

    if (applicationsError) {
      console.error("Error fetching applications:", applicationsError)
      return NextResponse.json(
        { success: false, error: "Failed to fetch applications" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      applications: applications || []
    })

  } catch (error: any) {
    console.error("Error in GET /api/coach/students/[studentId]/applications:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
