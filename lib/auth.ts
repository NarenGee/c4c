import { createClient } from "@/lib/supabase/server"
import { getCurrentUserSimple } from "./auth-utils-simple"

export type UserRoleType = "student" | "parent" | "counselor" | "coach" | "super_admin"

export interface UserRole {
  id: string
  user_id: string
  role: UserRoleType
  organization?: string
  is_active: boolean
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRoleType // Current active role
  current_role: UserRoleType
  created_at: string
  updated_at: string
  roles?: UserRole[] // All available roles
  organization?: string // Organization for current role
}

export async function getCurrentUser(): Promise<User | null> {
  return getCurrentUserSimple()
}

export async function createUserProfile(userId: string, email: string, fullName: string, role: UserRoleType, organization?: string) {
  const supabase = await createClient()

  // First create or update the user record
  const { data: userData, error: userError } = await supabase
    .from("users")
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      role,
      current_role: role,
    })
    .select()
    .single()

  if (userError) throw userError

  // Add the role to user_roles table
  const { error: roleError } = await supabase.rpc('add_user_role', {
    target_role: role,
    org: organization
  })

  if (roleError) throw roleError

  return userData
}

export async function getStudentProfileCompletion(userId: string): Promise<{
  isComplete: boolean
  completionPercentage: number
  missingFields: string[]
}> {
  const supabase = await createClient()

  try {
    const { data: profile } = await supabase.from("student_profiles").select("*").eq("user_id", userId).single()

    // Get college matches count (indicates they've generated recommendations)
    const { count: matchesCount } = await supabase
      .from("college_matches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // Get college list count (indicates they've added colleges to their list)  
    const { count: collegeListCount } = await supabase
      .from("my_college_list")
      .select("*", { count: "exact", head: true })
      .eq("student_id", userId)

    const hasCollegeMatches = matchesCount && matchesCount > 0
    const hasCollegeList = collegeListCount && collegeListCount > 0

    if (!profile) {
      // Even without profile, they might have done other steps
      let completedSections = 0
      if (hasCollegeMatches) completedSections++
      if (hasCollegeList) completedSections++
      
      const baseCompletion = Math.round((completedSections / 3) * 100)
      
      return {
        isComplete: false,
        completionPercentage: baseCompletion,
        missingFields: ["Basic profile information", 
                       !hasCollegeMatches ? "Generate college recommendations" : "",
                       !hasCollegeList ? "Add colleges to your list" : ""].filter(Boolean),
      }
    }

    const requiredFields = [
      "grade_level",
      "gpa", 
      "interests",
      "preferred_majors",
      "budget_range",
      "location_preferences",
    ]

    const missingFields: string[] = []
    let profileFieldsCompleted = 0

    requiredFields.forEach((field) => {
      const value = profile[field]
      if (!value || (Array.isArray(value) && value.length === 0)) {
        missingFields.push(field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()))
      } else {
        profileFieldsCompleted++
      }
    })

    // Add test scores check
    if (!profile.sat_score && !profile.act_score) {
      missingFields.push("Test Scores (SAT or ACT)")
    } else {
      profileFieldsCompleted++
    }

    // Calculate completion based on three main categories
    let completedSections = 0

    // 1. Basic Profile Details
    const totalProfileFields = requiredFields.length + 1
    const profileDetailsScore = profileFieldsCompleted / totalProfileFields
    if (profileDetailsScore >= 0.5) {
      completedSections++
    }

    // 2. Generated College Recommendations  
    if (hasCollegeMatches) {
      completedSections++
    } else {
      missingFields.push("Generate college recommendations")
    }

    // 3. Added Colleges to List
    if (hasCollegeList) {
      completedSections++
    } else {
      missingFields.push("Add colleges to your list")
    }

    // Calculate final percentage
    const baseCompletion = Math.round((completedSections / 3) * 100)
    
    // Bonus points for comprehensive profile details
    let bonusPoints = 0
    if (profileDetailsScore >= 0.8) {
      bonusPoints = 10
    }

    const completionPercentage = Math.min(100, baseCompletion + bonusPoints)
    const isComplete = completionPercentage >= 80

    return {
      isComplete,
      completionPercentage,
      missingFields: missingFields.filter(field => field !== ""),
    }
  } catch (error) {
    console.error("Error checking profile completion:", error)
    return {
      isComplete: false,
      completionPercentage: 0,
      missingFields: ["Unable to check profile"],
    }
  }
}
