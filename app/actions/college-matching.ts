"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { generateText } from "ai"  
import { google } from "@ai-sdk/google"
import { GoogleGenerativeAI } from "@google/generative-ai"

export interface StudentProfile {
  test_type?: string
  total_score?: string
  gpa?: number
  sat_score?: number
  act_score?: number
  hl_subjects?: string[]
  sl_subjects?: string[]
  intended_major?: string
  intended_majors?: string[] // Add support for multiple majors
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
  preferred_countries?: string[]
  preferred_us_states?: string[]
  gradeLevel?: string
  countryOfResidence?: string
  stateProvince?: string
  gradingSystem?: string
  classRank?: string
  ibScore?: string
  ibSubjects?: { subject: string; level: string; grade: string }[]
  aLevelSubjects?: { subject: string; grade: string }[]
  extracurricularActivities?: { activity: string; tier: string; description: string }[]
  intendedMajor?: string
  collegeSize?: string
  campusSetting?: string
  geographicPreference?: string[]
  greekLifeImportant?: boolean
  strongAthletics?: boolean
  diverseStudentBody?: boolean
  strongAlumniNetwork?: boolean
  studyAbroadPrograms?: string
  researchOpportunities?: string
  internshipOpportunities?: string
  // Campus Life & Social Fit
  activeSocialLife?: string
  varietyOfClubs?: boolean
  campusEventsAndTraditions?: boolean
  residentialCommunityType?: string
  nightlifeOffCampusActivities?: boolean
  internationalStudentCommunity?: boolean
  religiousLifeImportant?: boolean
  religiousAffiliation?: string
  lgbtqFriendlyCampus?: boolean
  politicalActivism?: string
  campusSafety?: string
  weatherClimatePreference?: string[]
  // Academic & Career Opportunities
  studyAbroadImportant?: boolean
  undergraduateResearchImportant?: boolean
  internshipCoopImportant?: boolean
  honorsPrograms?: boolean
  acceleratedDegreePrograms?: boolean
  robustCareerServices?: boolean
  graduateEmployability?: string
  // Support & Community
  firstGenerationSupport?: boolean
  disabilityServices?: boolean
  lgbtqSupportServices?: boolean
  // Application Process Preferences
  testOptionalPolicy?: boolean
  earlyActionDecisionOptions?: boolean
  needBlindAdmission?: boolean
  // Academic & Institutional Reputation
  institutionalPrestige?: string
  // Other Preferences
  legacyConsideration?: boolean
  demonstratedInterest?: boolean
  otherSpecificPreferences?: string
  familyIncome?: string
  firstGenerationStudent?: boolean
  financialAidNeeded?: boolean
  dreamColleges?: string[] // Array of dream college names
}

export interface CollegeMatch {
  id: string
  student_id: string
  college_name: string
  match_score: number // 0-1 decimal
  admission_chance: number // 0-1 decimal representing percentage chance
  justification: string
  source_links?: string[]
  country?: string
  city?: string
  program_type?: string
  estimated_cost?: string
  admission_requirements?: string
  acceptance_rate?: number
  student_count?: number
  campus_setting?: string
  tuition_annual?: string
  match_reasons?: string[]
  website_url?: string
  fit_category: "Safety" | "Target" | "Reach"
  generated_at?: string
  is_dream_college?: boolean // Indicates if this college was selected as a dream college
}

let hasLoggedMissingKey = false

