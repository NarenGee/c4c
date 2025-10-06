import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

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

    const { assignments } = await request.json()

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: "Assignments array is required" },
        { status: 400 }
      )
    }

    // Validate each assignment
    for (const assignment of assignments) {
      if (!assignment.coach_id || !assignment.student_id) {
        return NextResponse.json(
          { error: "Each assignment must have coach_id and student_id" },
          { status: 400 }
        )
      }
    }

    const adminClient = createAdminClient()

    // Check for existing assignments to avoid duplicates
    const coachStudentPairs = assignments.map(a => `${a.coach_id}-${a.student_id}`)
    
    const { data: existingAssignments } = await adminClient
      .from("coach_student_assignments")
      .select("coach_id, student_id")
      .in("coach_id", assignments.map(a => a.coach_id))
      .in("student_id", assignments.map(a => a.student_id))

    const existingPairs = new Set(
      existingAssignments?.map(a => `${a.coach_id}-${a.student_id}`) || []
    )

    // Filter out duplicates
    const newAssignments = assignments.filter(assignment => 
      !existingPairs.has(`${assignment.coach_id}-${assignment.student_id}`)
    )

    if (newAssignments.length === 0) {
      return NextResponse.json(
        { error: "All assignments already exist" },
        { status: 409 }
      )
    }

    // Prepare assignments for insertion
    const assignmentsToInsert = newAssignments.map(assignment => ({
      coach_id: assignment.coach_id,
      student_id: assignment.student_id,
      assigned_by: currentUser.id,
      notes: assignment.notes || null,
      is_active: true,
    }))

    // Insert all assignments
    const { data, error } = await adminClient
      .from("coach_student_assignments")
      .insert(assignmentsToInsert)
      .select()

    if (error) {
      console.error("Failed to create bulk assignments:", error)
      return NextResponse.json(
        { error: "Failed to create assignments" },
        { status: 500 }
      )
    }

    const duplicateCount = assignments.length - newAssignments.length
    const successCount = newAssignments.length

    return NextResponse.json({
      success: true,
      message: `Successfully created ${successCount} assignment(s)${duplicateCount > 0 ? `. ${duplicateCount} duplicate(s) skipped.` : ''}`,
      created: successCount,
      duplicates: duplicateCount,
      assignments: data
    })

  } catch (error: any) {
    console.error("Bulk assignment creation error:", error)
    return NextResponse.json(
      { error: "Failed to create assignments" },
      { status: 500 }
    )
  }
}





