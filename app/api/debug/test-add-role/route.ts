import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { role, organization } = await request.json()

    console.log("Testing add_user_role function with:", { role, organization })

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("Current user:", currentUser.id, currentUser.email)

    const supabase = await createClient()
    
    // Test the RPC function
    const { data, error } = await supabase.rpc('add_user_role', {
      target_role: role,
      org: organization || null
    })

    console.log("RPC result:", { data, error })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      })
    }

    // Check if user_roles was updated
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', currentUser.id)

    console.log("User roles after add:", { userRoles, rolesError })

    return NextResponse.json({ 
      success: true, 
      userRoles 
    })

  } catch (error: any) {
    console.error("Test error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
