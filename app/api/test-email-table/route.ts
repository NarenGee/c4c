import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Check if email_confirmation_tokens table exists
    const { data: emailTokens, error: emailTokensError } = await adminClient
      .from("email_confirmation_tokens")
      .select("*")
      .limit(1)

    return NextResponse.json({
      success: true,
      emailConfirmationTokens: {
        exists: !emailTokensError,
        error: emailTokensError?.message,
        sample: emailTokens,
        count: emailTokens?.length || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 