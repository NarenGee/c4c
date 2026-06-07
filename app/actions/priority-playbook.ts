"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import {
  type PriorityPlaybookSession,
  normalizeSession,
  createEmptySession,
  collectInventoryItems,
} from "@/lib/priority-playbook/types"
import {
  buildDashboardActions,
  filterNewDashboardActions,
  initializeMatrixFromRocks,
  initializeRockSortFromInventory,
} from "@/lib/priority-playbook/sync-to-dashboard"

async function getNextSessionNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<number> {
  const { data } = await supabase
    .from("priority_playbook_sessions")
    .select("session_number")
    .eq("student_id", studentId)
    .order("session_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.session_number ?? 0) + 1
}

/** Keep only the newest in-progress session; remove duplicate drafts. */
async function dedupeInProgressSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<PriorityPlaybookSession | null> {
  const { data: rows, error } = await supabase
    .from("priority_playbook_sessions")
    .select("*")
    .eq("student_id", studentId)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })

  if (error || !rows?.length) {
    return null
  }

  const [newest, ...orphans] = rows
  if (orphans.length > 0) {
    await supabase
      .from("priority_playbook_sessions")
      .delete()
      .in(
        "id",
        orphans.map((row) => row.id)
      )
  }

  return normalizeSession(newest)
}

export interface PlaybookResult {
  success: boolean
  error?: string
  session?: PriorityPlaybookSession
}

export async function getOrCreateSession(): Promise<PlaybookResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return { success: false, error: "Only students can access the Priority Playbook" }
  }

  const supabase = await createClient()

  const inProgress = await dedupeInProgressSessions(supabase, user.id)
  if (inProgress) {
    return { success: true, session: inProgress }
  }

  const { data: latestCompleted } = await supabase
    .from("priority_playbook_sessions")
    .select("*")
    .eq("student_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestCompleted) {
    return { success: true, session: normalizeSession(latestCompleted) }
  }

  const empty = createEmptySession(user.id)
  const { data: created, error: createError } = await supabase
    .from("priority_playbook_sessions")
    .insert({
      ...empty,
      session_number: await getNextSessionNumber(supabase, user.id),
    })
    .select("*")
    .single()

  if (createError) {
    console.error("Error creating playbook session:", createError)
    return { success: false, error: "Failed to create session" }
  }

  return { success: true, session: normalizeSession(created) }
}

export async function getPlaybookStatus(): Promise<{
  success: boolean
  error?: string
  hasInProgress?: boolean
  hasCompleted?: boolean
  currentStep?: number
  completedAt?: string | null
}> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  const [{ data: inProgress }, { data: completed }] = await Promise.all([
    supabase
      .from("priority_playbook_sessions")
      .select("current_step")
      .eq("student_id", user.id)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("priority_playbook_sessions")
      .select("completed_at")
      .eq("student_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    success: true,
    hasInProgress: !!inProgress,
    hasCompleted: !!completed,
    currentStep: inProgress?.current_step,
    completedAt: completed?.completed_at ?? null,
  }
}

export async function savePlaybookSession(
  session: PriorityPlaybookSession
): Promise<PlaybookResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return { success: false, error: "Unauthorized" }
  }

  if (session.student_id !== user.id) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("priority_playbook_sessions")
    .update({
      current_step: session.current_step,
      reflection: session.reflection,
      focus_areas: session.focus_areas,
      future_self: session.future_self,
      goals: session.goals,
      other_tasks: session.other_tasks,
      rock_sort: session.rock_sort,
      matrix: session.matrix,
      matrix_reflection: session.matrix_reflection,
    })
    .eq("id", session.id)
    .eq("student_id", user.id)
    .eq("status", "in_progress")
    .select("*")
    .single()

  if (error) {
    console.error("Error saving playbook session:", error)
    return { success: false, error: "Failed to save progress" }
  }

  return { success: true, session: normalizeSession(data) }
}

