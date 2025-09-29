"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export interface Task {
  id: string
  text: string
  completed: boolean
  created_at: string
}

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
  application_status: 'Considering' | 'Planning to Apply' | 'Applied' | 'Interviewing' | 'Accepted' | 'Rejected' | 'Enrolled'
  application_deadline?: string
  is_favorite?: boolean
  tasks?: Task[]
  stage_order?: number
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
  application_status?: 'Considering' | 'Planning to Apply' | 'Applied' | 'Interviewing' | 'Accepted' | 'Rejected' | 'Enrolled'
  is_favorite?: boolean
  tasks?: Task[]
  stage_order?: number
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
        application_status: collegeData.application_status || "Considering",
        is_favorite: collegeData.is_favorite || false,
        tasks: collegeData.tasks || [],
        stage_order: collegeData.stage_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("Add college error:", error)
      
      // Handle specific error codes
      if (error.code === "23505") {
        // Unique constraint violation
        return { success: false, error: "This college is already in your list" }
      }
      
      if (error.code === "42P01") {
        // Table doesn't exist
        return { success: false, error: "Database table not found. Please check your database setup." }
      }
      
      if (error.code === "23502") {
        // Not null constraint violation
        return { success: false, error: "Required field is missing. Please check all required fields." }
      }
      
      if (error.code === "23503") {
        // Foreign key constraint violation
        return { success: false, error: "User authentication error. Please try logging in again." }
      }

      if (error.code === "42501") {
        // Insufficient privilege
        return { success: false, error: "Permission denied. Please check your user permissions." }
      }

      // For debugging: include more error details
      const errorDetails = {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      }
      
      console.error("Detailed error info:", errorDetails)
      
      return { 
        success: false, 
        error: `Database error: ${error.message || 'Unknown error'} (Code: ${error.code || 'unknown'})` 
      }
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

    data.forEach((item: CollegeListItem) => {
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

// Move college to a different stage (for Kanban board)
export async function moveCollegeToStage(
  collegeId: string,
  newStage: CollegeListItem['application_status'],
  newOrder?: number
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
        application_status: newStage,
        stage_order: newOrder || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collegeId)
      .eq("student_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Move college error:", error)
      return { success: false, error: "Failed to move college" }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Move college process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Toggle favorite status
export async function toggleCollegeFavorite(collegeId: string): Promise<CollegeListResult> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can update their college list" }
  }

  const supabase = await createClient()

  try {
    // First get current favorite status
    const { data: currentData, error: fetchError } = await supabase
      .from("my_college_list")
      .select("is_favorite")
      .eq("id", collegeId)
      .eq("student_id", user.id)
      .single()

    if (fetchError) {
      return { success: false, error: "College not found" }
    }

    // Toggle the favorite status
    const { data, error } = await supabase
      .from("my_college_list")
      .update({
        is_favorite: !currentData.is_favorite,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collegeId)
      .eq("student_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Toggle favorite error:", error)
      return { success: false, error: "Failed to update favorite status" }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Toggle favorite process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Update tasks for a college
export async function updateCollegeTasks(collegeId: string, tasks: Task[]): Promise<CollegeListResult> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can update their college list" }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("my_college_list")
      .update({
        tasks: tasks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collegeId)
      .eq("student_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Update tasks error:", error)
      return { success: false, error: "Failed to update tasks" }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Update tasks process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

// Fetch all colleges for dropdowns (sorted by country, then name)
export async function getAllColleges(search?: string) {
  const supabase = await createClient();
  if (!search || search.trim() === "") {
    return [];
  }
  const { data, error } = await supabase
    .from("colleges")
    .select("id, name, country, domain")
    .or(`name.ilike.%${search}%,domain.ilike.%${search}%`)
    .order("country", { ascending: true })
    .order("name", { ascending: true })
    .limit(20);
  if (error) {
    console.error("Failed to fetch colleges:", error);
    return [];
  }
  return data || [];
}
