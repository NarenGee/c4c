import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json({ error: "Not authenticated", authError })
    }

    console.log("Auth user:", authUser.id, authUser.email)

    // Try to fetch user profile with explicit column selection
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        role,
        "current_role",
        created_at,
        updated_at,
        roles:user_roles(*)
      `)
      .eq("id", authUser.id)
      .single()

    console.log("User query result:", { user, userError })

    // Also try with admin client
    const { data: adminUser, error: adminError } = await adminClient
      .from("users")
      .select(`
        id,
        email,
        full_name,
        role,
        "current_role",
        created_at,
        updated_at,
        roles:user_roles(*)
      `)
      .eq("id", authUser.id)
      .single()

    console.log("Admin query result:", { adminUser, adminError })

    // Check what columns actually exist
    const { data: columns } = await adminClient
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "users")
      .eq("table_schema", "public")

    return NextResponse.json({
      authUser: {
        id: authUser.id,
        email: authUser.email,
        metadata: authUser.user_metadata
      },
      regularQuery: { user, userError },
      adminQuery: { adminUser, adminError },
      userTableColumns: columns
    })

  } catch (error: any) {
    console.error("Debug error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 })
  }
}

