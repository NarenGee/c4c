"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { GEMINI_MODEL_NAME } from "@/lib/ai-model"
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

// Helper function to clean JSON strings and remove problematic characters
function cleanJsonString(jsonString: string): string {
  return jsonString
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n') // Normalize line endings
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .trim()
}

// Simple in-memory cache for AI responses (in production, use Redis or similar)
const aiResponseCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

function getCacheKey(profile: StudentProfile): string {
  // Create a hash of key profile attributes for caching
  const keyData = {
    gradeLevel: profile.gradeLevel,
    gpa: profile.gpa,
    sat_score: profile.sat_score,
    act_score: profile.act_score,
    intended_majors: profile.intended_majors,
    preferred_countries: profile.preferred_countries,
    collegeSize: profile.collegeSize,
    campusSetting: profile.campusSetting,
    budget_range: profile.budget_range,
    firstGenerationStudent: profile.firstGenerationStudent,
    financialAidNeeded: profile.financialAidNeeded
  }
  return JSON.stringify(keyData)
}

function getCachedResponse(cacheKey: string): any | null {
  const cached = aiResponseCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log("📦 Using cached AI response")
    return cached.data
  }
  return null
}

function setCachedResponse(cacheKey: string, data: any): void {
  aiResponseCache.set(cacheKey, { data, timestamp: Date.now() })
  console.log("💾 Cached AI response")
}

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
    const startTime = Date.now()
    console.log("🚀 Starting college recommendations generation...")
    
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

    // PARALLEL EXECUTION: Start both dream colleges and AI recommendations simultaneously
    const currentDreamColleges = profile.dreamColleges || []
    console.log("🔄 Starting parallel processing of dream colleges and AI recommendations...")
    
    // Start both processes in parallel
    const dreamCollegesPromise = processDreamColleges(currentDreamColleges, user, profile, supabase, serviceSupabase)
    const aiRecommendationsPromise = generateAIRecommendations(profile, user, serviceSupabase, supabase)
    
    // Wait for both to complete in parallel
    const [dreamCollegesResult, aiRecommendationsResult] = await Promise.allSettled([
      dreamCollegesPromise,
      aiRecommendationsPromise
    ])
    
    const endTime = Date.now()
    console.log(`🎉 Total generation time: ${endTime - startTime}ms (parallel)`)
    
    // Handle results from both processes
    let errors: string[] = []
    let successCount = 0
    
    if (dreamCollegesResult.status === 'fulfilled') {
      console.log("✅ Dream colleges processing completed successfully")
      successCount++
    } else {
      console.error("Dream colleges processing failed:", dreamCollegesResult.reason)
      errors.push(`Dream colleges: ${dreamCollegesResult.reason}`)
    }
    
    if (aiRecommendationsResult.status === 'fulfilled') {
      console.log("✅ AI recommendations generation completed successfully")
      successCount++
    } else {
      console.error("AI recommendations generation failed:", aiRecommendationsResult.reason)
      errors.push(`AI recommendations: ${aiRecommendationsResult.reason}`)
    }
    
    // Fetch all matches from database to return complete results (optimized with single query)
    const { data: allMatches, error: fetchError } = await serviceSupabase
      .from("college_matches")
      .select("*")
      .eq("student_id", user.id)
      .order("match_score", { ascending: false }) // Add ordering to avoid client-side sorting
    
    if (fetchError) {
      console.error("Error fetching final matches:", fetchError)
    }
    
    // Debug logging to help identify issues
    const dreamCollegeCount = allMatches?.filter((match: any) => match.is_dream_college)?.length || 0
    const aiRecommendationCount = allMatches?.filter((match: any) => !match.is_dream_college)?.length || 0
    console.log(`📊 Final results: ${dreamCollegeCount} dream colleges, ${aiRecommendationCount} AI recommendations`)
    
    // Return success if at least one process succeeded
    if (successCount > 0) {
      return {
        success: true,
        matches: allMatches || [],
        message: `Generated ${aiRecommendationCount} AI recommendations and synced ${dreamCollegeCount} dream colleges${errors.length > 0 ? ` (with ${errors.length} partial errors)` : ''}`
      }
    } else {
      return {
        success: false,
        error: `Both processes failed: ${errors.join('; ')}`
      }
    }
  } catch (error) {
    console.error("❌ Error in generateCollegeRecommendations:", error)
    return {
      success: false,
      error: `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function processDreamColleges(currentDreamColleges: string[], user: any, profile: StudentProfile, supabase: any, serviceSupabase: any): Promise<any[]> {
  const dreamStartTime = Date.now()
  console.log(`🔄 Processing ${currentDreamColleges.length} dream colleges in parallel...`)
  
  try {
    // console.log(`📚 Processing ${currentDreamColleges.length} dream colleges...`)
    
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
        
        // Remove outdated dream colleges from database (batch operation)
        if (collegesToRemove.length > 0) {
          console.log(`🗑️ Removing ${collegesToRemove.length} outdated dream colleges...`)
          const { error: deleteError } = await serviceSupabase
            .from("college_matches")
            .delete()
            .eq("student_id", user.id)
            .eq("is_dream_college", true)
            .in("college_name", collegesToRemove)
          
          if (deleteError) {
            console.error("Error removing outdated dream colleges:", deleteError)
          } else {
            console.log("✅ Outdated dream colleges removed successfully")
          }
        }
        
        // Find dream colleges to add (exist in profile but not in DB)
        const collegesToAdd = currentDreamColleges.filter((name: string) => !existingNames.includes(name))
        
        // OPTIMIZATION: Skip AI calls if no new dream colleges to add
        if (collegesToAdd.length === 0) {
          console.log("✅ No new dream colleges to process - skipping AI calls")
        } else {
          console.log(`🔄 Processing ${collegesToAdd.length} new dream colleges in parallel...`)
          const dreamCollegeStartTime = Date.now()
          
          // OPTIMIZATION: Process dream colleges in parallel instead of sequentially
          const dreamCollegePromises = collegesToAdd.map(async (dreamCollegeName) => {
            try {
              // console.log(`🤖 Fetching details for: ${dreamCollegeName}`)
              const dreamCollegeDetails = await fetchDreamCollegeDetails(dreamCollegeName, profile)
              
              // Create dream college entry with fetched details and validate numeric fields
              return {
                student_id: user.id,
                college_name: dreamCollegeName,
                match_score: Math.min(Math.max(dreamCollegeDetails.match_score || 0.9, 0), 0.99), // Ensure 0-0.99 for decimal(3,2)
                admission_chance: Math.min(Math.max(dreamCollegeDetails.admission_chance || 0.5, 0), 0.999), // Ensure 0-0.999 for decimal(4,3)
                justification: dreamCollegeDetails.justification || `This is one of your dream colleges that you specifically selected. It represents a college that you're passionate about attending.`,
                fit_category: "Target" as const, // Default to Target category
                is_dream_college: true,
                country: dreamCollegeDetails.country,
                city: dreamCollegeDetails.city,
                program_type: dreamCollegeDetails.program_type,
                estimated_cost: dreamCollegeDetails.estimated_cost,
                admission_requirements: dreamCollegeDetails.admission_requirements,
                acceptance_rate: dreamCollegeDetails.acceptance_rate ? Math.min(Math.max(dreamCollegeDetails.acceptance_rate, 0), 0.999) : null,
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
            } catch (error) {
              console.error(`❌ Failed to fetch details for ${dreamCollegeName}:`, error)
              // Return fallback data for failed colleges
              return {
                student_id: user.id,
                college_name: dreamCollegeName,
                match_score: 0.9,
                admission_chance: 0.5,
                justification: `This is one of your dream colleges that you specifically selected. It represents a college that you're passionate about attending.`,
                fit_category: "Target" as const,
                is_dream_college: true,
                country: "Information not available",
                city: "Information not available",
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
                ],
                source_links: null
              }
            }
          })
          
          // Wait for all dream college details to be fetched in parallel
          const dreamCollegeMatches = await Promise.all(dreamCollegePromises)
          const dreamCollegeEndTime = Date.now()
          console.log(`⚡ Dream colleges processed in ${dreamCollegeEndTime - dreamCollegeStartTime}ms (parallel)`)
          
          // Insert new dream college matches
          if (dreamCollegeMatches.length > 0) {
            // console.log(`💾 Inserting ${dreamCollegeMatches.length} dream college matches...`)
            const { error: dreamInsertError } = await serviceSupabase
              .from("college_matches")
              .insert(dreamCollegeMatches)
            
            if (dreamInsertError) {
              console.error("Error inserting new dream colleges:", dreamInsertError)
            } else {
              // console.log("✅ Dream colleges inserted successfully")
            }
          }
        }
      }
    } catch (dreamError) {
      console.error("Error synchronizing dream colleges:", dreamError)
      throw dreamError
    }
    
    const dreamEndTime = Date.now()
    console.log(`⚡ Dream colleges processed in ${dreamEndTime - dreamStartTime}ms`)
    
    // Return the processed dream colleges for the main function to handle
    return []
  } catch (error) {
    console.error("Error in processDreamColleges:", error)
    throw error
  }
}

