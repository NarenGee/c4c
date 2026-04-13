import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { GEMINI_MODEL_NAME } from "@/lib/ai-model"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const dynamic = "force-dynamic"
export const revalidate = 0

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")
const MODEL_NAME = GEMINI_MODEL_NAME
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504])
const MAX_ATTEMPTS_PER_MODEL = 3
const BASE_RETRY_DELAY_MS = 1200

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

function inferAutoNavigationFromMessage(message: string): string | null {
  const lower = message.toLowerCase()

  const applicationsKeywords = [
    "application",
    "applications",
    "applied",
    "apply",
    "my college list",
    "college list",
    "application status",
  ]
  if (applicationsKeywords.some((keyword) => lower.includes(keyword))) {
    return "/college-list"
  }

  const recommendationsKeywords = [
    "recommendation",
    "recommendations",
    "recommend",
    "match",
    "matches",
    "college fit",
    "best colleges",
    "suggested colleges",
  ]
  if (recommendationsKeywords.some((keyword) => lower.includes(keyword))) {
    return "/college-recommendations"
  }

  const profileKeywords = [
    "profile",
    "my info",
    "my information",
    "personal info",
    "gpa",
    "sat",
    "act",
    "coursework",
    "academics",
    "extracurricular",
    "activities",
    "essay",
    "completion",
  ]
  if (profileKeywords.some((keyword) => lower.includes(keyword))) {
    return "/dashboard/profile"
  }

  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  if (statusCode !== null && RETRYABLE_STATUS_CODES.has(statusCode)) return true
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return (
    message.includes("high demand") ||
    message.includes("try again later") ||
    message.includes("temporarily unavailable") ||
    message.includes("service unavailable") ||
    message.includes("503")
  )
}

