import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST() {
  try {
    const adminClient = createAdminClient()
    
    console.log("Setting up email confirmation tokens table...")
    
    // Try to create the table by attempting to insert a test record
    // This will fail if the table doesn't exist, but we can catch the error
    const { data: testData, error: testError } = await adminClient
      .from("email_confirmation_tokens")
      .select("*")
      .limit(1)

    if (testError && testError.message.includes("does not exist")) {
      return NextResponse.json({ 
        success: false, 
        error: "Email confirmation tokens table does not exist. Please run the database migration script manually in your Supabase dashboard.",
        details: "The table needs to be created using the script: scripts/21-create-email-confirmation-tokens.sql"
      })
    }

    if (testError) {
      return NextResponse.json({ 
        success: false, 
        error: `Table access error: ${testError.message}` 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email confirmation tokens table exists and is accessible",
      testResult: testData
    })

  } catch (error: any) {
    console.error("Setup error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
} 