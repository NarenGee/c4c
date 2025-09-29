import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Check specifically for user_relationships table
    const { data: userRelationships, error: userRelError } = await adminClient
      .from("user_relationships")
      .select("*")
      .limit(1)

    // Check specifically for student_links table
    const { data: studentLinks, error: studentLinksError } = await adminClient
      .from("student_links")
      .select("*")
      .limit(1)

    // Check invitation_tokens table structure
    const { data: invitationTokens, error: invitationError } = await adminClient
      .from("invitation_tokens")
      .select("*")
      .limit(1)

    // Check users table
    const { data: users, error: usersError } = await adminClient
      .from("users")
      .select("*")
      .limit(1)

    return NextResponse.json({
      success: true,
      message: "Database schema check",
      tableCheck: {
        userRelationships: {
          exists: !userRelError,
          error: userRelError?.message,
          sample: userRelationships,
          count: userRelationships?.length || 0
        },
        studentLinks: {
          exists: !studentLinksError,
          error: studentLinksError?.message,
          sample: studentLinks,
          count: studentLinks?.length || 0
        },
        invitationTokens: {
          exists: !invitationError,
          error: invitationError?.message,
          sample: invitationTokens,
          count: invitationTokens?.length || 0
        },
        users: {
          exists: !usersError,
          error: usersError?.message,
          sample: users,
          count: users?.length || 0
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 