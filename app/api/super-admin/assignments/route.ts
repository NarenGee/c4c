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

    // Get all coach-student assignments with coach and student details
    const { data: assignments, error } = await adminClient
      .from("coach_student_assignments")
      .select(`
        id,
        coach_id,
        student_id,
        assigned_at,
        is_active,
        notes,
        coach:coach_id (
          id,
          email,
          full_name,
          coach_profiles (
            organization
          )
        ),
        student:student_id (
          id,
          email,
          full_name
        )
      `)
      .order("assigned_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch assignments:", error)
      return NextResponse.json(
        { error: "Failed to fetch assignments" },
        { status: 500 }
      )
    }

    // Format the response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      coach_id: assignment.coach_id,
      student_id: assignment.student_id,
      coach_name: assignment.coach?.full_name || "Unknown Coach",
      coach_email: assignment.coach?.email || "",
      coach_organization: assignment.coach?.coach_profiles?.[0]?.organization || "No Organization",
      student_name: assignment.student?.full_name || "Unknown Student",
      student_email: assignment.student?.email || "",
      assigned_at: assignment.assigned_at,
      is_active: assignment.is_active,
      notes: assignment.notes,
    }))

    return NextResponse.json(formattedAssignments)

  } catch (error) {
    console.error("Super admin assignments error:", error)
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is super admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const { coach_id, student_id, notes } = await request.json()

    if (!coach_id || !student_id) {
      return NextResponse.json(
        { error: "Coach ID and Student ID are required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Check if assignment already exists
    const { data: existingAssignment } = await adminClient
      .from("coach_student_assignments")
      .select("id")
      .eq("coach_id", coach_id)
      .eq("student_id", student_id)
      .single()

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Assignment already exists between this coach and student" },
        { status: 409 }
      )
    }

    // Create new assignment
    const { error } = await adminClient
      .from("coach_student_assignments")
      .insert({
        coach_id,
        student_id,
        assigned_by: currentUser.id,
        notes: notes || null,
        is_active: true,
      })

    if (error) {
      console.error("Failed to create assignment:", error)
      return NextResponse.json(
        { error: "Failed to create assignment" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Super admin assignment creation error:", error)
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is super admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const { assignmentId, updates } = await request.json()

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Update assignment
    const { error } = await adminClient
      .from("coach_student_assignments")
      .update(updates)
      .eq("id", assignmentId)

    if (error) {
      console.error("Failed to update assignment:", error)
      return NextResponse.json(
        { error: "Failed to update assignment" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Super admin assignment update error:", error)
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is super admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get("assignmentId")

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Delete assignment
    const { error } = await adminClient
      .from("coach_student_assignments")
      .delete()
      .eq("id", assignmentId)

    if (error) {
      console.error("Failed to delete assignment:", error)
      return NextResponse.json(
        { error: "Failed to delete assignment" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Super admin assignment delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    )
  }
}

