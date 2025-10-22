import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function PUT(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { full_name } = await request.json()

    if (!full_name || !full_name.trim()) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update user's full_name
    const { error } = await supabase
      .from("users")
      .update({
        full_name: full_name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentUser.id)

    if (error) {
      console.error("Failed to update user profile:", error)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: "Profile updated successfully"
    })

  } catch (error) {
    console.error("User profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}




