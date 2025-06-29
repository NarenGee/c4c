import { createClient } from "@/lib/supabase/server"
import { getCurrentUserWithRetry } from "./auth-utils"

export type UserRole = "student" | "parent" | "counselor"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export async function getCurrentUser(): Promise<User | null> {
  return getCurrentUserWithRetry()
}

export async function createUserProfile(userId: string, email: string, fullName: string, role: UserRole) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      full_name: fullName,
      role,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getStudentProfileCompletion(userId: string): Promise<{
  isComplete: boolean
  completionPercentage: number
  missingFields: string[]
}> {
  const supabase = await createClient()

  try {
    const { data: profile } = await supabase.from("student_profiles").select("*").eq("user_id", userId).single()

    if (!profile) {
      return {
        isComplete: false,
        completionPercentage: 0,
        missingFields: ["All profile fields"],
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
    let completedFields = 0

    requiredFields.forEach((field) => {
      const value = profile[field]
      if (!value || (Array.isArray(value) && value.length === 0)) {
        missingFields.push(field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()))
      } else {
        completedFields++
      }
    })

    // Add test scores check
    if (!profile.sat_score && !profile.act_score) {
      missingFields.push("Test Scores (SAT or ACT)")
    } else {
      completedFields++
    }

    const totalFields = requiredFields.length + 1 // +1 for test scores
    const completionPercentage = Math.round((completedFields / totalFields) * 100)
    const isComplete = completionPercentage >= 80

    return {
      isComplete,
      completionPercentage,
      missingFields,
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
