"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

export interface CollegeMatch {
  id: string
  student_id: string
  college_name: string
  match_score: number
  justification: string
  source_links: string[]
  country?: string
  city?: string
  program_type?: string
  estimated_cost?: string
  admission_requirements?: string
  generated_at: string
  profile_snapshot: any
}

export interface StudentProfile {
  // Academic Information
  test_type?: string // IB, A-Levels, SAT/ACT, etc.
  total_score?: string
  gpa?: number
  sat_score?: number
  act_score?: number
  ib_score?: number
  a_level_grades?: string
  hl_subjects?: string[]
  sl_subjects?: string[]

  // Preferences
  intended_major?: string
  campus_type?: string // Urban, Suburban, Rural
  location_preference?: string
  distance_from_home?: string
  financial_aid_needed?: boolean
  budget_range?: string

  // Background
  extracurriculars?: string[]
  work_experience?: string
  volunteer_work?: string
  languages?: string[]
  special_circumstances?: string

  // Personal
  interests?: string[]
  career_goals?: string
  preferred_class_size?: string
  research_interest?: boolean
}

const CollegeRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      college_name: z.string(),
      match_score: z.number().min(0).max(1),
      justification: z.string(),
      source_links: z.array(z.string()).optional().default([]),
      country: z.string().optional(),
      city: z.string().optional(),
      program_type: z.string().optional(),
      estimated_cost: z.string().optional(),
      admission_requirements: z.string().optional(),
    }),
  ),
})

export async function generateCollegeRecommendations(
  profileData: StudentProfile,
): Promise<{ success: boolean; error?: string; matches?: CollegeMatch[] }> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can generate college recommendations" }
  }

  const supabase = await createClient()
  const startTime = Date.now()

  try {
    // Construct the Gemini prompt
    const prompt = constructGeminiPrompt(profileData, user.full_name)

    // Log the prompt
    const { data: logEntry } = await supabase
      .from("gemini_logs")
      .insert({
        student_id: user.id,
        prompt_text: prompt,
        model_used: "gemini-1.5-pro",
        success: false, // Will update after successful response
      })
      .select()
      .single()

    // Call Gemini API
    const { object: recommendations } = await generateObject({
      model: google("gemini-1.5-pro"),
      prompt,
      schema: CollegeRecommendationSchema,
    })

    const processingTime = Date.now() - startTime

    // Update log with success
    if (logEntry) {
      await supabase
        .from("gemini_logs")
        .update({
          response_text: JSON.stringify(recommendations),
          processing_time_ms: processingTime,
          success: true,
        })
        .eq("id", logEntry.id)
    }

    // Clear existing matches for this student
    await supabase.from("college_matches").delete().eq("student_id", user.id)

    // Store new recommendations
    const matchesToInsert = recommendations.recommendations.map((rec) => ({
      student_id: user.id,
      college_name: rec.college_name,
      match_score: rec.match_score,
      justification: rec.justification,
      source_links: rec.source_links || [],
      country: rec.country,
      city: rec.city,
      program_type: rec.program_type,
      estimated_cost: rec.estimated_cost,
      admission_requirements: rec.admission_requirements,
      profile_snapshot: profileData,
    }))

    const { data: insertedMatches, error: insertError } = await supabase
      .from("college_matches")
      .insert(matchesToInsert)
      .select()

    if (insertError) {
      console.error("Error storing college matches:", insertError)
      return { success: false, error: "Failed to store recommendations" }
    }

    return { success: true, matches: insertedMatches }
  } catch (error: any) {
    const processingTime = Date.now() - startTime

    // Log the error
    await supabase.from("gemini_logs").insert({
      student_id: user.id,
      prompt_text: constructGeminiPrompt(profileData, user.full_name),
      model_used: "gemini-1.5-pro",
      processing_time_ms: processingTime,
      success: false,
      error_message: error.message,
    })

    console.error("Gemini API error:", error)
    return { success: false, error: "Failed to generate recommendations. Please try again." }
  }
}

