import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { hasAccess: false, error: "User ID is required" },
        { status: 400 }
      )
    }

    // Verify the request is from an authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { hasAccess: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Ensure the user is checking their own access (security measure)
    if (user.id !== userId) {
      return NextResponse.json(
        { hasAccess: false, error: "Can only verify own access" },
        { status: 403 }
      )
    }

    // Use admin client to check super admin role (bypasses RLS)
    const adminClient = createAdminClient()
    
    const { data: userRoles, error: roleError } = await adminClient
      .from("user_roles")
      .select("role, is_active")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .eq("is_active", true)

    if (roleError) {
      console.error("Error checking super admin role:", roleError)
      return NextResponse.json(
        { hasAccess: false, error: "Failed to verify admin privileges" },
        { status: 500 }
      )
    }

    const hasAccess = userRoles && userRoles.length > 0

    return NextResponse.json({
      hasAccess,
      message: hasAccess ? "Super admin access confirmed" : "No super admin access found"
    })

  } catch (error: any) {
    console.error("Verify super admin error:", error)
    return NextResponse.json(
      { hasAccess: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}














