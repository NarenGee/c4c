import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check if user is super admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.current_role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()

    // Get all users with their coach profile info if applicable
    const { data: users, error } = await adminClient
      .from("users")
      .select(`
        id,
        email,
        full_name,
        role,
        "current_role",
        created_at,
        updated_at,
        coach_profiles (
          organization
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch users:", error)
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      )
    }

    // Format the response to include organization info
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      current_role: user.current_role || user.role, // Fallback to role if current_role is null
      created_at: user.created_at,
      updated_at: user.updated_at,
      organization: user.coach_profiles?.[0]?.organization || null,
      is_active: true, // We'll assume all users are active for now
    }))

    return NextResponse.json(formattedUsers)

  } catch (error) {
    console.error("Super admin users error:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is super admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.current_role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const { userId, updates } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Separate organization from other updates
    const { organization, ...userUpdates } = updates

    // Update user
    const { error: userError } = await adminClient
      .from("users")
      .update({
        ...userUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (userError) {
      console.error("Failed to update user:", userError)
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      )
    }

    // Update organization in coach_profiles if provided
    if (organization !== undefined) {
      const { error: profileError } = await adminClient
        .from("coach_profiles")
        .upsert({
          user_id: userId,
          organization: organization || null,
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error("Failed to update coach profile:", profileError)
        // Don't fail the entire request if profile update fails
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Super admin user update error:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is super admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.current_role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized - Super admin access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Delete user (cascade will handle related records)
    const { error } = await adminClient
      .from("users")
      .delete()
      .eq("id", userId)

    if (error) {
      console.error("Failed to delete user:", error)
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Super admin user delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}

