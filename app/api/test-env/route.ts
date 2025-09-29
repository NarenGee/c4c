import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set",
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "Set" : "Not set",
      FROM_EMAIL: process.env.FROM_EMAIL ? "Set" : "Not set",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? "Set" : "Not set",
      NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "Set" : "Not set",
    }

    return NextResponse.json({ 
      success: true, 
      environment: process.env.NODE_ENV,
      envVars 
    })

  } catch (error: any) {
    console.error("Environment test error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to check environment variables"
    }, { status: 500 })
  }
} 