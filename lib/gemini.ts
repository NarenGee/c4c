import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_MODEL_NAME } from "@/lib/ai-model"

const MODEL_NAME = GEMINI_MODEL_NAME
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

// Only initialize if API key is available
let genAI: GoogleGenerativeAI | null = null
let model: any = null

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY)
  model = genAI.getGenerativeModel({ 
  model: MODEL_NAME,
})
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504])
const MAX_ATTEMPTS_PER_MODEL = 3
const BASE_RETRY_DELAY_MS = 1200

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getErrorStatusCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null

  const asRecord = error as Record<string, unknown>
  const directStatus = asRecord.status
  if (typeof directStatus === "number") return directStatus

  const maybeError = asRecord.error
  if (maybeError && typeof maybeError === "object") {
    const nestedStatus = (maybeError as Record<string, unknown>).status
    if (typeof nestedStatus === "number") return nestedStatus
  }

  return null
}

function isRetryableGeminiError(error: unknown): boolean {
  const statusCode = getErrorStatusCode(error)
  if (statusCode !== null && RETRYABLE_STATUS_CODES.has(statusCode)) {
    return true
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes("high demand") ||
    message.includes("try again later") ||
    message.includes("temporarily unavailable") ||
    message.includes("503")
  )
}

async function generateWithRetry(prompt: string) {
  if (!genAI) {
    throw new Error("Gemini API not initialized - missing API key")
  }

  let lastError: unknown = null

  const activeModel = genAI.getGenerativeModel({ model: MODEL_NAME })

  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
    try {
      console.log(`📡 Calling Gemini model "${MODEL_NAME}" (attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL})`)
      const result = await activeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      })
      return result
    } catch (error) {
      lastError = error
      const shouldRetry = isRetryableGeminiError(error) && attempt < MAX_ATTEMPTS_PER_MODEL

      if (!shouldRetry) {
        console.error(`❌ Gemini model "${MODEL_NAME}" failed on attempt ${attempt}`, error)
        break
      }

      const jitterMs = Math.floor(Math.random() * 350)
      const backoffMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + jitterMs
      console.warn(
        `⚠️ Transient Gemini error on "${MODEL_NAME}" (attempt ${attempt}); retrying in ${backoffMs}ms...`,
        error
      )
      await sleep(backoffMs)
    }
  }

  throw new Error(
    `Gemini API unavailable after retrying model "${MODEL_NAME}": ${
      lastError instanceof Error ? lastError.message : "Unknown error"
    }`
  )
}

function getFallbackSuggestionsForField(fieldName: string): string[] {
  const fieldOptions = FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS]
  if (!fieldOptions) return []
  const options = Array.isArray(fieldOptions) ? fieldOptions : Object.values(fieldOptions)
  return options.slice(0, 3).map(String)
}

