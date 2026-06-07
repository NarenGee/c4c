export type ReflectionRating = "yes" | "somewhat" | "no"

export interface ReflectionAnswer {
  rating: ReflectionRating | ""
  notes?: string
}

export interface PlaybookReflection {
  visionClarity: ReflectionAnswer
  planExists: ReflectionAnswer
  executingSatisfactorily: ReflectionAnswer
}

export interface FutureSelf {
  narrative: string
  accomplishments: string[]
  identityWords: string[]
}

export interface PlaybookGoal {
  id: string
  title: string
  milestones: string[]
  firstMilestoneTasks: string[]
}

export interface PlaybookItem {
  id: string
  text: string
  source?: "goal" | "other"
}

export interface RockSort {
  big_rocks: PlaybookItem[]
  gravel: PlaybookItem[]
  sand: PlaybookItem[]
}

export type QuadrantPriority =
  | "urgent_important"
  | "important_not_urgent"
  | "urgent_not_important"
  | "not_urgent_not_important"

export interface MatrixItem {
  id: string
  text: string
  quadrant: QuadrantPriority | null
}

export interface MatrixReflection {
  thoughts: string
  feelings: string
  improve: string
  stepsNow: string
}

export interface PriorityPlaybookSession {
  id: string
  student_id: string
  status: "in_progress" | "completed"
  current_step: number
  session_number: number
  reflection: PlaybookReflection
  focus_areas: string[]
  future_self: FutureSelf
  goals: PlaybookGoal[]
  other_tasks: PlaybookItem[]
  rock_sort: RockSort
  matrix: MatrixItem[]
  matrix_reflection: MatrixReflection
  synced_to_dashboard_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export const TOTAL_STEPS = 9

export const STEP_TITLES: Record<number, string> = {
  1: "Opening Reflection",
  2: "Life Focus Areas",
  3: "Future Self Visualization",
  4: "Break It Up",
  5: "Everything Else",
  6: "Big Rocks, Gravel & Sand",
  7: "Eisenhower Matrix",
  8: "Matrix Reflection",
  9: "Summary & Complete",
}

export const EMPTY_REFLECTION: PlaybookReflection = {
  visionClarity: { rating: "", notes: "" },
  planExists: { rating: "", notes: "" },
  executingSatisfactorily: { rating: "", notes: "" },
}

export const EMPTY_FUTURE_SELF: FutureSelf = {
  narrative: "",
  accomplishments: [""],
  identityWords: [""],
}

export const EMPTY_ROCK_SORT: RockSort = {
  big_rocks: [],
  gravel: [],
  sand: [],
}

export const EMPTY_MATRIX_REFLECTION: MatrixReflection = {
  thoughts: "",
  feelings: "",
  improve: "",
  stepsNow: "",
}

export function createEmptySession(studentId: string): Omit<PriorityPlaybookSession, "id" | "created_at" | "updated_at"> {
  return {
    student_id: studentId,
    status: "in_progress",
    current_step: 1,
    session_number: 1,
    reflection: EMPTY_REFLECTION,
    focus_areas: [""],
    future_self: EMPTY_FUTURE_SELF,
    goals: [],
    other_tasks: [],
    rock_sort: EMPTY_ROCK_SORT,
    matrix: [],
    matrix_reflection: EMPTY_MATRIX_REFLECTION,
    synced_to_dashboard_at: null,
    completed_at: null,
  }
}

export function normalizeSession(row: Record<string, unknown>): PriorityPlaybookSession {
  return {
    id: row.id as string,
    student_id: row.student_id as string,
    status: row.status as PriorityPlaybookSession["status"],
    current_step: (row.current_step as number) || 1,
    session_number: (row.session_number as number) || 1,
    reflection: (row.reflection as PlaybookReflection) || EMPTY_REFLECTION,
    focus_areas: (row.focus_areas as string[]) || [""],
    future_self: (row.future_self as FutureSelf) || EMPTY_FUTURE_SELF,
    goals: (row.goals as PlaybookGoal[]) || [],
    other_tasks: (row.other_tasks as PlaybookItem[]) || [],
    rock_sort: (row.rock_sort as RockSort) || EMPTY_ROCK_SORT,
    matrix: (row.matrix as MatrixItem[]) || [],
    matrix_reflection: (row.matrix_reflection as MatrixReflection) || EMPTY_MATRIX_REFLECTION,
    synced_to_dashboard_at: (row.synced_to_dashboard_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export function collectInventoryItems(session: Pick<PriorityPlaybookSession, "goals" | "other_tasks">): PlaybookItem[] {
  const items: PlaybookItem[] = []

  for (const goal of session.goals) {
    goal.firstMilestoneTasks.forEach((task, index) => {
      const text = task.trim()
      if (!text) return
      items.push({
        id: `${goal.id}-task-${index}`,
        text,
        source: "goal",
      })
    })
  }

  for (const item of session.other_tasks) {
    const text = item.text.trim()
    if (!text) continue
    items.push({
      id: item.id,
      text,
      source: "other",
    })
  }

  return items
}

export function collectRockSortItems(rockSort: RockSort): PlaybookItem[] {
  return [...rockSort.big_rocks, ...rockSort.gravel, ...rockSort.sand]
}

export function goalsFromAccomplishments(accomplishments: string[]): PlaybookGoal[] {
  return accomplishments
    .map((title) => title.trim())
    .filter(Boolean)
    .map((title) => ({
      id: crypto.randomUUID(),
      title,
      milestones: [""],
      firstMilestoneTasks: [""],
    }))
}
