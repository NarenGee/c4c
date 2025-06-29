"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export interface StudentProfile {
  test_type?: string
  total_score?: string
  gpa?: number
  sat_score?: number
  act_score?: number
  hl_subjects?: string[]
  sl_subjects?: string[]
  intended_major?: string
  campus_type?: string
  preferred_class_size?: string
  location_preference?: string
  distance_from_home?: string
  budget_range?: string
  financial_aid_needed?: boolean
  research_interest?: boolean
  extracurriculars?: string[]
  interests?: string[]
  languages?: string[]
  work_experience?: string
  volunteer_work?: string
  special_circumstances?: string
  career_goals?: string
}

export interface CollegeMatch {
  id: string
  user_id: string // ✔ matches DB
  college_name: string
  match_percentage: number
  reasoning: string
  pros: string[]
  cons: string[]
  fit_category: "Safety" | "Target" | "Reach"
  created_at: string
}

let hasLoggedMissingKey = false

export async function generateCollegeRecommendations(profile: StudentProfile) {
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      if (!hasLoggedMissingKey) {
        console.warn("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set")
        hasLoggedMissingKey = true
      }
      return {
        success: false,
        error: "Gemini API key not configured. Please contact your administrator.",
      }
    }

    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = createClient()

    // Create a comprehensive prompt for Gemini
    const prompt = `
You are a college admissions counselor AI. Based on the following student profile, recommend 8-10 colleges that would be good fits. For each college, provide:

1. College name
2. Match percentage (0-100)
3. Brief reasoning for the match
4. 3-4 pros (why it's a good fit)
5. 2-3 cons (potential concerns)
6. Fit category (Safety/Target/Reach)

Student Profile:
- Academic Background: ${profile.test_type || "Not specified"} ${profile.total_score ? `(Score: ${profile.total_score})` : ""}
- GPA: ${profile.gpa || "Not provided"}
- SAT: ${profile.sat_score || "Not provided"}
- ACT: ${profile.act_score || "Not provided"}
- Intended Major: ${profile.intended_major || "Undecided"}
- Campus Preference: ${profile.campus_type || "No preference"}
- Location: ${profile.location_preference || "No preference"}
- Budget Range: ${profile.budget_range || "Not specified"}
- Financial Aid Needed: ${profile.financial_aid_needed ? "Yes" : "No"}
- Research Interest: ${profile.research_interest ? "Yes" : "No"}
- Extracurriculars: ${profile.extracurriculars?.join(", ") || "None listed"}
- Work Experience: ${profile.work_experience || "None"}
- Volunteer Work: ${profile.volunteer_work || "None"}
- Special Circumstances: ${profile.special_circumstances || "None"}
- Career Goals: ${profile.career_goals || "Not specified"}

Please format your response as a JSON array of objects with the following structure:
[
  {
    "college_name": "University Name",
    "match_percentage": 85,
    "reasoning": "Brief explanation of why this is a good match",
    "pros": ["Pro 1", "Pro 2", "Pro 3"],
    "cons": ["Con 1", "Con 2"],
    "fit_category": "Target"
  }
]

Focus on realistic, well-known colleges and universities. Consider the student's academic profile, preferences, and goals when making recommendations.
`

    // Generate recommendations using Gemini
    const { text } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
      prompt,
      maxTokens: 4000,
    })

    // Log the Gemini interaction
    await supabase.from("gemini_logs").insert({
      user_id: user.id,
      prompt_type: "college_matching",
      prompt_text: prompt,
      response_text: text,
      tokens_used: text.length, // Approximate
    })

    // Parse the JSON response
    let recommendations: any[]
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No JSON array found in response")
      }
      recommendations = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError)
      return {
        success: false,
        error: "Failed to parse AI recommendations. Please try again.",
      }
    }

    // Store recommendations in database
    const collegeMatches = recommendations.map((rec, index) => ({
      user_id: user.id,
      college_name: rec.college_name,
      match_percentage: rec.match_percentage,
      reasoning: rec.reasoning,
      pros: rec.pros,
      cons: rec.cons,
      fit_category: rec.fit_category,
      rank_order: index + 1,
    }))

    // Clear existing matches for this user
    await supabase.from("college_matches").delete().eq("user_id", user.id)

    // Insert new matches
    const { error: insertError } = await supabase.from("college_matches").insert(collegeMatches)

    if (insertError) {
      console.error("Database error:", insertError)
      return {
        success: false,
        error: "Failed to save recommendations to database",
      }
    }

    return {
      success: true,
      matches: collegeMatches,
      message: `Generated ${collegeMatches.length} college recommendations`,
    }
  } catch (error: any) {
    console.error("College matching error:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}

export async function getCollegeMatches() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated", matches: [] }
    }

    const supabase = createClient()

    const { data: matches, error } = await supabase
      .from("college_matches")
      .select("*")
      .eq("user_id", user.id)
      .order("rank_order", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return { success: false, error: "Failed to fetch matches", matches: [] }
    }

    return {
      success: true,
      matches: matches || [],
    }
  } catch (error: any) {
    console.error("Get matches error:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
      matches: [],
    }
  }
}

// ────────────────────────────────────────────────────────────
//  █ Fetch current user's matches (used by CollegeMatchesView)
// ────────────────────────────────────────────────────────────
export async function getStudentCollegeMatches(): Promise<{
  success: boolean
  error?: string
  matches?: CollegeMatch[]
}> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("college_matches")
    .select("*")
    .eq("user_id", user.id)
    .order("rank_order", { ascending: true })

  if (error) {
    console.error("Get matches error:", error)
    return { success: false, error: "Failed to fetch matches" }
  }

  return { success: true, matches: data || [] }
}

// ────────────────────────────────────────────────────────────
//  █ Delete all current user's matches (Clear-All button)
// ────────────────────────────────────────────────────────────
export async function deleteCollegeMatches(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  const supabase = createClient()
  const { error } = await supabase.from("college_matches").delete().eq("user_id", user.id)

  if (error) {
    console.error("Delete matches error:", error)
    return { success: false, error: "Failed to delete matches" }
  }

  return { success: true }
}
