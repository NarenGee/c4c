import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check if user is super admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()

    // Get total users count
    const { count: totalUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })

    // Get students count
    const { count: totalStudents } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "student")

    // Get coaches count
    const { count: totalCoaches } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "coach")

    // Get total assignments count
    const { count: totalAssignments } = await adminClient
      .from("coach_student_assignments")
      .select("*", { count: "exact", head: true })

    // Get active assignments count
    const { count: activeAssignments } = await adminClient
      .from("coach_student_assignments")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    const stats = {
      total_users: totalUsers || 0,
      total_students: totalStudents || 0,
      total_coaches: totalCoaches || 0,
      total_assignments: totalAssignments || 0,
      active_assignments: activeAssignments || 0,
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error("Super admin stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch system stats" },
      { status: 500 }
    )
  }
}