async function generateAIRecommendations(profile: StudentProfile, user: any, serviceSupabase: any, supabase?: any): Promise<any[]> {
  try {
    const aiStartTime = Date.now()
    console.log("🎯 Starting AI recommendation generation...")
    
    // Check cache first
    const cacheKey = getCacheKey(profile)
    const cachedResponse = getCachedResponse(cacheKey)
    if (cachedResponse) {
      console.log("⚡ Using cached recommendations, inserting to database...")
      
      // Insert cached recommendations with current user ID
      const recommendationsWithUserId = cachedResponse.map((rec: any) => ({
        ...rec,
        student_id: user.id,
        is_dream_college: false,
      }))
      
      // Only clear and insert if we have valid cached recommendations
      if (recommendationsWithUserId.length > 0) {
        // Clear existing non-dream college recommendations before inserting cached ones
        const { error: deleteError } = await serviceSupabase
          .from("college_matches")
          .delete()
          .eq("student_id", user.id)
          .eq("is_dream_college", false)
        
        if (deleteError) {
          console.error("Error clearing existing recommendations:", deleteError)
          // Don't throw error here, continue with insert
        }
        
        const { error: insertError } = await serviceSupabase
          .from("college_matches")
          .insert(recommendationsWithUserId)
        
        if (insertError) {
          console.error("Error inserting cached recommendations:", insertError)
        }
      }
      
      const aiEndTime = Date.now()
      console.log(`⚡ AI recommendations generated from cache in ${aiEndTime - aiStartTime}ms`)
      return recommendationsWithUserId
    }
    
    // Don't clear existing recommendations yet - wait until we have new ones ready

    // Create an optimized, concise prompt for faster AI responses
    const prompt = `Generate college recommendations for this student:

PROFILE: Grade ${profile.gradeLevel || "N/A"} | ${profile.countryOfResidence || "N/A"} | Major: ${Array.isArray(profile.intended_majors) ? profile.intended_majors.join(", ") : profile.intended_majors || "N/A"}
ACADEMICS: GPA ${profile.gpa || "N/A"} | SAT ${profile.sat_score || "N/A"} | ACT ${profile.act_score || "N/A"}${profile.ibScore ? ` | IB ${profile.ibScore}` : ""}
PREFERENCES: ${profile.collegeSize || "Any"} size | ${profile.campusSetting || "Any"} setting | ${profile.budget_range || "Any"} cost
LOCATION: ${profile.preferred_countries?.join(", ") || "Any country"} | ${profile.preferred_us_states?.join(", ") || "Any state"}
BACKGROUND: First-gen ${profile.firstGenerationStudent ? "Yes" : "No"} | Financial aid ${profile.financialAidNeeded ? "Yes" : "No"}

Generate 12-15 college recommendations in JSON format. Categorize as "reach", "target", or "safety".

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
    
    // Optimized model configuration for faster responses
    let maxTokens = 16000 // Reduced from 32000 for faster processing
    let model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL_NAME,
      generationConfig: {
        temperature: 0.3, // Increased for more consistent, faster responses
        topP: 0.8, // Reduced for faster processing
        topK: 20, // Reduced for faster processing
        maxOutputTokens: maxTokens,
      },
    })
    
    // Optimized retry logic for faster failure handling
    let result
    let text: string = ""
    let retryCount = 0
    const maxRetries = 3 // Reduced retries for faster failure handling
    
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
        
        // Check if response is complete (not truncated)
        if (text && text.trim().endsWith(']') && !text.includes('...')) {
          break // Success with complete response, exit retry loop
        } else if (text && text.length > 1000) {
          // If we have a substantial response but it might be truncated, try to parse it
          console.log(`Response might be truncated (${text.length} chars), attempting to parse...`)
          break
        } else if (text && text.length < 1000 && maxTokens > 16000) {
          // If response is too short and we haven't reduced tokens yet, try with fewer tokens
          console.log(`Response too short (${text.length} chars), reducing max tokens from ${maxTokens} to ${maxTokens / 2}`)
          maxTokens = maxTokens / 2
          model = genAI.getGenerativeModel({ 
            model: GEMINI_MODEL_NAME,
            generationConfig: {
              temperature: 0.1,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: maxTokens,
            },
          })
          throw new Error("Response too short, retrying with reduced token limit")
        } else {
          throw new Error("Response too short or incomplete")
        }
      } catch (error: any) {
        retryCount++
        console.log(`Gemini API attempt ${retryCount} failed:`, error.message)
        
        if (retryCount >= maxRetries) {
          // If all retries failed, provide a helpful error message
          if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
            throw new Error("The AI service is currently experiencing high demand and is temporarily unavailable. Please try again in a few minutes.")
          }
          throw error // Re-throw the error after all retries failed
        }
        
        // Wait before retrying (optimized backoff for faster recovery)
        const baseWaitTime = Math.pow(1.5, retryCount) * 1000 // 1.5s, 2.25s, 3.375s
        const jitter = Math.random() * 500 // Add up to 0.5s of random delay
        const waitTime = baseWaitTime + jitter
        console.log(`Waiting ${Math.round(waitTime)}ms before retry...`)
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
      console.log(`Full response length: ${text.length} characters`)
      
      // Try to fix common truncation issues
      if (!text.trim().endsWith(']')) {
        // Find the last complete object and close the array
        const lastCompleteObject = text.lastIndexOf('}')
        if (lastCompleteObject > 0) {
          text = text.substring(0, lastCompleteObject + 1) + ']'
          console.log("Attempted to fix truncated response by closing the array")
        }
      }
    }
    

    // Log the Gemini interaction (if supabase is available)
    if (supabase) {
      try {
        await supabase.from("gemini_logs").insert({
          student_id: user.id,
          prompt_text: prompt,
          response_text: text,
          tokens_used: text.length, // Approximate
        })
      } catch (logError) {
        console.warn("Failed to log Gemini interaction:", logError)
      }
    }

    // Parse the JSON response with improved error handling
    let recommendations: any[]
    let jsonString = ''
    
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
      
      jsonString = cleanedText.substring(startIndex, lastIndex + 1)
      
      // Clean the JSON string using the helper function
      jsonString = cleanJsonString(jsonString)
      

      
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
      console.error("Cleaned JSON string (first 1000 chars):", jsonString ? jsonString.substring(0, 1000) : 'N/A')
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
      
      throw new Error("Failed to parse AI recommendations. The AI response was not in the expected format. Please try again.")
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
        // Add student_id to each recommendation and validate numeric fields
        return {
          ...rec,
          student_id: user.id,
          is_dream_college: false,
          // Ensure numeric fields are within database constraints
          match_score: Math.min(Math.max(rec.match_score || 0.5, 0), 0.99), // decimal(3,2)
          admission_chance: Math.min(Math.max(rec.admission_chance || 0.5, 0), 0.999), // decimal(4,3)
          acceptance_rate: rec.acceptance_rate ? Math.min(Math.max(rec.acceptance_rate, 0), 0.999) : null // decimal(4,3)
        }
      })
    
    if (validRecommendations.length === 0) {
      throw new Error("No valid recommendations generated. Please try again.")
    }

    // Insert the valid recommendations into the database
    if (validRecommendations.length > 0) {
      // Clear existing non-dream college recommendations before inserting new ones
      const { error: deleteError } = await serviceSupabase
        .from("college_matches")
        .delete()
        .eq("student_id", user.id)
        .eq("is_dream_college", false)
      
      if (deleteError) {
        console.error("Error clearing existing recommendations:", deleteError)
        // Don't throw error here, continue with insert
      }
      
      const { error: insertError } = await serviceSupabase
        .from("college_matches")
        .insert(validRecommendations)
      
      if (insertError) {
        console.error("Error inserting recommendations:", insertError)
        throw new Error("Failed to save recommendations to database.")
      }
    }

    // Cache the successful response
    setCachedResponse(cacheKey, validRecommendations)
    
    const aiEndTime = Date.now()
    console.log(`⚡ AI recommendations generated in ${aiEndTime - aiStartTime}ms`)
    
    return validRecommendations
  } catch (error: any) {
    console.error("AI recommendations generation error:", error)
    throw error
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
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME })

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
    let cleanedText = ''
    
    try {
      // Clean the response text to remove markdown code blocks
      cleanedText = text.trim()
      
      // More aggressive cleaning - find the JSON content between { and }
      const startIndex = cleanedText.indexOf('{')
      const lastIndex = cleanedText.lastIndexOf('}')
      
      if (startIndex !== -1 && lastIndex !== -1 && startIndex < lastIndex) {
        cleanedText = cleanedText.substring(startIndex, lastIndex + 1)
      }
      
      // Clean the JSON string using the helper function
      cleanedText = cleanJsonString(cleanedText)
      
      const collegeData = JSON.parse(cleanedText)
      return collegeData
    } catch (parseError) {
      console.error(`Failed to parse AI response for ${collegeName}:`, parseError)
      console.error(`Raw response (first 500 chars):`, text.substring(0, 500))
      console.error(`Cleaned text (first 500 chars):`, cleanedText ? cleanedText.substring(0, 500) : 'N/A')
      
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
