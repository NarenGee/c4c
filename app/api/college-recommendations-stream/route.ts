import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { profile } = await request.json()

    if (!profile) {
      return NextResponse.json({ error: "Missing profile data" }, { status: 400 })
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        try {
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Starting recommendations generation...' })}\n\n`))
          
          const serviceSupabase = createServiceClient()
          
          // Clear existing recommendations
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Clearing existing recommendations...' })}\n\n`))
          
          await serviceSupabase
            .from("college_matches")
            .delete()
            .eq("student_id", user.id)
            .eq("is_dream_college", false)
          
          // Generate AI recommendations with streaming updates
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Generating AI recommendations...' })}\n\n`))
          
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)
          const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: {
              temperature: 0.3,
              topP: 0.8,
              topK: 20,
              maxOutputTokens: 12000, // Reduced for streaming
            },
          })
          
          const prompt = `Generate 10-12 college recommendations for this student:
          
PROFILE: Grade ${profile.gradeLevel || "N/A"} | ${profile.countryOfResidence || "N/A"} | Major: ${Array.isArray(profile.intended_majors) ? profile.intended_majors.join(", ") : profile.intended_majors || "N/A"}
ACADEMICS: GPA ${profile.gpa || "N/A"} | SAT ${profile.sat_score || "N/A"} | ACT ${profile.act_score || "N/A"}
PREFERENCES: ${profile.collegeSize || "Any"} size | ${profile.campusSetting || "Any"} setting | ${profile.budget_range || "Any"} cost
LOCATION: ${profile.preferred_countries?.join(", ") || "Any country"}

Return ONLY valid JSON array with this structure:
[
  {
    "college_name": "University Name",
    "city": "City Name", 
    "country": "Country",
    "match_score": 0.85,
    "admission_chance": 0.75,
    "fit_category": "Target",
    "justification": "Why this college matches your profile",
    "program_type": "Public Research University",
    "estimated_cost": "$45,000/year",
    "tuition_annual": "$32,000",
    "acceptance_rate": 0.65,
    "student_count": 25000,
    "campus_setting": "Urban",
    "admission_requirements": "SAT: 1200-1400, GPA: 3.5+",
    "website_url": "https://www.university.edu",
    "match_reasons": ["Strong program in your major", "Good financial aid"]
  }
]`

          const result = await model.generateContent(prompt)
          const response = await result.response
          const text = response.text()
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Processing AI response...' })}\n\n`))
          
          // Parse and validate recommendations
          let recommendations: any[]
          try {
            let cleanedText = text.trim()
            cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '')
            cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '')
            
            const startIndex = cleanedText.indexOf('[')
            const lastIndex = cleanedText.lastIndexOf(']')
            
            if (startIndex !== -1 && lastIndex !== -1) {
              let jsonString = cleanedText.substring(startIndex, lastIndex + 1)
              jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1')
              recommendations = JSON.parse(jsonString)
            } else {
              throw new Error("No valid JSON array found")
            }
          } catch (parseError) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to parse AI response' })}\n\n`))
            controller.close()
            return
          }
          
          // Validate and clean recommendations
          const validRecommendations = recommendations
            .filter((rec) => rec.college_name && rec.fit_category)
            .map((rec) => ({
              ...rec,
              student_id: user.id,
              is_dream_college: false,
              match_score: Math.min(Math.max(rec.match_score || 0.5, 0), 0.99),
              admission_chance: Math.min(Math.max(rec.admission_chance || 0.5, 0), 0.999),
              acceptance_rate: rec.acceptance_rate ? Math.min(Math.max(rec.acceptance_rate, 0), 0.999) : null
            }))
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: `Found ${validRecommendations.length} valid recommendations` })}\n\n`))
          
          // Insert recommendations in batches for progress updates
          const batchSize = 5
          for (let i = 0; i < validRecommendations.length; i += batchSize) {
            const batch = validRecommendations.slice(i, i + batchSize)
            
            await serviceSupabase
              .from("college_matches")
              .insert(batch)
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              current: i + batch.length, 
              total: validRecommendations.length,
              message: `Saved ${i + batch.length}/${validRecommendations.length} recommendations`
            })}\n\n`))
          }
          
          // Send completion
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            message: 'Recommendations generated successfully',
            count: validRecommendations.length
          })}\n\n`))
          
        } catch (error) {
          console.error("Streaming error:", error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          })}\n\n`))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
    
  } catch (error) {
    console.error("Error in streaming college recommendations:", error)
    return NextResponse.json(
      { error: "Failed to start streaming recommendations" },
      { status: 500 }
    )
  }
}