function constructGeminiPrompt(profile: StudentProfile, studentName: string): string {
  return `You are an expert in global university admissions and college advising with access to comprehensive data from top university ranking sites, admission statistics, and financial aid information. A student named ${studentName} has provided the following detailed profile:

ACADEMIC PROFILE:
${profile.test_type ? `- Test Type: ${profile.test_type}` : ""}
${profile.total_score ? `- Total Score: ${profile.total_score}` : ""}
${profile.gpa ? `- GPA: ${profile.gpa}` : ""}
${profile.sat_score ? `- SAT Score: ${profile.sat_score}` : ""}
${profile.act_score ? `- ACT Score: ${profile.act_score}` : ""}
${profile.ib_score ? `- IB Score: ${profile.ib_score}` : ""}
${profile.a_level_grades ? `- A-Level Grades: ${profile.a_level_grades}` : ""}
${profile.hl_subjects?.length ? `- HL Subjects: ${profile.hl_subjects.join(", ")}` : ""}
${profile.sl_subjects?.length ? `- SL Subjects: ${profile.sl_subjects.join(", ")}` : ""}

PREFERENCES & GOALS:
${profile.intended_major ? `- Intended Major: ${profile.intended_major}` : ""}
${profile.campus_type ? `- Campus Type: ${profile.campus_type}` : ""}
${profile.location_preference ? `- Location Preference: ${profile.location_preference}` : ""}
${profile.distance_from_home ? `- Distance from Home: ${profile.distance_from_home}` : ""}
${profile.financial_aid_needed ? `- Financial Aid Needed: ${profile.financial_aid_needed ? "Yes" : "No"}` : ""}
${profile.budget_range ? `- Budget Range: ${profile.budget_range}` : ""}
${profile.career_goals ? `- Career Goals: ${profile.career_goals}` : ""}
${profile.preferred_class_size ? `- Preferred Class Size: ${profile.preferred_class_size}` : ""}
${profile.research_interest ? `- Research Interest: ${profile.research_interest ? "Yes" : "No"}` : ""}

BACKGROUND & EXPERIENCE:
${profile.extracurriculars?.length ? `- Extracurriculars: ${profile.extracurriculars.join(", ")}` : ""}
${profile.work_experience ? `- Work Experience: ${profile.work_experience}` : ""}
${profile.volunteer_work ? `- Volunteer Work: ${profile.volunteer_work}` : ""}
${profile.languages?.length ? `- Languages: ${profile.languages.join(", ")}` : ""}
${profile.interests?.length ? `- Interests: ${profile.interests.join(", ")}` : ""}
${profile.special_circumstances ? `- Special Circumstances: ${profile.special_circumstances}` : ""}

TASK:
Using your expertise and knowledge of global universities, please:

1. **Think step-by-step** about this student's profile:
   - Analyze their academic competitiveness
   - Evaluate fit with their stated preferences
   - Consider financial aid availability and affordability
   - Assess campus culture and environment match
   - Factor in admission chances based on historical data

2. **Recommend 8-12 universities** that would be excellent matches, including:
   - 2-3 "reach" schools (competitive but possible)
   - 4-6 "match" schools (good fit with solid admission chances)
   - 2-3 "safety" schools (likely admission with good programs)

3. **For each recommendation**, provide:
   - A match score between 0.0 and 1.0 (where 1.0 is perfect match)
   - A 2-3 sentence justification explaining why this university fits
   - Specific reasons related to academics, culture, location, and opportunities
   - Include source information when possible (topuniversities.com, collegevine.com, etc.)

4. **Consider global universities** including but not limited to:
   - Top US universities (Ivy League, state schools, liberal arts colleges)
   - UK universities (Russell Group, etc.)
   - Canadian universities
   - Australian universities
   - European universities with English programs
   - Asian universities with strong international programs

Please provide comprehensive, thoughtful recommendations that truly match this student's profile and goals. Focus on universities that offer strong programs in their intended field, align with their preferences, and provide realistic admission opportunities.`
}

export async function getStudentCollegeMatches(): Promise<{
  success: boolean
  error?: string
  matches?: CollegeMatch[]
}> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can view their college matches" }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("college_matches")
      .select("*")
      .eq("student_id", user.id)
      .order("match_score", { ascending: false })

    if (error) {
      // Handle case where table doesn't exist in preview
      if ((error as any).code === "42P01") {
        console.warn("college_matches table not found – returning empty list (preview mode)")
        return { success: true, matches: [] }
      }
      console.error("Get college matches error:", error)
      return { success: false, error: "Failed to load college matches" }
    }

    return { success: true, matches: data || [] }
  } catch (error: any) {
    console.error("Get college matches process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function deleteCollegeMatches(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()

  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can delete their college matches" }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.from("college_matches").delete().eq("student_id", user.id)

    if (error) {
      console.error("Delete college matches error:", error)
      return { success: false, error: "Failed to delete college matches" }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Delete college matches process error:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}
