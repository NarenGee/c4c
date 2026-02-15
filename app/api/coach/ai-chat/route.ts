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
    id?: string
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

// Helper function to fetch comprehensive student data
async function fetchComprehensiveStudentData(adminClient: any, studentId: string, studentName: string) {
  try {
    // Fetch detailed profile with all preference fields
    const { data: profiles } = await adminClient
      .from("student_profiles")
      .select("*")
      .eq("user_id", studentId)
      .order("updated_at", { ascending: false })

    // Get college matches/recommendations
    const { data: matches } = await adminClient
      .from("college_matches")
      .select("*")
      .eq("user_id", studentId)
      .order("match_score", { ascending: false })

    // Get college applications - try both student_id and user_id
    let { data: applications } = await adminClient
      .from("my_college_list")
      .select("*")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false })
    
    // If no applications found with student_id, try user_id
    if (!applications || applications.length === 0) {
      const { data: applicationsByUserId } = await adminClient
        .from("my_college_list")
        .select("*")
        .eq("user_id", studentId)
        .order("updated_at", { ascending: false })
      applications = applicationsByUserId
    }

    // Get coach/student notes (same columns as GET /api/coach/students/[studentId]/notes)
    const { data: notes, error: notesError } = await adminClient
      .from("student_notes")
      .select(`
        id,
        type,
        content,
        created_at,
        author_id,
        visible_to_student,
        parent_note_id,
        is_reply
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })

    if (notesError) {
      console.error(`Error fetching notes for student ${studentId}:`, notesError)
    }

    // Get author names for notes
    const notesWithAuthors = []
    for (const note of notes || []) {
      const { data: author } = await adminClient
        .from("users")
        .select("full_name")
        .eq("id", note.author_id)
        .single()

      notesWithAuthors.push({
        ...note,
        note_type: note.type, // alias for prompt consistency
        author_name: author?.full_name || "Unknown"
      })
    }

    console.log(`📊 Fetched comprehensive data for ${studentName}:`, {
      profile: !!profiles?.[0],
      profileKeys: profiles?.[0] ? Object.keys(profiles[0]) : [],
      collegePreferences: profiles?.[0]?.college_preferences ? Object.keys(profiles[0].college_preferences) : 'No preferences',
      preferencesData: profiles?.[0]?.college_preferences,
      preferencesType: typeof profiles?.[0]?.college_preferences,
      preferencesStringified: JSON.stringify(profiles?.[0]?.college_preferences, null, 2),
      matches: matches?.length || 0,
      applications: applications?.length || 0,
      notes: notesWithAuthors.length
    })

    return {
      studentName,
      studentId,
      profile: profiles?.[0] || null,
      collegeMatches: matches || [],
      applications: applications || [],
      notes: notesWithAuthors
    }
  } catch (error) {
    console.error("Error fetching comprehensive student data:", error)
    return null
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

    const body = await request.json()
    const message = body?.message
    const rawStudentContext = body?.studentContext
    const conversationHistory = body?.conversationHistory

    // Ensure we have a valid student context (default to minimal structure to avoid crashes)
    const studentContext = rawStudentContext && typeof rawStudentContext === 'object'
      ? rawStudentContext
      : {
          totalStudents: 0,
          studentsOverview: [],
          summary: {
            averageProfileCompletion: 0,
            totalRecommendations: 0,
            totalCollegesInLists: 0,
            totalApplications: 0,
            studentsNeedingAttention: 0
          }
        }

    // Check if this is a factual query about specific student data
    const isFactualQuery = /tell me|show me|what are|what is|list|details? of|about/i.test(message || '') &&
                          /preferences|profile|colleges|applications|recommendations|grades|scores|major|test scores|gpa|sat|act|dream colleges|intended major/i.test(message) ||
                          /\b(preferences|profile|colleges|applications|recommendations|grades|scores|major|test scores|gpa|sat|act|dream colleges|intended major)\b.*\b(of|for|about|for)\b/i.test(message) ||
                          /\b(ethan|ayesh|flavion|senara|[A-Z][a-z]+)'s\s+(preferences|profile|colleges|applications|recommendations|grades|scores|major|test scores|gpa|sat|act|dream colleges|intended major)/i.test(message)

    // Debug logging
    const overview = studentContext.studentsOverview || []
    console.log("Query analysis:", {
      message,
      isFactualQuery,
      tellMePattern: /tell me|show me|what are|what is|list|details? of|about/i.test(message || ''),
      dataKeywords: /preferences|profile|colleges|applications|recommendations|grades|scores|major|test scores|gpa|sat|act|dream colleges|intended major/i.test(message || ''),
      availableStudents: overview.map((s: { name?: string }) => s.name)
    })

    // Enhanced student data fetching for comprehensive context
    let enhancedStudentData = studentContext

    // Words to avoid treating as first names when matching in the message
    const nameStopWords = new Set(['i', 'my', 'me', 'a', 'an', 'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'can', 'need', 'want', 'to', 'for', 'with', 'about', 'who', 'what', 'how', 'when', 'where', 'we', 'they', 'he', 'she', 'it', 'you', 'all', 'any', 'some', 'no', 'not', 'just', 'only', 'so', 'if', 'or', 'and', 'but', 'summarize', 'summarise', 'summary', 'notes', 'conversations', 'conversation'])
    
    // Resolve student by name: try regex patterns first, then match assigned students by first/full name in message
    let resolvedStudent: { id: string; name: string } | null = null
    const regexMatch = message.match(/\b(ethan|ayesh|flavion|senara)\b/i) || 
                       message.match(/\b([A-Z][a-z]+)'s\b/i) ||
                       message.match(/\b([A-Z][a-z]+)'s\s+(preferences|profile|colleges|applications|recommendations)/i)
    if (regexMatch) {
      let nameFromRegex = regexMatch[1]
      if (regexMatch[0].includes("'s")) nameFromRegex = regexMatch[1]
      const student = overview.find((s: { name?: string }) => 
        s.name?.toLowerCase().includes(nameFromRegex.toLowerCase())
      )
      if (student?.id && student?.name) resolvedStudent = { id: student.id, name: student.name }
    }
    if (!resolvedStudent && overview.length > 0) {
      const msgLower = message.toLowerCase()
      for (const s of overview) {
        const fullName = (s.name || '').trim()
        if (!fullName) continue
        const firstName = fullName.split(/\s+/)[0]
        if (firstName.length < 2 || nameStopWords.has(firstName.toLowerCase())) continue
        const wordBoundary = new RegExp(`\\b${firstName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (wordBoundary.test(message)) {
          resolvedStudent = { id: s.id, name: s.name }
          break
        }
        if (fullName.length > firstName.length && fullName.toLowerCase() !== firstName.toLowerCase()) {
          const fullNameRegex = new RegExp(`\\b${fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
          if (fullNameRegex.test(message)) {
            resolvedStudent = { id: s.id, name: s.name }
            break
          }
        }
      }
    }
    
    const requestsDetailedInfo = /profile|preferences|recommendations|applications|notes|details|overview/i.test(message)
    
    if (resolvedStudent || requestsDetailedInfo || isFactualQuery) {
      const adminClient = createAdminClient()
      
      if (resolvedStudent) {
        console.log("Looking for student:", resolvedStudent.name)
        try {
          const comprehensiveData = await fetchComprehensiveStudentData(adminClient, resolvedStudent.id, resolvedStudent.name)
          if (comprehensiveData) {
            enhancedStudentData = {
              ...studentContext,
              detailedProfile: comprehensiveData
            }
          }
        } catch (error) {
          console.log("Could not fetch comprehensive data for student:", error)
        }
      }
      
      // For general queries, fetch comprehensive data for all students (limited to avoid token limits)
      else if (requestsDetailedInfo) {
        try {
          const allStudentsData = []
          for (const student of studentContext.studentsOverview.slice(0, 3)) { // Limit to 3 students for token management
            const comprehensiveData = await fetchComprehensiveStudentData(adminClient, student.id, student.name)
            if (comprehensiveData) {
              allStudentsData.push(comprehensiveData)
            }
          }
          
          if (allStudentsData.length > 0) {
            enhancedStudentData = {
              ...studentContext,
              allStudentsComprehensive: allStudentsData
            }
          }
        } catch (error) {
          console.log("Could not fetch comprehensive data for all students:", error)
        }
      }
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      )
    }

    // Validate Gemini API key before calling
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      console.error("AI chat: GOOGLE_GENERATIVE_AI_API_KEY is missing or empty")
      return NextResponse.json(
        { success: false, error: "AI service is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY." },
        { status: 503 }
      )
    }

    // Detect when the coach asks to summarize notes or conversations for a student
    const isNotesSummaryQuery = /\b(summarize|summarise|summary)\b.*\b(notes?|conversations?)\b|\b(notes?|conversations?)\b.*\b(summarize|summarise|summary)\b|\b(my\s+)?(notes?|conversations?)\s+(with|for|about)\b/i.test(message || '')
    const treatAsNotesSummary = isNotesSummaryQuery && !!enhancedStudentData.detailedProfile

    // Prepare the context for Gemini
    const systemPrompt = `You are Dr. Sarah Chen, a senior college admissions coach with 15 years of experience mentoring junior coaches. Your approach is direct, practical, and focused on student outcomes. You're helping a junior coach analyze their ${studentContext.totalStudents} assigned students.

CURRENT PORTFOLIO SNAPSHOT:
- ${studentContext.summary.studentsNeedingAttention} students need immediate attention
- Average profile completion: ${studentContext.summary.averageProfileCompletion}%
- ${studentContext.summary.totalRecommendations} AI recommendations generated
- ${studentContext.summary.totalCollegesInLists} colleges added to student lists

STUDENT OVERVIEW DATA:
${JSON.stringify(enhancedStudentData.studentsOverview, null, 2)}

${enhancedStudentData.detailedProfile ? `

COMPREHENSIVE STUDENT DATA FOR ${enhancedStudentData.detailedProfile.studentName}:

OVERVIEW SECTION:
- Student ID: ${enhancedStudentData.detailedProfile.studentId}
- Basic Info: ${JSON.stringify(enhancedStudentData.detailedProfile.profile, null, 2)}

STUDENT PROFILE SECTION:
- Academic Details: Grade Level, GPA, Test Scores (SAT/ACT), Grading System
- Personal Info: Country, Location Preferences, College Size, Campus Setting
- Academic Interests: Preferred Majors, Interests, Extracurricular Activities
- International Details: A-Level Subjects, IB Subjects, IB Total Points

COLLEGE PREFERENCES SECTION:
- Academic Preferences: Cost Importance, Academic Reputation, Social Life, Research Opportunities
- Campus Life: Greek Life, Athletics, Student Body Diversity, Alumni Network
- Location & Climate: Weather Preferences, Study Abroad Importance
- Support Services: First Generation Support, Disability Services, LGBTQ Support
- Application Preferences: Test Optional, Early Action, Need Blind Admission, Legacy Consideration
- Other Preferences: Demonstrated Interest, Institutional Prestige, Specific Preferences

COLLEGE RECOMMENDATIONS SECTION:
- AI-Generated Matches: ${enhancedStudentData.detailedProfile.collegeMatches.length} recommendations
- Match Details: ${JSON.stringify(enhancedStudentData.detailedProfile.collegeMatches.slice(0, 5), null, 2)}

APPLICATIONS SECTION:
- Application Status: ${enhancedStudentData.detailedProfile.applications.length} colleges in list
- Application Details: ${JSON.stringify(enhancedStudentData.detailedProfile.applications, null, 2)}

NOTES SECTION:
- Coach Notes: ${enhancedStudentData.detailedProfile.notes.length} notes available
- Note Details: ${JSON.stringify(enhancedStudentData.detailedProfile.notes, null, 2)}` : ''}

${enhancedStudentData.allStudentsComprehensive ? `

COMPREHENSIVE DATA FOR ALL STUDENTS:
${enhancedStudentData.allStudentsComprehensive.map(student => `
STUDENT: ${student.studentName}
- Profile: ${JSON.stringify(student.profile, null, 2)}
- College Matches: ${student.collegeMatches.length} recommendations
- Applications: ${student.applications.length} colleges in list
- Notes: ${student.notes.length} coach notes
`).join('\n')}` : ''}

YOUR DUAL ROLE:
1. **Data Reporter**: For factual questions about student profiles, preferences, recommendations, applications - provide direct data from the student records
2. **Senior Coach Mentor**: For strategic questions about coaching approaches, priorities, next steps - provide guidance as Dr. Sarah Chen

FORMATTING (apply to ALL responses - mandatory for ease of reading):
- Always use **bullet points** (- or •) for lists; avoid long walls of text
- Use **bold** (**text**) for names, key terms, and section labels
- Use blank lines between sections or logical groups
- Keep paragraphs short (2-4 lines max); break into bullets where possible
- For multiple items (notes, students, colleges), use one bullet per item with optional sub-bullets for details
- Structure longer answers with a brief intro line, then bulleted content, then a short closing or "What's next?" if applicable

RESPONSE GUIDELINES:
For FACTUAL QUERIES (like "Tell me Ethan's preferences", "What colleges did Maria apply to?", "Show me John's test scores"):
- Provide direct, specific data from student records
- Format as bulleted lists and clear sections (e.g. **Academic**, **Location**, then bullets under each)
- Include all relevant details from the data
- No coaching advice, just the requested information
- End with 1-2 data-focused follow-up questions as bullets

For NOTES/CONVERSATION SUMMARY (e.g. "Summarize my notes with Vinuthi", "Summarize my conversations with [student]"):
- Use ONLY the NOTES SECTION for that student (under COMPREHENSIVE STUDENT DATA)
- You MUST format exactly like this (each bullet on its own line; Summary must be multiple separate bullets, NOT one paragraph):
  EXAMPLE - copy this structure with real newlines between each line:
  **Note** (or date)
  - **Date:** [date]
  - **Author:** [name]
  - **Type:** [note/meeting/action]
  - **Summary:**
  - [First key point in one short line]
  - [Second key point in one short line]
  - [Third key point in one short line]
  - [Fourth key point if needed]
  WRONG: Do NOT write "Summary: The conversation covered X. You discussed Y. You emphasized Z." as one block. RIGHT: Put each key point on its own line starting with "- ".
- If there are no notes for that student, say clearly: "You don't have any notes for [student] yet."
- No coaching advice; only the summary. Blank line between notes.

For COACHING QUERIES (like "Who needs attention?", "How should I prioritize?", "What's my next step?"):
- Respond as Dr. Sarah Chen, senior mentor
- Use bullet points for priorities, action items, and recommendations (not long paragraphs)
- Use **bold** for student names and priorities
- Use 🔴 for urgent, 🟡 for medium priority, 🟢 for good progress
- Lead with one short insight line, then bulleted list of points
- End with 1-2 specific action items as bullets
- End with coaching-focused follow-up questions as bullets

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
2. NOTES SUMMARY QUERY: Asking to summarize my notes or conversations with a specific student
3. COACHING QUERY: Asking for advice, priorities, strategy, or next steps

If NOTES SUMMARY QUERY (user asked to summarize notes/conversations with a student):
- Use ONLY the NOTES SECTION for that student in COMPREHENSIVE STUDENT DATA
- CRITICAL: Put every bullet on its own line. Under Summary, output 3–5 separate lines, each line starting with "- " and one key point only. Never write the summary as one long sentence or paragraph.
- If no notes exist for that student, say "You don't have any notes for [student] yet."
- Do not add coaching advice. Blank line between notes.

If FACTUAL QUERY:
- Act as a DATA REPORTER, not Dr. Sarah Chen
- First check the DETAILED PROFILE DATA section for comprehensive information
- Look for preferences in BOTH top-level fields AND the college_preferences JSONB object:
  * Top-level: preferred_majors, college_size, campus_setting, preferred_countries, preferred_us_states, budget_range, interests, dream_colleges
  * college_preferences object: costImportance, academicReputation, socialLife, studyAbroadPrograms, etc.
- If college_preferences is empty {} but top-level fields have data, show the top-level preference data
- Format college preferences clearly with sections like:
  * Academic Preferences (majors, reputation, research)
  * Campus Preferences (size, setting, location)
  * Geographic Preferences (countries, states)
  * Financial Considerations (budget, cost importance)
  * Additional Preferences (study abroad, athletics, etc.)
- If detailed profile is not available, show what basic information IS available from the student overview
- Always show: profile completion %, grade level, country, college matches count, colleges in list count
- Use clear sections with **bold** headings and bullet points under each; avoid long paragraphs
- If specific requested data is not available, say "This specific information is not in [student's] profile yet" but show what IS available in bullets
- If asked about college list and applications data exists, show the college names and their status
- NO coaching advice or priorities
- End with data-focused questions like "Want to see [student's] college matches?" or "Should I show their application timeline?"

If COACHING QUERY:
- Respond as Dr. Sarah Chen with strategic coaching insight
- Include priorities, action items, and recommendations
- End with coaching-focused follow-up questions

FOR THIS QUERY "${message}":
${treatAsNotesSummary ? 'This is a NOTES SUMMARY QUERY - use ONLY the NOTES SECTION. Each bullet must be on its own line. Under Summary, output 3-5 separate lines each starting with "- " (one key point per line). Do NOT write the summary as one paragraph. If no notes, say so clearly.' : isFactualQuery ? 'This is a FACTUAL QUERY - provide data only, no coaching advice. Format with bullet points and clear **bold** sections.' : 'This is a COACHING QUERY - provide strategic guidance as Dr. Sarah Chen. Use bullet points for priorities and action items.'}`

    const result = await model.generateContent(fullPrompt)
    const geminiResponse = result.response

    // Handle empty or blocked responses (avoid .text() throwing)
    let responseText: string
    try {
      responseText = geminiResponse.text() ?? ""
    } catch (textError: any) {
      console.error("Gemini response.text() failed (possibly blocked or empty):", textError?.message)
      return NextResponse.json(
        { success: false, error: "The AI couldn't produce a reply for this request. Try rephrasing or a different question." },
        { status: 500 }
      )
    }

    if (!responseText.trim()) {
      return NextResponse.json(
        { success: false, error: "The AI returned an empty response. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      response: responseText
    })

  } catch (error: any) {
    const msg = error?.message ?? String(error)
    console.error("Error in AI chat:", msg, error?.stack)

    // Return clearer errors for known Gemini / API cases
    if (msg.includes("API key") || msg.includes("API_KEY") || msg.includes("invalid")) {
      return NextResponse.json(
        { success: false, error: "AI service configuration error. Please check GOOGLE_GENERATIVE_AI_API_KEY." },
        { status: 503 }
      )
    }
    if (msg.includes("404") || msg.includes("not found") || msg.includes("model")) {
      return NextResponse.json(
        { success: false, error: "AI model is temporarily unavailable. Please try again later." },
        { status: 503 }
      )
    }
    if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
      return NextResponse.json(
        { success: false, error: "AI rate limit reached. Please try again in a few minutes." },
        { status: 429 }
      )
    }
    if (msg.includes("blocked") || msg.includes("safety") || msg.includes("valid Part")) {
      return NextResponse.json(
        { success: false, error: "The AI couldn't complete that request. Try rephrasing your question." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate AI response. Please try again." },
      { status: 500 }
    )
  }
}