// Helper function to fetch complete student profile from database
async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  try {
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", studentId)
      .single()

    if (error || !profile) {
      console.warn("Could not fetch student profile:", error?.message || "No profile found")
      return null
    }

    // Convert database profile to StudentProfile format
    const studentProfile: StudentProfile = {
      gradeLevel: profile.grade_level,
      countryOfResidence: profile.country_of_residence,
      stateProvince: profile.state_province,
      gradingSystem: profile.grading_system,
      gpa: profile.gpa,
      classRank: profile.class_rank,
      sat_score: profile.sat_score,
      act_score: profile.act_score,
      ibScore: profile.ib_score,
      ibSubjects: profile.ib_subjects,
      aLevelSubjects: profile.a_level_subjects,
      extracurricularActivities: profile.extracurricular_activities,
      intended_majors: profile.preferred_majors,
      collegeSize: profile.college_size,
      campusSetting: profile.campus_setting,
      preferred_countries: profile.preferred_countries,
      budget_range: profile.budget_range,
      greekLifeImportant: profile.greek_life_important,
      strongAthletics: profile.strong_athletics,
      diverseStudentBody: profile.diverse_student_body,
      strongAlumniNetwork: profile.strong_alumni_network,
      studyAbroadPrograms: profile.study_abroad_programs,
      researchOpportunities: profile.research_opportunities,
      internshipOpportunities: profile.internship_opportunities,
      activeSocialLife: profile.active_social_life,
      varietyOfClubs: profile.variety_of_clubs,
      campusEventsAndTraditions: profile.campus_events_and_traditions,
      residentialCommunityType: profile.residential_community_type,
      nightlifeOffCampusActivities: profile.nightlife_off_campus_activities,
      internationalStudentCommunity: profile.international_student_community,
      religiousLifeImportant: profile.religious_life_important,
      religiousAffiliation: profile.religious_affiliation,
      lgbtqFriendlyCampus: profile.lgbtq_friendly_campus,
      familyIncome: profile.family_income,
      firstGenerationStudent: profile.first_generation_student,
      financialAidNeeded: profile.financial_aid_needed,
    }

    return studentProfile
  } catch (error) {
    console.error("Error fetching student profile:", error)
    return null
  }
}

