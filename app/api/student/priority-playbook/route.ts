import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { normalizeSession } from "@/lib/priority-playbook/types"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: inProgress } = await supabase
      .from("priority_playbook_sessions")
      .select("*")
      .eq("student_id", user.id)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: completed } = await supabase
      .from("priority_playbook_sessions")
      .select("id, completed_at, current_step, status")
      .eq("student_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      inProgress: inProgress ? normalizeSession(inProgress) : null,
      completed: completed ?? null,
    })
  } catch (error) {
    console.error("Priority playbook GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("priority_playbook_sessions")
      .update({
        current_step: body.current_step,
        reflection: body.reflection,
        focus_areas: body.focus_areas,
        future_self: body.future_self,
        goals: body.goals,
        other_tasks: body.other_tasks,
        rock_sort: body.rock_sort,
        matrix: body.matrix,
        matrix_reflection: body.matrix_reflection,
      })
      .eq("id", body.id)
      .eq("student_id", user.id)
      .eq("status", "in_progress")
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session: normalizeSession(data) })
  } catch (error) {
    console.error("Priority playbook POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
