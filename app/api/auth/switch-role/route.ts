import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import type { UserRoleType } from "@/lib/auth"

interface SwitchRoleRequest {
  role: UserRoleType
}

export async function POST(request: NextRequest) {
  try {
    const { role }: SwitchRoleRequest = await request.json()

    // Validate input
    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role is required" },
        { status: 400 }
      )
    }

    const validRoles: UserRoleType[] = ['student', 'parent', 'counselor', 'coach', 'super_admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Use the database function to switch roles
    const supabase = await createClient()
    const { error: switchError } = await supabase.rpc('switch_user_role', {
      target_role: role
    })

    if (switchError) {
      console.error("Failed to switch role:", switchError)
      return NextResponse.json(
        { success: false, error: `Failed to switch role: ${switchError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully switched to ${role} role`
    })

  } catch (error) {
    console.error("Switch role error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
