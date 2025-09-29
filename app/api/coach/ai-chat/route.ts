import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI (using the same env var as other parts of the app)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface StudentContext {
  totalStudents: number
  studentsOverview: Array<{
    name: string
    email: string
    gradeLevel?: string
    country?: string
    profileCompletion: number
    collegeMatches: number
    collegesInList: number
    applicationProgress: {
      considering: number
      planning_to_apply: number
      applied: number
      interviewing: number
      accepted: number
      rejected: number
      enrolled: number
    }
    lastLogin?: string
    assignedDate: string
  }>
  summary: {
    averageProfileCompletion: number
    totalRecommendations: number
    totalCollegesInLists: number
    totalApplications: number
    studentsNeedingAttention: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated and is a coach
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user profile and verify coach role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, role, current_role")
      .eq("id", authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const isCoach = user.current_role === 'coach' || 
                   user.current_role === 'super_admin' ||
                   user.role === 'coach' || 
                   user.role === 'super_admin'

    if (!isCoach) {
      return NextResponse.json(
        { success: false, error: "Coach access required" },
        { status: 403 }
      )
    }

    const { message, studentContext, conversationHistory } = await request.json()

    // Check if this is a factual query about specific student data
    const isFactualQuery = /tell me|show me|what are|what is|list|details? of|about/i.test(message) &&
                          /preferences|profile|colleges|applications|recommendations|grades|scores|major|test scores|gpa|sat|act|dream colleges|intended major/i.test(message) ||
                          /\b(preferences|profile|colleges|applications|recommendations|grades|scores|major|test scores|gpa|sat|act|dream colleges|intended major)\b.*\b(of|for|about|for)\b/i.test(message) ||
                          /\b(ethan|ayesh|flavion|senara|[A-Z][a-z]+)'s\s+(preferences|profile|colleges|applications|recommendations|grades|scores|major|test scores|gpa|sat|act|dream colleges|intended major)/i.test(message)

    // Debug logging
    console.log("Query analysis:", {
      message,
      isFactualQuery,
      tellMePattern: /tell me|show me|what are|what is|list|details? of|about/i.test(message),
      dataKeywords: /preferences|profile|colleges|applications|recommendations|grades|scores|major|test scores|gpa|sat|act|dream colleges|intended major/i.test(message)
    })

    // If it's a factual query, we might need to fetch additional detailed data
    let enhancedStudentData = studentContext
    if (isFactualQuery) {
      // Extract student name from the query if mentioned
      const studentNameMatch = message.match(/\b(ethan|ayesh|flavion|senara|[A-Z][a-z]+)\b/i)
      if (studentNameMatch) {
        const studentName = studentNameMatch[1]
        console.log("Looking for student:", studentName)
        console.log("Available students:", studentContext.studentsOverview.map(s => s.name))
        
        // Find the student in our context
        const student = studentContext.studentsOverview.find(s => 
          s.name.toLowerCase().includes(studentName.toLowerCase())
        )
        console.log("Found student:", student)
        if (student && student.id) {
          try {
            // Fetch detailed profile data for this student
            const adminClient = createAdminClient()
            
            // Get detailed profile with all preference fields
            const { data: profiles } = await adminClient
              .from("student_profiles")
              .select(`
                *
              `)
              .eq("user_id", student.id)
              .order("updated_at", { ascending: false })

            // Get college matches
            const { data: matches } = await adminClient
              .from("college_matches")
              .select("*")
              .eq("user_id", student.id)
              .order("match_score", { ascending: false })

            // Get college applications
            const { data: applications } = await adminClient
              .from("my_college_list")
              .select("*")
              .eq("student_id", student.id)
              .order("updated_at", { ascending: false })
            
            console.log("Fetched profile data:", profiles?.[0])
            console.log("Fetched matches:", matches?.length || 0)
            console.log("Fetched applications:", applications?.length || 0)
            
            if (profiles && profiles[0]) {
              enhancedStudentData = {
                ...studentContext,
                detailedProfile: {
                  studentName: student.name,
                  profile: profiles[0],
                  collegeMatches: matches || [],
                  applications: applications || []
                }
              }
              console.log("Enhanced student data created for:", student.name)
            } else {
              console.log("No profile data found for student:", student.name)
            }
          } catch (error) {
            console.log("Could not fetch detailed profile:", error)
            // Continue with basic data
          }
        }
      }
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      )
    }

    // Prepare the context for Gemini
    const systemPrompt = `You are Dr. Sarah Chen, a senior college admissions coach with 15 years of experience mentoring junior coaches. Your approach is direct, practical, and focused on student outcomes. You're helping a junior coach analyze their ${studentContext.totalStudents} assigned students.

CURRENT PORTFOLIO SNAPSHOT:
- ${studentContext.summary.studentsNeedingAttention} students need immediate attention
- Average profile completion: ${studentContext.summary.averageProfileCompletion}%
- ${studentContext.summary.totalRecommendations} AI recommendations generated
- ${studentContext.summary.totalCollegesInLists} colleges added to student lists

STUDENT DATA:
${JSON.stringify(enhancedStudentData.studentsOverview, null, 2)}

${enhancedStudentData.detailedProfile ? `

DETAILED PROFILE DATA FOR ${enhancedStudentData.detailedProfile.studentName}:
${JSON.stringify(enhancedStudentData.detailedProfile, null, 2)}` : ''}

YOUR DUAL ROLE:
1. **Data Reporter**: For factual questions about student profiles, preferences, recommendations, applications - provide direct data from the student records
2. **Senior Coach Mentor**: For strategic questions about coaching approaches, priorities, next steps - provide guidance as Dr. Sarah Chen

RESPONSE GUIDELINES:
For FACTUAL QUERIES (like "Tell me Ethan's preferences", "What colleges did Maria apply to?", "Show me John's test scores"):
- Provide direct, specific data from student records
- Use clear formatting with bullet points or sections
- Include all relevant details from the data
- No coaching advice, just the requested information
- End with data-focused follow-up questions

For COACHING QUERIES (like "Who needs attention?", "How should I prioritize?", "What's my next step?"):
- Respond as Dr. Sarah Chen, senior mentor
- Keep responses concise (2-3 short paragraphs max)
- Use **bold** for student names and priorities
- Use 🔴 for urgent, 🟡 for medium priority, 🟢 for good progress
- Lead with the most important insight
- End with 1-2 specific action items
- Reference specific data points to support recommendations
- End with coaching-focused follow-up questions

TONE: 
- For factual queries: Clear, informative, data-focused
- For coaching queries: Professional yet approachable, like a mentor in a quick strategy session`

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Build conversation history for context
    const conversationContext = conversationHistory
      ?.slice(-10) // Keep last 10 messages for context
      ?.map((msg: ChatMessage) => `${msg.role === 'user' ? 'Coach' : 'Assistant'}: ${msg.content}`)
      ?.join('\n\n') || ''

    const fullPrompt = `${systemPrompt}

${conversationContext ? `RECENT CONVERSATION:\n${conversationContext}\n\n` : ''}

JUNIOR COACH ASKS: "${message}"

CRITICAL INSTRUCTION: First determine if this is:
1. FACTUAL QUERY: Asking for specific data about a student (preferences, profile details, test scores, colleges, applications)
2. COACHING QUERY: Asking for advice, priorities, strategy, or next steps

If FACTUAL QUERY:
- Act as a DATA REPORTER, not Dr. Sarah Chen
- First check the DETAILED PROFILE DATA section for comprehensive information
- Look for preferences in BOTH top-level fields AND the college_preferences JSONB object:
  * Top-level: preferred_majors, college_size, campus_setting, preferred_countries, preferred_us_states, budget_range
  * college_preferences object: costImportance, academicReputation, socialLife, studyAbroadPrograms, etc.
- Format college preferences clearly with sections like:
  * Academic Preferences (majors, reputation, research)
  * Campus Preferences (size, setting, location)
  * Geographic Preferences (countries, states)
  * Financial Considerations (budget, cost importance)
  * Additional Preferences (study abroad, athletics, etc.)
- If detailed profile is not available, show what basic information IS available from the student overview
- Always show: profile completion %, grade level, country, college matches count, colleges in list count
- Use clear sections and bullet points
- If specific requested data is not available, say "This specific information is not in [student's] profile yet" but show what IS available
- NO coaching advice or priorities
- End with data-focused questions like "Want to see [student's] college matches?" or "Should I show their application timeline?"

If COACHING QUERY:
- Respond as Dr. Sarah Chen with strategic coaching insight
- Include priorities, action items, and recommendations
- End with coaching-focused follow-up questions

FOR THIS QUERY "${message}":
${isFactualQuery ? 'This is a FACTUAL QUERY - provide data only, no coaching advice.' : 'This is a COACHING QUERY - provide strategic guidance as Dr. Sarah Chen.'}`

    const result = await model.generateContent(fullPrompt)
    const response = result.response.text()

    return NextResponse.json({
      success: true,
      response: response
    })

  } catch (error: any) {
    console.error("Error in AI chat:", error)
    
    // Check if it's a Gemini API error
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { success: false, error: "AI service configuration error. Please contact support." },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to generate AI response" },
      { status: 500 }
    )
  }
}