export async function generateCollegeRecommendations(studentId: string, profile: StudentProfile): Promise<{ success: boolean; recommendations?: any[]; matches?: any[]; message?: string; error?: string }> {
  try {
    // Check if AI API key is available
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return {
        success: false,
        error: "AI service is not configured. Please check your API key.",
      }
    }

    const supabase = await createClient()
    const serviceSupabase = createServiceClient()
    const user = await getCurrentUser()
    
    // For database operations that need to bypass RLS, we'll use a service role client
    // but still validate the user first

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    if (user.id !== studentId) {
      return { success: false, error: "Unauthorized access" }
    }

    // Process dream colleges first, then continue with AI recommendations
    
    // First, sync dream colleges - remove any that are no longer in the profile
    const currentDreamColleges = profile.dreamColleges || []
    
    try {
      // Get existing dream colleges from database
      const { data: existingDreamColleges, error: fetchError } = await supabase
        .from("college_matches")
        .select("college_name")
        .eq("student_id", user.id)
        .eq("is_dream_college", true)
      
      if (fetchError) {
        console.error("Error fetching existing dream colleges:", fetchError)
      } else {
        const existingNames = existingDreamColleges?.map((college: any) => college.college_name) || []
        
        // Find dream colleges to remove (exist in DB but not in current profile)
        const collegesToRemove = existingNames.filter((name: string) => !currentDreamColleges.includes(name))
        
        // Remove outdated dream colleges from database
        if (collegesToRemove.length > 0) {
          const { error: deleteError } = await supabase
            .from("college_matches")
            .delete()
            .eq("student_id", user.id)
            .eq("is_dream_college", true)
            .in("college_name", collegesToRemove)
          
          if (deleteError) {
            console.error("Error removing outdated dream colleges:", deleteError)
          }
        }
        
        // Find dream colleges to add (exist in profile but not in DB)
        const collegesToAdd = currentDreamColleges.filter((name: string) => !existingNames.includes(name))
        
        // Process new dream colleges
        let dreamCollegeMatches: any[] = []
        if (collegesToAdd.length > 0) {
          for (const dreamCollegeName of collegesToAdd) {
            // Fetch detailed information for dream college
            const dreamCollegeDetails = await fetchDreamCollegeDetails(dreamCollegeName, profile)
            
            // Create dream college entry with fetched details
            const dreamCollegeMatch = {
              student_id: user.id,
              college_name: dreamCollegeName,
              match_score: dreamCollegeDetails.match_score || 0.9,
              admission_chance: dreamCollegeDetails.admission_chance || 0.5,
              justification: dreamCollegeDetails.justification || `This is one of your dream colleges that you specifically selected. It represents a college that you're passionate about attending.`,
              fit_category: "Target" as const, // Default to Target category
              is_dream_college: true,
              country: dreamCollegeDetails.country,
              city: dreamCollegeDetails.city,
              program_type: dreamCollegeDetails.program_type,
              estimated_cost: dreamCollegeDetails.estimated_cost,
              admission_requirements: dreamCollegeDetails.admission_requirements,
              acceptance_rate: dreamCollegeDetails.acceptance_rate,
              student_count: dreamCollegeDetails.student_count,
              campus_setting: dreamCollegeDetails.campus_setting,
              tuition_annual: dreamCollegeDetails.tuition_annual,
              match_reasons: dreamCollegeDetails.match_reasons || [
                "Selected as one of your dream colleges",
                "Represents a college you're passionate about attending"
              ],
              website_url: dreamCollegeDetails.website_url,
              source_links: null
            }
            
            dreamCollegeMatches.push(dreamCollegeMatch)
          }
          
          // Insert new dream college matches
          if (dreamCollegeMatches.length > 0) {
            const { error: dreamInsertError } = await serviceSupabase
              .from("college_matches")
              .insert(dreamCollegeMatches)
            
            if (dreamInsertError) {
              console.error("Error inserting new dream colleges:", dreamInsertError)
            }
          }
        }
      }
    } catch (dreamError) {
      console.error("Error synchronizing dream colleges:", dreamError)
    }

    // Continue with AI recommendation generation after dream college sync
    
    // First, clear any existing non-dream college recommendations to avoid duplicates
    const { error: deleteError } = await serviceSupabase
      .from("college_matches")
      .delete()
      .eq("student_id", user.id)
      .eq("is_dream_college", false)
    
    if (deleteError) {
      console.error("Error clearing existing recommendations:", deleteError)
    }

    // Create a comprehensive prompt for Gemini
    const prompt = `Generate personalized college recommendations for this student.

STUDENT PROFILE:
Grade: ${profile.gradeLevel || "Not specified"} | Country: ${profile.countryOfResidence || "Not specified"} | State: ${profile.stateProvince || "Not specified"}
Major: ${Array.isArray(profile.intended_majors) ? profile.intended_majors.join(", ") : profile.intended_majors || "Not specified"}
Grading: ${profile.gradingSystem || "Not specified"} | GPA: ${profile.gpa || "N/A"} | Class Rank: ${profile.classRank || "N/A"}
SAT: ${profile.sat_score || "N/A"} | ACT: ${profile.act_score || "N/A"}
${profile.ibSubjects?.length ? `IB: ${profile.ibSubjects.map(s => `${s.subject}:${s.level},${s.grade}`).join(", ")} | Total: ${profile.ibScore || "N/A"}` : ""}
${profile.aLevelSubjects?.length ? `A-Levels: ${profile.aLevelSubjects.map(s => `${s.subject}:${s.grade}`).join(", ")}` : ""}

EXTRACURRICULARS:
${profile.extracurricularActivities?.map(a => `${a.activity} (Tier ${a.tier}): ${a.description}`).join(" | ") || "None"}

PREFERENCES:
Size: ${profile.collegeSize || "Any"} | Setting: ${profile.campusSetting || "Any"} | Cost: ${profile.budget_range || "Any"}
Location: ${profile.geographicPreference?.join(", ") || "Any"} | US States: ${profile.preferred_us_states?.join(", ") || "Any"}
Greek Life: ${profile.greekLifeImportant ? "Yes" : "No"} | Athletics: ${profile.strongAthletics ? "Yes" : "No"} | Diversity: ${profile.diverseStudentBody ? "Yes" : "No"}
Alumni Network: ${profile.strongAlumniNetwork ? "Yes" : "No"} | Research: ${profile.researchOpportunities || "Any"} | Internships: ${profile.internshipOpportunities || "Any"}
Study Abroad: ${profile.studyAbroadPrograms || (profile.studyAbroadImportant ? "Important" : "Any")}
Weather: ${profile.weatherClimatePreference?.join(", ") || "Any"} | LGBTQ+ Friendly: ${profile.lgbtqFriendlyCampus ? "Yes" : "No"}

BACKGROUND:
Income: ${profile.familyIncome || "Not specified"} | First Gen: ${profile.firstGenerationStudent ? "Yes" : "No"} | Financial Aid: ${profile.financialAidNeeded ? "Yes" : "No"}

Generate 15-20 college recommendations in JSON format. Categorize as "reach", "target", or "safety".

**GEOGRAPHIC PRIORITY**: If specific countries are listed, at least 80% of recommendations must be from those countries.

Return ONLY valid JSON array with this structure:
[
  {
    "college_name": "University Name",
    "city": "City Name", 
    "country": "Country",
    "match_score": 0.85,
    "admission_chance": 0.75,
    "fit_category": "Target",
    "justification": "Why this college matches your profile, written in second person",
    "program_type": "Public Research University",
    "estimated_cost": "$45,000/year",
    "tuition_annual": "$32,000",
    "acceptance_rate": 0.65,
    "student_count": 25000,
    "campus_setting": "Urban",
    "admission_requirements": "SAT: 1200-1400, GPA: 3.5+",
    "website_url": "https://www.university.edu",
    "match_reasons": ["Strong program in your major", "Good financial aid", "Research opportunities"]
  }
]

Requirements:
- 30% Safety (80%+ chance), 50% Target (50-79% chance), 20% Reach (20-49% chance)
- Use real universities with accurate data
- Write all text in second person ("you/your")
- Include website URLs
- Return ONLY valid JSON array`

    // Generate recommendations using Gemini with optimal configuration and retry logic
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 32000, // 4x increase to prevent truncation
      },
    })
    
    // Retry logic for service outages
    let result
    let text: string = ""
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        result = await model.generateContent({
          contents: [{ 
            role: "user",
            parts: [{ text: prompt }] 
          }],
        })
        
        const response = await result.response
        text = response.text()
        break // Success, exit retry loop
      } catch (error: any) {
        retryCount++
        console.log(`Gemini API attempt ${retryCount} failed:`, error.message)
        
        if (retryCount >= maxRetries) {
          throw error // Re-throw the error after all retries failed
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000 // 2s, 4s, 8s
        console.log(`Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    // Check if we got a valid response
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from AI service")
    }
    
    // Check if response appears to be truncated
    const isTruncated = !text.trim().endsWith(']') || text.includes('...') || text.match(/["\w]$/)
    if (isTruncated) {
      console.warn("AI response appears to be truncated:", text.substring(text.length - 200))
    }
    

    // Log the Gemini interaction
    await supabase.from("gemini_logs").insert({
      student_id: user.id,
      prompt_text: prompt,
      response_text: text,
      tokens_used: text.length, // Approximate
    })

    // Parse the JSON response with improved error handling
    let recommendations: any[]
    try {
      // Clean the response text
      let cleanedText = text.trim()
      
      // Remove common markdown code block markers if present
      cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '')
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '')
      
      // Extract JSON from the response (find the first [ to last ])
      const startIndex = cleanedText.indexOf('[')
      const lastIndex = cleanedText.lastIndexOf(']')
      
      if (startIndex === -1 || lastIndex === -1 || startIndex >= lastIndex) {
        throw new Error("No valid JSON array found in response")
      }
      
      let jsonString = cleanedText.substring(startIndex, lastIndex + 1)
      
      // Only remove trailing commas - that's it!
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')
      

      
      try {
        recommendations = JSON.parse(jsonString)
      } catch (primaryParseError) {
       
        
        // Try to find the last complete object in the array
        const objects = []
        let currentObject = ''
        let braceCount = 0
        let inString = false
        let escapeNext = false
        
        for (let i = 1; i < jsonString.length - 1; i++) { // Skip opening and closing brackets
          const char = jsonString[i]
          
          if (escapeNext) {
            currentObject += char
            escapeNext = false
            continue
          }
          
          if (char === '\\') {
            escapeNext = true
            currentObject += char
            continue
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString
          }
          
          if (!inString) {
            if (char === '{') {
              if (braceCount === 0) {
                currentObject = '{'
              } else {
                currentObject += char
              }
              braceCount++
            } else if (char === '}') {
              currentObject += char
              braceCount--
              
              if (braceCount === 0) {
                try {
                  const obj = JSON.parse(currentObject)
                  objects.push(obj)
                  currentObject = ''
                } catch (objParseError) {
                  console.warn("Failed to parse object:", currentObject.substring(0, 100) + "...")
                  currentObject = ''
                }
              }
            } else {
              currentObject += char
            }
          } else {
            currentObject += char
          }
        }
        
        if (objects.length === 0) {
          throw primaryParseError
        }
        
        
        recommendations = objects
      }
      
      // Verify it's an array
      if (!Array.isArray(recommendations)) {
        throw new Error("Response is not an array")
      }
      
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError)
      console.error("Raw response (first 1000 chars):", text.substring(0, 1000))
      console.error("Parse error details:", parseError instanceof Error ? parseError.message : parseError)
      
      // Log more details about where the error occurred
      if (parseError instanceof SyntaxError && parseError.message.includes('position')) {
        const positionMatch = parseError.message.match(/position (\d+)/)
        if (positionMatch) {
          const position = parseInt(positionMatch[1])
          const context = text.substring(Math.max(0, position - 100), position + 100)
          console.error("Error context:", context)
        }
      }
      
      return {
        success: false,
        error: "Failed to parse AI recommendations. The AI response was not in the expected format. Please try again.",
      }
    }


    // Validate and clean the recommendations
    const validRecommendations = recommendations
      .filter((rec) => {
        // Check required fields
        if (!rec.college_name || !rec.fit_category) {
          console.warn("Skipping recommendation missing required fields:", rec)
          return false
        }
        
        // Check valid fit_category
        if (!["Safety", "Target", "Reach"].includes(rec.fit_category)) {
          console.warn("Skipping recommendation with invalid fit_category:", rec.fit_category)
          return false
        }
        
        return true
      })
      .map((rec) => {
        // Add student_id to each recommendation
        return {
          ...rec,
          student_id: user.id,
          is_dream_college: false
        }
      })
    
    if (validRecommendations.length === 0) {
      return {
        success: false,
        error: "No valid recommendations generated. Please try again.",
      }
    }

    // Insert the valid recommendations into the database
    if (validRecommendations.length > 0) {
      const { error: insertError } = await serviceSupabase
        .from("college_matches")
        .insert(validRecommendations)
      
      if (insertError) {
        console.error("Error inserting recommendations:", insertError)
        return {
          success: false,
          error: "Failed to save recommendations to database.",
        }
      }
    }

    // Fetch all matches (dream colleges + AI recommendations) to return
    const { data: allMatches, error: fetchError } = await serviceSupabase
      .from("college_matches")
      .select("*")
      .eq("student_id", user.id)
    
    if (fetchError) {
      console.error("Error fetching final matches:", fetchError)
    }
    
    const dreamCollegeCount = allMatches?.filter((match: any) => match.is_dream_college)?.length || 0
    const aiRecommendationCount = allMatches?.filter((match: any) => !match.is_dream_college)?.length || 0
    
    return {
      success: true,
      recommendations: validRecommendations,
      matches: allMatches || [],
      message: `Successfully generated ${aiRecommendationCount} recommendations and synced ${dreamCollegeCount} dream colleges.`,
    }
  } catch (error: any) {
    console.error("College matching error:", error)
    
    // Check if it's a service unavailable error
    if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
      return {
        success: false,
        error: "The AI service is currently experiencing high demand and is temporarily unavailable. Please try again in a few minutes. We apologize for the inconvenience.",
      }
    }
    
    return {
      success: false,
      error: error.message || "An unexpected error occurred while generating recommendations. Please try again later.",
    }
  }
}

export async function fetchDreamCollegeDetails(collegeName: string, profile: StudentProfile): Promise<Partial<CollegeMatch>> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      console.error("Google Generative AI API key is not configured")
      throw new Error("AI service is not configured")
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `You are a college admissions consultant. Analyze ${collegeName} specifically for this student profile and provide a detailed match assessment.

DETAILED STUDENT PROFILE:

📋 Section 1: Personal Information
Current Grade Level: ${profile.gradeLevel || "Not specified"}
Country of Residence: ${profile.countryOfResidence || "Not specified"}
State (if USA): ${profile.stateProvince || "Not specified"}

📚 Section 2: Academic Profile
Primary Grading System: ${profile.gradingSystem || "Not specified"}

${profile.gradingSystem === "US GPA" ? `
GPA: ${profile.gpa || "Not specified"}
Class Rank: ${profile.classRank || "Not specified"}
` : ""}

SAT Score: ${profile.sat_score || "Not specified"}
ACT Score: ${profile.act_score || "Not specified"}

${profile.gradingSystem === "International Baccalaureate (IB)" ? `
Total Predicted/Final Score: ${profile.ibScore || "Not specified"}
IB Subjects: ${profile.ibSubjects?.map(s => `${s.subject}: ${s.level}, ${s.grade}`).join("\n") || "Not specified"}
` : ""}

${profile.gradingSystem === "A-Levels" ? `
A-Level Subjects: ${profile.aLevelSubjects?.map(s => `${s.subject}: ${s.grade}`).join("\n") || "Not specified"}
` : ""}

🎯 Section 3: Extracurricular Activities
${profile.extracurricularActivities?.map((activity, index) => 
  `${activity.activity}: Tier ${activity.tier}, ${activity.description}`
).join("\n") || "None specified"}

🎓 Section 4: College Preferences
Intended Majors: ${Array.isArray(profile.intended_majors) ? profile.intended_majors.join(", ") : profile.intended_majors || "Not specified"}
Preferred College Size: ${profile.collegeSize || "Not specified"}
Campus Setting: ${profile.campusSetting || "Not specified"}
Preferred Countries: ${profile.preferred_countries?.join(", ") || "Not specified"}
Cost Importance: ${profile.budget_range || "Not specified"}

TASK: Calculate personalized match_score (0.0-1.0) and admission_chance (0.0-1.0) for THIS specific student applying to ${collegeName}. Use the detailed profile above to provide accurate assessment.

Return ONLY this JSON format:
{
  "college_name": "${collegeName}",
  "city": "City name",
  "country": "Country name",
    "program_type": "Public Research University/Private Liberal Arts College/Technical Institute",
  "estimated_cost": "$45,000/year",
  "acceptance_rate": 0.5,
  "admission_chance": 0.7,
  "match_score": 0.8,
  "student_count": 10000,
  "campus_setting": "Urban",
  "tuition_annual": "$32,000",
 "admission_requirements": "SAT: 1200-1400, GPA: 3.5+, Strong essays required",
  "website_url": "https://example.edu",
  "match_reasons": ["Strong program in your intended major", "Good financial aid opportunities for your needs", "Research opportunities that align with your interests", "Campus culture that fits your preferences"],
  "justification": "Detailed explanation of why this college matches this student's profile, written in second person (you/your)"
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations.

IMPORTANT: For admission_requirements, provide specific numeric ranges and clear requirements format like:
- "SAT: 1300-1550, ACT: 29-35, GPA: 3.7+, Strong essays required"
- "A-Levels: AAA, IB: 38+, IELTS: 7.0+, Personal statement required"  
- "GPA: 3.5+, SAT: 1200-1400, Letters of recommendation, Portfolio required"

Be specific with test score ranges, GPA requirements, and key application components.`

    // Retry logic for service outages
    let result
    let text: string = ""
    let retryCount = 0
    const maxRetries = 2
    
    while (retryCount < maxRetries) {
      try {
        result = await model.generateContent(prompt)
        const response = await result.response
        text = response.text()
        break // Success, exit retry loop
      } catch (error: any) {
        retryCount++
        console.log(`Dream college details API attempt ${retryCount} failed:`, error.message)
        
        if (retryCount >= maxRetries) {
          throw error // Re-throw the error after all retries failed
        }
        
        // Wait before retrying
        const waitTime = 2000 * retryCount // 2s, 4s
        console.log(`Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    // Check if we got a valid response
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from AI service")
    }
    
    // If response is too long, it's likely malformed
    if (text.length > 5000) {
      throw new Error("AI response too long, likely malformed")
    }
    
    // Try to parse the JSON response
    try {
      // Clean the response text to remove markdown code blocks
      let cleanedText = text.trim()
      
      // More aggressive cleaning - find the JSON content between { and }
      const startIndex = cleanedText.indexOf('{')
      const lastIndex = cleanedText.lastIndexOf('}')
      
      if (startIndex !== -1 && lastIndex !== -1 && startIndex < lastIndex) {
        cleanedText = cleanedText.substring(startIndex, lastIndex + 1)
      }
      
      const collegeData = JSON.parse(cleanedText)
      return collegeData
    } catch (parseError) {
      console.error(`Failed to parse AI response for ${collegeName}:`, parseError)
      
      // Return fallback data if parsing fails
      return {
        college_name: collegeName,
        city: "Information not available",
        country: "Information not available", 
        program_type: "University",
        estimated_cost: "Please check university website",
        acceptance_rate: 0.5,
        student_count: undefined,
        campus_setting: "Information not available",
        tuition_annual: "Please check university website",
        admission_requirements: "Please check the university website for detailed admission requirements.",
        website_url: undefined,
        match_reasons: [
          "Selected as one of your dream colleges",
          "Represents a college you're passionate about attending"
        ]
      }
    }
  } catch (error) {
    console.error(`Error fetching details for ${collegeName}:`, error)
    
    // Return fallback data if AI call fails
    return {
      college_name: collegeName,
      city: "Information not available",
      country: "Information not available",
      program_type: "University", 
      estimated_cost: "Please check university website",
      acceptance_rate: 0.5,
      student_count: undefined,
      campus_setting: "Information not available",
      tuition_annual: "Please check university website",
      admission_requirements: "Please check the university website for detailed admission requirements.",
      website_url: undefined,
      match_reasons: [
        "Selected as one of your dream colleges",
        "Represents a college you're passionate about attending"
      ]
    }
  }
}

export async function updateDreamCollegeDetails(studentId: string, collegeName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check for required environment variables
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set")
      return { 
        success: false, 
        error: "Google AI API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables." 
      }
    }

    const supabase = await createClient()
    
    // Fetch the complete student profile for better personalization
    const studentProfile = await getStudentProfile(studentId)
    
    // Use the detailed profile if available, otherwise fall back to basic profile
    const profileToUse = studentProfile || { 
      gradeLevel: "Not specified", 
      countryOfResidence: "Not specified" 
    } as StudentProfile
    
    
    
    const dreamCollegeDetails = await fetchDreamCollegeDetails(collegeName, profileToUse)
    
    // Update the existing dream college record with the fetched details
    const { error } = await supabase
      .from("college_matches")
      .update({
        country: dreamCollegeDetails.country,
        city: dreamCollegeDetails.city,
        program_type: dreamCollegeDetails.program_type,
        estimated_cost: dreamCollegeDetails.estimated_cost,
        admission_requirements: dreamCollegeDetails.admission_requirements,
        acceptance_rate: dreamCollegeDetails.acceptance_rate,
        student_count: dreamCollegeDetails.student_count,
        campus_setting: dreamCollegeDetails.campus_setting,
        tuition_annual: dreamCollegeDetails.tuition_annual,
        website_url: dreamCollegeDetails.website_url,
        match_reasons: dreamCollegeDetails.match_reasons || [
          "Selected as one of your dream colleges",
          "Represents a college you're passionate about attending"
        ],
        // Update personalized fields based on profile
        match_score: dreamCollegeDetails.match_score || 0.9,
        admission_chance: dreamCollegeDetails.admission_chance || 0.5,
        justification: dreamCollegeDetails.justification || `This is one of your dream colleges that you specifically selected. It represents a college that you're passionate about attending.`
      })
      .eq("student_id", studentId)
      .eq("college_name", collegeName)
      .eq("is_dream_college", true)
    
    if (error) {
      console.error("Error updating dream college details:", error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error updating dream college details:", error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getCollegeMatches() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "User not authenticated", matches: [] }
    }

    const supabase = await createClient()

    const { data: matches, error } = await supabase
      .from("college_matches")
      .select("*")
      .eq("student_id", user.id)
      .order("match_score", { ascending: false })

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

export async function getStudentCollegeMatches(): Promise<{
  success: boolean
  error?: string
  matches?: CollegeMatch[]
}> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("college_matches")
    .select("*")
    .eq("student_id", user.id)
    .order("match_score", { ascending: false })

  if (error) {
    console.error("Get matches error:", error)
    return { success: false, error: "Failed to fetch matches" }
  }

  return { success: true, matches: data || [] }
}

export async function deleteCollegeMatches(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("college_matches").delete().eq("student_id", user.id)

  if (error) {
    console.error("Delete matches error:", error)
    return { success: false, error: "Failed to delete matches" }
  }

  return { success: true }
}

export async function syncDreamColleges(studentId: string, dreamColleges: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    
    const supabase = await createClient()
    
    // Get existing dream colleges from database
    const { data: existingDreamColleges, error: fetchError } = await supabase
      .from("college_matches")
      .select("college_name")
      .eq("student_id", studentId)
      .eq("is_dream_college", true)
    
    if (fetchError) {
      console.error("Error fetching existing dream colleges:", fetchError)
      return { success: false, error: fetchError.message }
    }
    
    const existingNames = existingDreamColleges?.map((college: any) => college.college_name) || []
    
    // Find dream colleges to remove (exist in DB but not in current profile)
    const collegesToRemove = existingNames.filter((name: string) => !dreamColleges.includes(name))
    
    // Remove outdated dream colleges from database
    if (collegesToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("college_matches")
        .delete()
        .eq("student_id", studentId)
        .eq("is_dream_college", true)
        .in("college_name", collegesToRemove)
      
      if (deleteError) {
        console.error("Error removing outdated dream colleges:", deleteError)
        return { success: false, error: deleteError.message }
      }
    }
    
    // Find dream colleges to add (exist in profile but not in DB)
    const collegesToAdd = dreamColleges.filter((name: string) => !existingNames.includes(name))
    
    // Process new dream colleges with detailed profile
    if (collegesToAdd.length > 0) {
      
      // Fetch the complete student profile for better personalization
      const studentProfile = await getStudentProfile(studentId)
      
      // Use the detailed profile if available, otherwise fall back to basic profile
      const profileToUse = studentProfile || { 
        gradeLevel: "Not specified", 
        countryOfResidence: "Not specified" 
      } as StudentProfile
      
      
      
      const dreamCollegeMatches = []
      for (const dreamCollegeName of collegesToAdd) {
        // Fetch detailed information for dream college from Gemini with complete profile
        const dreamCollegeDetails = await fetchDreamCollegeDetails(dreamCollegeName, profileToUse)
        
        // Create dream college entry with fetched details
        const dreamCollegeMatch = {
          student_id: studentId,
          college_name: dreamCollegeName,
          match_score: dreamCollegeDetails.match_score || 0.9,
          admission_chance: dreamCollegeDetails.admission_chance || 0.5,
          justification: dreamCollegeDetails.justification || `This is one of your dream colleges that you specifically selected. It represents a college that you're passionate about attending.`,
          fit_category: "Target" as const, // Default to Target category
          is_dream_college: true,
          country: dreamCollegeDetails.country,
          city: dreamCollegeDetails.city,
          program_type: dreamCollegeDetails.program_type,
          estimated_cost: dreamCollegeDetails.estimated_cost,
          admission_requirements: dreamCollegeDetails.admission_requirements,
          acceptance_rate: dreamCollegeDetails.acceptance_rate,
          student_count: dreamCollegeDetails.student_count,
          campus_setting: dreamCollegeDetails.campus_setting,
          tuition_annual: dreamCollegeDetails.tuition_annual,
          match_reasons: dreamCollegeDetails.match_reasons || [
            "Selected as one of your dream colleges",
            "Represents a college you're passionate about attending"
          ],
          website_url: dreamCollegeDetails.website_url,
          source_links: null
        }
        
        dreamCollegeMatches.push(dreamCollegeMatch)
      }
      
      // Insert new dream college matches
      if (dreamCollegeMatches.length > 0) {
        const { error: dreamInsertError } = await supabase
          .from("college_matches")
          .insert(dreamCollegeMatches)
        
        if (dreamInsertError) {
          console.error("Error inserting new dream colleges:", dreamInsertError)
          return { success: false, error: dreamInsertError.message }
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error synchronizing dream colleges:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during synchronization' 
    }
  }
}
