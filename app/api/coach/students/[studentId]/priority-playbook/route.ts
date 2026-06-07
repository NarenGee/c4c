import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizeSession } from "@/lib/priority-playbook/types"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data: user, error: userError } = await adminClient
      .from("users")
      .select('id, role, "current_role"')
      .eq("id", authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const isAuthorized =
      user.current_role === "coach" ||
      user.current_role === "super_admin" ||
      user.role === "coach" ||
      user.role === "super_admin"

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (user.current_role === "coach" || user.role === "coach") {
      const { data: assignment } = await adminClient
        .from("coach_student_assignments")
        .select("id")
        .eq("coach_id", user.id)
        .eq("student_id", studentId)
        .eq("is_active", true)
        .single()

      if (!assignment) {
        return NextResponse.json({ success: false, error: "No access" }, { status: 403 })
      }
    }

    const { data: session, error: sessionError } = await adminClient
      .from("priority_playbook_sessions")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sessionError) {
      return NextResponse.json({ success: false, error: sessionError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      session: session ? normalizeSession(session) : null,
    })
  } catch (error) {
    console.error("Coach playbook GET error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