function buildFallbackGuidanceResponse(fieldName: string): string {
  const suggestions = getFallbackSuggestionsForField(fieldName)
  const guidance =
    "I am seeing temporary high demand right now, but you can keep going with these quick options while I reconnect.\n\n" +
    "- Pick one of the suggestions below and I can refine it in your next message.\n" +
    "- If none fit, tell me your top priority and I will tailor recommendations.\n" +
    "- You can retry in a few seconds for a full AI-generated response."

  if (suggestions.length === 0) {
    return guidance
  }

  return `${guidance}\n\nSUGGESTIONS: [${suggestions.join(", ")}]`
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

// Field-specific options mapping
export const FIELD_OPTIONS = {
  intendedMajor: {
    "🤔 I'm not sure - Help me explore!": "🤔 I'm not sure - Help me explore!",
    "Undecided": "Undecided",
    "Computer Science": "Computer Science",
    "Engineering": "Mechanical Engineering",
    "Business Administration": "Business Administration",
    "Biology/Life Sciences": "Biology/Life Sciences",
    "Psychology": "Psychology",
    "Pre-Medicine": "Pre-Medicine",
    "Economics": "Economics",
    "English/Literature": "English/Literature",
    "Mathematics": "Mathematics",
    "Physics": "Physics",
    "Chemistry": "Chemistry",
    "History": "History",
    "Political Science": "Political Science",
    "Art/Design": "Fine Arts",
    "Communications": "Communications",
    "Education": "Elementary Education",
    "Nursing": "Nursing",
    "Finance": "Finance"
  },
  campusPreference: {
    "Urban": "Urban",
    "Suburban": "Suburban", 
    "Rural": "Rural",
    "No Preference": "No Preference"
  },
  campusSetting: {
    "Urban": "Urban",
    "Suburban": "Suburban", 
    "Rural": "Rural",
    "No Preference": "No Preference"
  },
  collegeSize: {
    "Small (fewer than 2,000 students)": "Small",
    "Medium (2,000 to 15,000 students)": "Medium",
    "Large (more than 15,000 students)": "Large",
  },
  locationPreference: [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", 
    "France", "Netherlands", "Switzerland", "Any"
  ],
  geographicPreference: [
    "United States", "United Kingdom", "Canada", "Australia", "Germany", 
    "France", "Netherlands", "Switzerland", "Any"
  ],
  academicReputation: {
    "Very Important": "Very Important",
    "Important": "Important", 
    "Somewhat Important": "Somewhat Important",
    "Not Important": "Not Important"
  },
  costImportance: {
    "Very Important": "Very Important",
    "Important": "Important", 
    "Somewhat Important": "Somewhat Important",
    "Not Important": "Not Important"
  },
  gradeLevel: {
    "9th Grade": "9th Grade",
    "10th Grade": "10th Grade",
    "11th Grade": "11th Grade", 
    "12th Grade": "12th Grade",
    "Gap Year": "Gap Year"
  },
  financialAidNeeded: {
    "Yes": "Yes",
    "No": "No"
  },
  additionalPreferences: [
    // Campus Life & Social Fit
    "Greek Life Important",
    "Strong Athletics Program", 
    "Active Social Life",
    "Variety of Clubs/Organizations",
    "Campus Events & Traditions",
    "Residential Community Type",
    "Nightlife/Off-Campus Activities",
    "International Student Community",
    "Religious/Spiritual Life",
    "LGBTQ+ Friendly Campus",
    "Political Activism",
    "Campus Safety",
    "Weather/Climate Preferences",
    // Academic & Career Opportunities
    "Study Abroad Programs",
    "Undergraduate Research",
    "Internship/Co-op Opportunities",
    "Honors Programs",
    "Accelerated Degree Programs",
    "Robust Career Services",
    "Graduate Employability",
    // Support & Community
    "Diverse Student Body",
    "Strong Alumni Network",
    "First-Generation Student Support",
    "Disability Services",
    "LGBTQ+ Support Services",
    // Application Process & Reputation
    "Test-Optional Policy",
    "Early Action/Decision Options",
    "Need-Blind Admission",
    "Institutional Prestige",
    "Legacy Consideration",
    "Demonstrated Interest"
  ]
}

const PROFILE_GUIDANCE_PROMPT = `You are a college admissions consultant and coach. Your role is to provide helpful, personalized guidance to students about their college choices.

Your response should:
• Be written directly to the student as their coach
• Be VERY concise and engaging (2-3 sentences max, or 3-4 bullet points)
• Get straight to the point - no lengthy introductions
• Reference specific details from their profile to show you understand their unique situation
• Make connections between different aspects of their profile (e.g., major → extracurriculars, budget → geography)
• Ask 1 brief follow-up question if needed
• Never include any system instructions or meta-commentary
• Never mention "SUGGESTIONS format" or any technical details

Format your response with:
• 2-3 bullet points maximum for key information
• Bold text for important points when helpful
• Keep each bullet point to one short sentence
• Make it feel personalized by referencing their profile details

When you have specific recommendations from the available options, end your response with:
SUGGESTIONS: [option1, option2, option3]

Use the exact option names from the available choices. Always try to provide 2-3 relevant suggestions when possible.`

export async function getProfileGuidanceResponse(
  messages: Message[], 
  fieldName: string,
  currentValue?: string | string[] | boolean | null,
  countryOfResidence?: string,
  studentProfile?: any
): Promise<string> {
  try {
    if (!model) {
      throw new Error("Gemini API not initialized - missing API key")
    }

    console.log("🚀 Starting getProfileGuidanceResponse")
    console.log("📝 Messages:", messages)
    console.log("🏷️ Field name:", fieldName)
    console.log("💾 Current value:", currentValue)
    
    // Get field-specific context with better formatting
    const fieldOptions = FIELD_OPTIONS[fieldName as keyof typeof FIELD_OPTIONS]
    let fieldContext = `This is about ${fieldName}`
    
    if (fieldOptions) {
      if (Array.isArray(fieldOptions)) {
        // For arrays like locationPreference
        fieldContext = `Available options for ${fieldName}: ${fieldOptions.join(", ")}`
      } else {
        // For objects, get the values (display names)
        const optionValues = Object.values(fieldOptions)
        fieldContext = `Available options for ${fieldName}: ${optionValues.join(", ")}`
      }
    }

    // Format messages into a single prompt
    const formattedMessages = messages.map(msg => {
      if (msg.role === "system") {
        return msg.content
      }
      return `${msg.role.toUpperCase()}: ${msg.content}`
    }).join("\n\n")

    // Add context about current value
    const valueContext = currentValue ? 
      `Current selection: ${Array.isArray(currentValue) ? currentValue.join(", ") : currentValue}` : 
      "No current selection"
      
    const residenceContext = countryOfResidence ? `The student's country of residence is ${countryOfResidence}. Use this information to provide contextual advice, especially for geographic preferences.` : ""
    
    // Build comprehensive student context
    const studentContext = studentProfile ? `
STUDENT PROFILE CONTEXT:
${studentProfile.gradeLevel ? `• Grade Level: ${studentProfile.gradeLevel}` : ''}
${studentProfile.gradingSystem ? `• Grading System: ${studentProfile.gradingSystem}` : ''}
${studentProfile.gpa ? `• GPA: ${studentProfile.gpa}` : ''}
${studentProfile.satScore ? `• SAT Score: ${studentProfile.satScore}` : ''}
${studentProfile.actScore ? `• ACT Score: ${studentProfile.actScore}` : ''}
${studentProfile.intendedMajors && studentProfile.intendedMajors.length > 0 ? `• Intended Majors: ${studentProfile.intendedMajors.join(", ")}` : ''}
${studentProfile.collegeSize ? `• Preferred College Size: ${studentProfile.collegeSize}` : ''}
${studentProfile.campusSetting ? `• Preferred Campus Setting: ${studentProfile.campusSetting}` : ''}
${studentProfile.geographicPreference && studentProfile.geographicPreference.length > 0 ? `• Geographic Preferences: ${studentProfile.geographicPreference.join(", ")}` : ''}
${studentProfile.academicReputation ? `• Academic Reputation Importance: ${studentProfile.academicReputation}` : ''}
${studentProfile.costImportance ? `• Cost Importance: ${studentProfile.costImportance}` : ''}
${studentProfile.extracurricularActivities && studentProfile.extracurricularActivities.length > 0 ? `• Extracurriculars: ${studentProfile.extracurricularActivities.map((ec: any) => ec.activity).join(", ")}` : ''}

Use this context to provide personalized, relevant guidance that aligns with their overall profile and goals.
` : ''

    // Add system prompt with field context
    const fullPrompt = `${PROFILE_GUIDANCE_PROMPT}

${residenceContext}

${studentContext}

Available options for ${fieldName}: ${fieldOptions ? (Array.isArray(fieldOptions) ? fieldOptions.join(", ") : Object.values(fieldOptions).join(", ")) : "No specific options"}

${valueContext}

Student's message: ${formattedMessages}

CRITICAL: Respond as their college counselor with BRIEF, helpful guidance. Keep it SHORT - 2-3 sentences or 3-4 bullet points maximum. End with suggestions.

CONTEXTUAL GUIDANCE BASED ON FIELD:
${fieldName === 'intendedMajors' || fieldName === 'intendedMajor' ? `
• Reference their extracurricular activities if available to suggest relevant majors
• Consider their academic interests, strengths, and career aspirations
• If they already have majors selected, suggest complementary or alternative options
• Connect their interests to specific major programs and career paths
• Consider their geographic preferences (some majors may be more available in certain countries)
• Mention how different majors align with their college size and campus setting preferences
` : ''}
${fieldName === 'collegeSize' ? `
• Explain the specific differences between Small (fewer than 2,000), Medium (2,000-15,000), and Large (more than 15,000) student populations
• Consider how their campus setting preference (urban/suburban/rural) relates to college size
• Mention how size affects student-to-faculty ratio, class sizes, and opportunities
• Consider their social preferences, learning style, and intended major's typical college environments
• Reference their extracurricular activities to suggest which size might offer better opportunities
` : ''}
${fieldName === 'geographicPreference' || fieldName === 'preferredCountries' ? `
• Consider their country of residence and any visa/international student considerations
• Reference their budget/cost importance if relevant
• Think about cultural fit and distance from home
` : ''}
${fieldName === 'campusSetting' ? `
• Consider their college size preference
• Think about internship/career opportunities in different settings
• Reference their intended major's typical campus settings
` : ''}
${fieldName === 'additionalPreferences' ? `
Consider these categories and suggest 2-3 relevant preferences:

🏛️ Campus Life: Greek Life, Athletics, Social Activities, Campus Events, LGBTQ+ Friendly, Safety, Weather
🎓 Academic: Study Abroad, Research, Internships, Honors Programs, Career Services
🤝 Support: Student Diversity, Alumni Networks, First-Generation Support, Disability Services
📝 Application: Test-Optional, Early Decision, Need-Blind Admission, Institutional Prestige

Ask ONE brief question about their priorities.
` : ''}
${fieldName === 'costImportance' || fieldName === 'budgetRange' ? `
• Be sensitive about financial matters - be encouraging and supportive
• Mention financial aid, scholarships, and need-blind admission options
• Consider their geographic preferences (studying abroad vs. domestic costs)
` : ''}

Your response format must be:
[2-3 SHORT bullet points OR 2-3 sentences - NO MORE]

SUGGESTIONS: [option1, option2, option3]

IMPORTANT:
• Maximum 2-3 bullet points or 2-3 sentences
• Each bullet point should be ONE short sentence
• NO lengthy explanations
• Get to the point immediately
• ALWAYS provide 2-3 relevant suggestions from the available options
• For single-select fields (intendedMajors, collegeSize, campusSetting, costImportance), provide specific options that can be clicked to select
• For multi-select fields (geographicPreference, additionalPreferences), provide options that can be toggled on/off

SPECIFIC SUGGESTION REQUIREMENTS:
• intendedMajors: Provide 2-3 specific major options from the available choices (exact names from the dropdown)
• collegeSize: MUST use exact values "Small", "Medium", "Large" (NOT the full descriptions)
• campusSetting: MUST include exact values "Urban", "Suburban", "Rural"
• geographicPreference: Provide 2-3 countries from the available options (exact names)
• additionalPreferences: Provide 2-3 specific preferences from the available list (exact names)
• costImportance: MUST use exact values "Very Important", "Important", "Somewhat Important", "Not Important"

Do not forget the SUGGESTIONS line - it is mandatory for all responses.`

    console.log("📄 Full prompt length:", fullPrompt.length)
    console.log("🔑 API Key exists:", !!API_KEY)
    console.log("🤖 Model:", MODEL_NAME)

    console.log("📡 Making API call...")
    console.log("🔍 Full prompt being sent:", fullPrompt)
    const result = await generateWithRetry(fullPrompt)
    
    console.log("✅ API call completed")
    const response = await result.response
    let responseText = response.text()
    console.log("📤 Response text:", responseText)
    console.log("🔍 Response includes SUGGESTIONS:", responseText.includes("SUGGESTIONS:"))
    
    // Fallback: If AI didn't include suggestions, add them automatically
    if (!responseText.includes("SUGGESTIONS:") && fieldOptions) {
      console.log("⚠️ AI didn't include suggestions, adding fallback...")
      const options = Array.isArray(fieldOptions) ? fieldOptions : Object.values(fieldOptions)
      const fallbackSuggestions = options.slice(0, 3) // Take first 3 options
      responseText += `\n\nSUGGESTIONS: [${fallbackSuggestions.join(", ")}]`
      console.log("✅ Added fallback suggestions:", fallbackSuggestions)
    }
    
    return responseText
  } catch (error) {
    if (isRetryableGeminiError(error)) {
      console.warn("⚠️ Gemini transient error in getProfileGuidanceResponse, returning graceful fallback.", {
        message: error instanceof Error ? error.message : "Unknown error",
      })
      return buildFallbackGuidanceResponse(fieldName)
    }

    console.error("❌ Error in getProfileGuidanceResponse:", error)
    console.error("🔍 Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Helper function to extract suggestions from AI response
export function extractSuggestions(response: string): string[] {
  const match = response.match(/SUGGESTIONS:\s*\[(.*?)\]/);
  if (match) {
    return match[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(Boolean);
  }
  return [];
}

interface CollegeRecommendationData {
  gradeLevel: string
  countryOfResidence: string
  stateProvince: string
  intendedMajor: string
  customMajor?: string
  gradingSystem: string
  gpa?: number
  classRank: string
  satScore?: number
  actScore?: number
  aLevelSubjects?: { subject: string; grade: string }[]
  ibSubjects?: { subject: string; level: string; grade: string }[]
  ibTotalPoints?: string
  otherGradingSystem?: string
  otherGrades?: string
  extracurricularActivities: { activity: string; tier: string; description: string }[]
  collegeSize: string
  campusSetting: string
  geographicPreference: string[]
  costImportance: string
  academicReputation: string
  socialLife: string
  researchOpportunities: string
  internshipOpportunities: string
  studyAbroadPrograms: string
  greekLifeImportant: boolean
  strongAthletics: boolean
  diverseStudentBody: boolean
  strongAlumniNetwork: boolean
  otherPreferences: string
  preferredCountries: string[]
  preferredUSStates: string[]
  familyIncome?: string
  firstGenerationStudent?: boolean
  financialAidNeeded?: boolean
}

export async function generateCollegeRecommendations(profileData: CollegeRecommendationData): Promise<string> {
  try {
    if (!model) {
      throw new Error("Gemini API not initialized - missing API key")
    }

    // Create the comprehensive prompt
    const prompt = `You are a college admissions consultant and coach. Your approach is holistic, student-centered, and grounded in the philosophies of Coaching for College (www.coachingforcollege.org), Shemmassian Consulting, and the International Coaching Federation (ICF) coaching principles. This means you:

- Treat each student as a unique individual, helping them discover and articulate their authentic story
- Encourage self-reflection, self-awareness, and personal growth
- Use active listening, empathy, and open-ended questions to empower students to make informed, confident decisions
- Provide unbiased, personalized advice focused on "fit" and long-term success, not just prestige or rankings
- Support students in exploring their options and building a balanced, compelling application portfolio

Based on the student profile and preferences below, recommend a list of universities classified as reach, target, and safety schools. For each recommendation:
- Briefly explain why it fits the student's academic profile and preferences
- Generate a percentage chance of admission based on available data and the student's profile
- Use reputable resources like topuniversities.com and collegevine.com to inform estimates

**IMPORTANT: You MUST prioritize the student's geographic preferences. If they selected specific countries/regions, focus your recommendations primarily on universities in those locations.**

Student Profile:

📋 Section 1: Personal Information
Current Grade Level: ${profileData.gradeLevel || "Not specified"}
Country of Residence: ${profileData.countryOfResidence || "Not specified"}
State (if USA): ${profileData.stateProvince || "Not specified"}

📚 Section 2: Academic Profile
Primary Grading System: ${profileData.gradingSystem || "Not specified"}

${profileData.gradingSystem === "US GPA" ? `
GPA: ${profileData.gpa || "Not specified"}
Class Rank: ${profileData.classRank || "Not specified"}
SAT Score: ${profileData.satScore || "Not specified"}
ACT Score: ${profileData.actScore || "Not specified"}
` : ""}

${profileData.gradingSystem === "International Baccalaureate (IB)" ? `
Total Predicted/Final Score: ${profileData.ibTotalPoints || "Not specified"}
IB Subjects: ${profileData.ibSubjects?.map(s => `${s.subject}: ${s.level}, ${s.grade}`).join("\n") || "Not specified"}
` : ""}

${profileData.gradingSystem === "A-Levels" ? `
A-Level Subjects: ${profileData.aLevelSubjects?.map(s => `${s.subject}: ${s.grade}`).join("\n") || "Not specified"}
` : ""}

${profileData.gradingSystem === "Other" ? `
Describe Your Grading System: ${profileData.otherGradingSystem || "Not specified"}
Your Grades/Scores: ${profileData.otherGrades || "Not specified"}
` : ""}

🎯 Section 3: Extracurricular Activities
${profileData.extracurricularActivities?.map((activity, index) => 
  `${activity.activity}: Tier ${activity.tier}, ${activity.description}`
).join("\n") || "None specified"}

🎓 Section 4: College Preferences ⭐ **PRIORITY SECTION** ⭐
Intended Major: ${profileData.intendedMajor === "✏️ Enter a custom major" ? profileData.customMajor : profileData.intendedMajor || "Not specified"}
Custom Major (if applicable): ${profileData.intendedMajor === "✏️ Enter a custom major" ? profileData.customMajor : "N/A"}

**🌍 GEOGRAPHIC PREFERENCES (MUST PRIORITIZE):**
- Primary Geographic Preferences: ${profileData.geographicPreference?.join(", ") || "Not specified"}
- Preferred Countries: ${profileData.preferredCountries?.join(", ") || "Not specified"}
- US States (if applicable): ${profileData.preferredUSStates?.join(", ") || "Not specified"}

Other College Preferences:
- Preferred College Size: ${profileData.collegeSize || "Not specified"}
- Campus Setting: ${profileData.campusSetting || "Not specified"}
- Cost Importance: ${profileData.costImportance || "Not specified"}

Additional Preferences:
Greek Life Important: ${profileData.greekLifeImportant ? "Yes" : "No"}
Strong Athletics Program: ${profileData.strongAthletics ? "Yes" : "No"}
Diverse Student Body: ${profileData.diverseStudentBody ? "Yes" : "No"}
Strong Alumni Network: ${profileData.strongAlumniNetwork ? "Yes" : "No"}
Study Abroad Programs: ${profileData.studyAbroadPrograms || "Not specified"}
Research Opportunities: ${profileData.researchOpportunities || "Not specified"}
Internship Opportunities: ${profileData.internshipOpportunities || "Not specified"}
Other Preferences: ${profileData.otherPreferences || "Not specified"}

💰 Section 5: Background Information
Family Income Range: ${profileData.familyIncome || "Not specified"}
First-Generation College Student: ${profileData.firstGenerationStudent ? "Yes" : "No"}
Financial Aid Needed: ${profileData.financialAidNeeded ? "Yes" : "No"}

Instructions:
Based on this information, please recommend a list of universities classified into:

Reach Schools (ambitious, less likely but possible)
Target Schools (well-matched to the student's profile)
Safety Schools (high likelihood of admission)

**CRITICAL REQUIREMENTS:**
1. **GEOGRAPHIC FOCUS**: ${profileData.geographicPreference?.length > 0 ? 
  `The student has specified these geographic preferences: ${profileData.geographicPreference.join(", ")}. You MUST focus your recommendations on universities in these locations. If they selected Singapore, recommend universities in Singapore. If they selected multiple countries, distribute recommendations across those countries.` : 
  "The student has not specified geographic preferences, so you may recommend universities globally but consider their country of residence."}

2. **LOCATION MATCHING**: Each recommendation must clearly state the country and city where the university is located.

3. **JUSTIFICATION**: For each university, explain how it matches both their academic profile AND their geographic preferences.

For each university:
- Provide a brief explanation of why it is a good fit for the student's academic profile and preferences, considering the holistic, student-centered, and coaching-based approach described above
- Include a percentage chance of admission for this student, using available data and resources such as topuniversities.com, collegevine.com, and similar. Clearly state if the estimate is based on available public data and the student's provided information
- **Always mention the country and city location**

Return your response in a clear, structured format that can be easily displayed to the student. Use markdown formatting for better readability.`

    console.log("🚀 Starting college recommendations generation")
    console.log("📝 Profile data:", profileData)
    console.log("📄 Full prompt length:", prompt.length)
    console.log("🔑 API Key exists:", !!API_KEY)

    const result = await generateWithRetry(prompt)
    
    console.log("✅ API call completed")
    const response = await result.response
    const responseText = response.text()
    console.log("📤 Response text length:", responseText.length)
    
    return responseText
  } catch (error) {
    console.error("❌ College recommendations error:", error)
    throw new Error(`Failed to generate college recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Test function for Gemini API
export async function testGeminiAPI(): Promise<string> {
  try {
    if (!model) {
      throw new Error("Gemini API not initialized - missing API key")
    }

    const result = await generateWithRetry(
      "Hello! Please respond with a simple test message to confirm the Gemini API is working correctly."
    )
    
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("❌ Test Gemini API error:", error)
    throw new Error(`Gemini API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}