async function generateWithRetry(fullPrompt: string) {
  let lastError: unknown = null
  const model = genAI.getGenerativeModel({ model: MODEL_NAME })
  for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
    try {
      return await model.generateContent(fullPrompt)
    } catch (error) {
      lastError = error
      const shouldRetry = isRetryableGeminiError(error) && attempt < MAX_ATTEMPTS_PER_MODEL
      if (!shouldRetry) break
      const jitterMs = Math.floor(Math.random() * 350)
      const backoffMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + jitterMs
      await sleep(backoffMs)
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Gemini unavailable")
}

function buildFallbackStudentResponse(message: string) {
  const lower = message.toLowerCase()
  let navigateTo: string | null = null

  if (lower.includes("recommendation") || lower.includes("matches")) {
    navigateTo = "/college-recommendations"
  } else if (lower.includes("application") || lower.includes("college list")) {
    navigateTo = "/college-list"
  } else if (lower.includes("dream college")) {
    navigateTo = "/dashboard/profile#dream-colleges"
  } else if (lower.includes("profile") || lower.includes("academic")) {
    navigateTo = "/dashboard/profile"
  } else if (lower.includes("dashboard") || lower.includes("home")) {
    navigateTo = "/dashboard"
  }

  return {
    response:
      "I am seeing unusually high demand from the AI provider right now. I can still help you continue: " +
      "if you tell me whether you want profile edits, recommendations, or applications, I will guide your next step.",
    navigateTo,
  }
}

function extractNavigationPath(text: string): { cleanedText: string; navigateTo: string | null } {
  const match = text.match(/NAVIGATE:\s*(\/[^\s\n]*)/i)
  if (!match) {
    return { cleanedText: text, navigateTo: null }
  }

  const path = match[1]
  const cleanedText = text.replace(match[0], "").trim()
  return { cleanedText, navigateTo: path }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "student") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const message = body?.message
    const conversationHistory = Array.isArray(body?.conversationHistory) ? body.conversationHistory : []

    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        { success: false, error: "AI service is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY." },
        { status: 503 }
      )
    }

    const supabase = await createClient()

    const [{ data: profile }, { data: collegeMatches }, { data: applicationsByStudentId }, { data: notes }] = await Promise.all([
      supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("college_matches")
        .select("*")
        .eq("user_id", user.id)
        .order("match_score", { ascending: false }),
      supabase
        .from("my_college_list")
        .select("*")
        .eq("student_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("student_notes")
        .select("id, type, content, created_at, author, author_id, visible_to_student, parent_note_id, is_reply")
        .eq("student_id", user.id)
        .eq("visible_to_student", true)
        .order("created_at", { ascending: false }),
    ])

    let applications = applicationsByStudentId || []
    if (applications.length === 0) {
      const { data: applicationsByUserId } = await supabase
        .from("my_college_list")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
      applications = applicationsByUserId || []
    }

    const context = {
      studentName: user.full_name,
      studentId: user.id,
      profile: profile || null,
      profileCompletion: profile?.profile_completion ?? 0,
      collegeMatches: collegeMatches || [],
      applications,
      notes: notes || [],
      summary: {
        collegeMatchesCount: (collegeMatches || []).length,
        applicationsCount: applications.length,
        notesCount: (notes || []).length,
      },
    }

    const systemPrompt = `You are an AI Student Assistant for Coaching for College.

You help exactly one student: ${user.full_name} (student_id: ${user.id}).

CRITICAL PRIVACY RULES:
- You can ONLY use this student's data included below.
- Never mention other students.
- Never invent data that is not present.
- If data is missing, clearly say what is missing.

NAVIGATION RULES:
- If the student asks any profile-related question, include ONE line at the end in this exact format:
  NAVIGATE:/dashboard/profile
- If the student asks any college recommendations or matches question, include:
  NAVIGATE:/college-recommendations
- If the student asks any applications question, include:
  NAVIGATE:/college-list
- If the student asks to go to a page/section, include ONE line at the end in this exact format:
  NAVIGATE:/path
- Allowed navigation paths only:
  - /dashboard
  - /dashboard/profile
  - /dashboard/profile#dream-colleges
  - /college-recommendations
  - /college-list
- If no navigation is needed, do not output any NAVIGATE line.

RESPONSE STYLE:
- Keep answers concise and practical.
- Use short sections with bullet points.
- Use **bold** labels where helpful.
- End with 1 short follow-up question when helpful.

STUDENT CONTEXT:
${JSON.stringify(context, null, 2)}`

    const conversationContext = conversationHistory
      .slice(-10)
      .map((msg: ChatMessage) => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
      .join("\n\n")

    const fullPrompt = `${systemPrompt}

${conversationContext ? `RECENT CONVERSATION:\n${conversationContext}\n\n` : ""}STUDENT ASKS: "${message}"

Always add one NAVIGATE line for profile/recommendations/applications questions, even when the student does not explicitly ask to navigate.`

    let result: any
    try {
      result = await generateWithRetry(fullPrompt)
    } catch (error) {
      if (isRetryableGeminiError(error)) {
        const fallback = buildFallbackStudentResponse(message)
        return NextResponse.json({ success: true, response: fallback.response, navigateTo: fallback.navigateTo })
      }
      throw error
    }

    let responseText = ""
    try {
      responseText = result.response.text() ?? ""
    } catch {
      return NextResponse.json(
        { success: false, error: "The AI couldn't produce a reply for this request. Try rephrasing." },
        { status: 500 }
      )
    }

    if (!responseText.trim()) {
      return NextResponse.json({ success: false, error: "The AI returned an empty response. Please try again." }, { status: 500 })
    }

    const { cleanedText, navigateTo } = extractNavigationPath(responseText)
    const inferredNavigateTo = inferAutoNavigationFromMessage(message)
    const finalNavigateTo = navigateTo ?? inferredNavigateTo

    return NextResponse.json({
      success: true,
      response: cleanedText,
      navigateTo: finalNavigateTo,
    })
  } catch (error: any) {
    const msg = error?.message ?? String(error)
    console.error("Error in student AI chat:", msg, error?.stack)

    if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
      return NextResponse.json({ success: false, error: "AI rate limit reached. Please try again shortly." }, { status: 429 })
    }

    return NextResponse.json({ success: false, error: "Failed to generate AI response. Please try again." }, { status: 500 })
  }
}
