"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export interface CollegeListItem {
  id: string
  student_id: string
  college_name: string
  college_location?: string
  college_type?: string
  tuition_range?: string
  acceptance_rate?: number
  source: string
  notes?: string
  priority: number
  application_status: string
  application_deadline?: string
  added_at: string
  updated_at: string
}

export interface AddCollegeData {
  college_name: string
  college_location?: string
  college_type?: string
  tuition_range?: string
  acceptance_rate?: number
  source?: string
  notes?: string
  priority?: number
  application_deadline?: string
}

export interface CollegeListResult {
  success: boolean
  error?: string
  data?: CollegeListItem
}

export interface CollegeListResponse {
  success: boolean
  error?: string
  data?: CollegeListItem[]
}

// Add college to student's list
export async function addCollegeToList(collegeData: AddCollegeData): Promise<CollegeListResult> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can add colleges to their list" }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("my_college_list")
      .insert({
        student_id: user.id,
        college_name: collegeData.college_name,
        college_location: collegeData.college_location,
        college_type: collegeData.college_type,
        tuition_range: collegeData.tuition_range,
        acceptance_rate: collegeData.acceptance_rate,
        source: collegeData.source || "Manually Added",
        notes: collegeData.notes,
        priority: collegeData.priority || 0,
        application_deadline: collegeData.application_deadline,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return { success: false, error: "This college is already in your list" }
      }
      console.error("Add college error:", error)
      return { success: false, error: "Failed to add college to list" }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Add college process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Remove college from student's list
export async function removeCollegeFromList(collegeId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can remove colleges from their list" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.from("my_college_list").delete().eq("id", collegeId).eq("student_id", user.id)

    if (error) {
      console.error("Remove college error:", error)
      return { success: false, error: "Failed to remove college from list" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Remove college process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Update college in student's list
export async function updateCollegeInList(
  collegeId: string,
  updates: Partial<AddCollegeData & { application_status: string }>,
): Promise<CollegeListResult> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can update their college list" }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("my_college_list")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collegeId)
      .eq("student_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Update college error:", error)
      return { success: false, error: "Failed to update college" }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Update college process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Get student's college list
export async function getMyCollegeList(): Promise<CollegeListResponse> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can view their college list" }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("my_college_list")
      .select("*")
      .eq("student_id", user.id)
      .order("priority", { ascending: true })
      .order("added_at", { ascending: false })

    if (error) {
      // If table doesn't exist in the preview DB just return an empty list
      if ((error as any).code === "42P01") {
        console.warn("my_college_list table not found – returning empty list (preview mode)")
        return { success: true, data: [] }
      }
      console.error("Get college list error:", error)
      return { success: false, error: "Failed to load college list" }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Get college list process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Get college list for a specific student (for parents/counselors)
export async function getStudentCollegeList(studentId: string): Promise<CollegeListResponse> {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Must be logged in" }
  }

  // If requesting own list
  if (user.id === studentId && user.role === "student") {
    return getMyCollegeList()
  }

  // Check if user has permission to view this student's list
  if (user.role !== "parent" && user.role !== "counselor") {
    return { success: false, error: "Permission denied" }
  }

  const supabase = await createClient()

  try {
    // Verify relationship exists
    const { data: relationship } = await supabase
      .from("user_relationships")
      .select("id")
      .eq("primary_user_id", studentId)
      .eq("secondary_user_id", user.id)
      .eq("status", "approved")
      .single()

    if (!relationship) {
      return { success: false, error: "You don't have permission to view this student's college list" }
    }

    const { data, error } = await supabase
      .from("my_college_list")
      .select("*")
      .eq("student_id", studentId)
      .order("priority", { ascending: true })
      .order("added_at", { ascending: false })

    if (error) {
      console.error("Get student college list error:", error)
      return { success: false, error: "Failed to load college list" }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("Get student college list process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Get college list statistics
export async function getCollegeListStats() {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return {
      total: 0,
      byStatus: {},
      byPriority: {},
      bySource: {},
    }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("my_college_list")
      .select("application_status, priority, source")
      .eq("student_id", user.id)

    if (error) {
      if ((error as any).code === "42P01") {
        console.warn("my_college_list table not found – returning zero stats (preview mode)")
        return {
          total: 0,
          byStatus: {},
          byPriority: {},
          bySource: {},
        }
      }
      console.error("Get college stats error:", error)
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        bySource: {},
      }
    }

    const stats = {
      total: data.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
    }

    data.forEach((item) => {
      // Count by status
      stats.byStatus[item.application_status] = (stats.byStatus[item.application_status] || 0) + 1

      // Count by priority
      const priorityLabel =
        item.priority === 1 ? "High" : item.priority === 2 ? "Medium" : item.priority === 3 ? "Low" : "Not Set"
      stats.byPriority[priorityLabel] = (stats.byPriority[priorityLabel] || 0) + 1

      // Count by source
      stats.bySource[item.source] = (stats.bySource[item.source] || 0) + 1
    })

    return stats
  } catch (error: any) {
    console.error("Get college stats process error:", error)
    return {
      total: 0,
      byStatus: {},
      byPriority: {},
      bySource: {},
    }
  }
}