export async function prepareStepData(
  session: PriorityPlaybookSession,
  step: number
): Promise<PlaybookResult> {
  let updated = { ...session }

  if (step === 4 && updated.goals.length === 0) {
    updated.goals = updated.future_self.accomplishments
      .map((title) => title.trim())
      .filter(Boolean)
      .map((title) => ({
        id: crypto.randomUUID(),
        title,
        milestones: [""],
        firstMilestoneTasks: [""],
      }))
  }

  if (step === 6) {
    const inventory = collectInventoryItems(updated)
    updated.rock_sort = initializeRockSortFromInventory(inventory, updated.rock_sort)
  }

  if (step === 7) {
    updated.matrix = initializeMatrixFromRocks(updated.rock_sort, updated.matrix)
  }

  return savePlaybookSession(updated)
}

export async function completePlaybook(sessionId: string): Promise<PlaybookResult & { actionsCreated?: number }> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  const { data: sessionRow, error: fetchError } = await supabase
    .from("priority_playbook_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("student_id", user.id)
    .single()

  if (fetchError || !sessionRow) {
    return { success: false, error: "Session not found" }
  }

  const session = normalizeSession(sessionRow)

  if (session.status === "completed" && session.synced_to_dashboard_at) {
    return { success: true, session, actionsCreated: 0 }
  }

  let actionsCreated = 0

  if (!session.synced_to_dashboard_at) {
    const allActions = buildDashboardActions(session, user.full_name, user.id)

    const { data: existingNotes } = await supabase
      .from("student_notes")
      .select("content")
      .eq("student_id", user.id)
      .eq("type", "action")
      .like("content", "[Priority Playbook]%")

    const actions = filterNewDashboardActions(
      allActions,
      (existingNotes ?? []).map((note) => note.content)
    )

    if (actions.length > 0) {
      const { error: notesError } = await supabase.from("student_notes").insert(
        actions.map((action) => ({
          student_id: user.id,
          content: action.content,
          author: action.author,
          author_id: action.author_id,
          type: action.type,
          action_status: action.action_status,
          priority: action.priority,
          visible_to_student: action.visible_to_student,
        }))
      )

      if (notesError) {
        console.error("Error syncing to dashboard:", notesError)
        return { success: false, error: "Failed to sync actions to dashboard" }
      }

      actionsCreated = actions.length
    }
  }

  const { data: completed, error: updateError } = await supabase
    .from("priority_playbook_sessions")
    .update({
      status: "completed",
      current_step: 9,
      completed_at: new Date().toISOString(),
      synced_to_dashboard_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("student_id", user.id)
    .select("*")
    .single()

  if (updateError) {
    console.error("Error completing playbook:", updateError)
    return { success: false, error: "Failed to complete playbook" }
  }

  return {
    success: true,
    session: normalizeSession(completed),
    actionsCreated,
  }
}

export async function startNewPlaybookSession(): Promise<PlaybookResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== "student") {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  // Discard any abandoned in-progress drafts before starting fresh.
  const { error: deleteError } = await supabase
    .from("priority_playbook_sessions")
    .delete()
    .eq("student_id", user.id)
    .eq("status", "in_progress")

  if (deleteError) {
    console.error("Error clearing in-progress playbooks:", deleteError)
    return { success: false, error: "Failed to start new playbook" }
  }

  const empty = {
    ...createEmptySession(user.id),
    session_number: await getNextSessionNumber(supabase, user.id),
  }

  const { data: created, error } = await supabase
    .from("priority_playbook_sessions")
    .insert(empty)
    .select("*")
    .single()

  if (error) {
    return { success: false, error: "Failed to start new session" }
  }

  return { success: true, session: normalizeSession(created) }
}

export async function getCompletedSessionForCoach(studentId: string): Promise<PlaybookResult> {
  const user = await getCurrentUser()
  if (!user || (user.role !== "coach" && user.role !== "super_admin")) {
    return { success: false, error: "Unauthorized" }
  }

  const supabase = await createClient()

  if (user.role === "coach") {
    const { data: assignment } = await supabase
      .from("coach_student_assignments")
      .select("id")
      .eq("coach_id", user.id)
      .eq("student_id", studentId)
      .eq("is_active", true)
      .maybeSingle()

    if (!assignment) {
      return { success: false, error: "No access to this student" }
    }
  }

  const { data, error } = await supabase
    .from("priority_playbook_sessions")
    .select("*")
    .eq("student_id", studentId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { success: false, error: "Failed to load playbook" }
  }

  if (!data) {
    return { success: true, session: undefined }
  }

  return { success: true, session: normalizeSession(data) }
}
