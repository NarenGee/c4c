import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const MODEL_NAME = "gemini-2.5-flash"
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

if (!API_KEY) {
  throw new Error("Missing Gemini API key")
}

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ model: MODEL_NAME })

interface Message {
  role: string
  content: string
}

interface CollegeMatch {
  id: string
  college_name: string
  match_score: number
  admission_chance: number
  justification: string | null
  country?: string | null
  city?: string | null
  program_type?: string | null
  estimated_cost?: string | null
  fit_category: "Safety" | "Target" | "Reach"
  website_url?: string | null
  match_reasons?: string[] | null
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, collegeMatches, studentProfile } = await request.json()

    if (!messages || !collegeMatches || !studentProfile) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    // Create a comprehensive prompt for Gemini
    const prompt = createGuidancePrompt(messages, collegeMatches, studentProfile)

    // Generate response using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in college recommendations guidance:", error)
    return NextResponse.json(
      { error: "Failed to generate guidance response" },
      { status: 500 }
    )
  }
}

function createGuidancePrompt(
  messages: Message[],
  collegeMatches: CollegeMatch[],
  studentProfile: any
): string {
  // Format the conversation history
  const conversationHistory = messages
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n\n")

  // Format college matches for context
  const collegeMatchesContext = collegeMatches
    .map(match => `
• ${match.college_name} (${match.country || 'Unknown'})
  - Fit Category: ${match.fit_category}
  - Match Score: ${Math.round(match.match_score * 100)}%
  - Admission Chance: ${Math.round(match.admission_chance * 100)}%
  - Justification: ${match.justification || 'Not provided'}
  - Cost: ${match.estimated_cost || 'Not specified'}
  - Program Type: ${match.program_type || 'University'}
  ${match.match_reasons ? `- Match Reasons: ${match.match_reasons.join(', ')}` : ''}
    `)
    .join('\n')

  // Format student profile for context
  const profileContext = `
STUDENT PROFILE SUMMARY:
• Academic Level: ${studentProfile.gradeLevel || 'Not specified'}
• Intended Major: ${studentProfile.intendedMajor || 'Not specified'}
• GPA: ${studentProfile.gpa || 'Not specified'}
• Test Scores: ${studentProfile.satScore ? `SAT: ${studentProfile.satScore}` : ''} ${studentProfile.actScore ? `ACT: ${studentProfile.actScore}` : ''}
• Geographic Preferences: ${studentProfile.geographicPreference ? studentProfile.geographicPreference.join(', ') : 'Not specified'}
• College Size Preference: ${studentProfile.collegeSize || 'Not specified'}
• Campus Setting: ${studentProfile.campusSetting || 'Not specified'}
• Financial Aid Needed: ${studentProfile.financialAidNeeded ? 'Yes' : 'No'}
• Academic Reputation Importance: ${studentProfile.academicReputation || 'Not specified'}
• Cost Importance: ${studentProfile.costImportance || 'Not specified'}
• Extracurricular Activities: ${studentProfile.extracurricularActivities ? studentProfile.extracurricularActivities.map((activity: any) => `${activity.activity} (${activity.tier})`).join(', ') : 'None specified'}
  `.trim()

  return `You are a college admissions consultant and coach with expertise in helping students understand their college recommendations. Your approach is holistic, student-centered, and grounded in the philosophies of Coaching for College.

Your role is to help students understand:
• Why specific colleges were recommended for them
• How their profile matches (or doesn't match) certain colleges
• What factors influenced the recommendations
• How they can improve their chances for certain schools
• Alternative options they might consider

IMPORTANT GUIDELINES:
• Always speak directly to the student using "you" and "your"
• Be encouraging and constructive, never discouraging
• Provide specific, actionable insights based on their profile and recommendations
• If they ask about colleges not in their recommendations, explain why they might not have been included
• Use bullet points and clear formatting for better readability
• Keep responses concise but comprehensive (2-4 paragraphs)
• Be honest about limitations while remaining supportive

STUDENT'S COLLEGE RECOMMENDATIONS:
${collegeMatchesContext}

${profileContext}

CONVERSATION HISTORY:
${conversationHistory}

Based on the student's profile and college recommendations above, provide helpful guidance that addresses their specific question. Focus on explaining the reasoning behind their recommendations and helping them understand how their profile influenced these choices.

Remember to:
• Reference specific colleges from their recommendations when relevant
• Explain the match reasoning using their actual profile data
• Provide constructive feedback and suggestions
• Maintain a supportive, coaching-oriented tone
• Use bullet points for key insights
• Format your response for easy reading

Your response should be helpful, specific, and directly address the student's question while providing context about their recommendations.`
} 