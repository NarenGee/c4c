import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    // Get auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Not logged in" },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: user, error: userError } = await adminClient
      .from("users")
      .select("id, email, full_name, role, \"current_role\"")
      .eq("id", authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach or super_admin
    const isAuthorized = user.current_role === 'coach' || 
                        user.current_role === 'super_admin' || 
                        user.role === 'coach' || 
                        user.role === 'super_admin'

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Coach or admin access required" },
        { status: 401 }
      )
    }

    // Parse request body
    const { students } = await request.json()

    if (!students || !Array.isArray(students)) {
      return NextResponse.json(
        { success: false, error: "Invalid data format" },
        { status: 400 }
      )
    }

    // For now, we'll create a simple Excel-compatible CSV with better formatting
    // In the future, this could use a library like 'xlsx' to create true Excel files
    
    const headers = Object.keys(students[0] || {})
    const csvContent = [
      headers.join('\t'), // Use tabs for better Excel compatibility
      ...students.map((row: any) => 
        headers.map(header => {
          const value = row[header]
          return value || ''
        }).join('\t')
      )
    ].join('\n')

    // Create response with Excel MIME type
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="coach-students-${new Date().toISOString().split('T')[0]}.xls"`,
      },
    })

    return response

  } catch (error: any) {
    console.error("Error in Excel export:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}











