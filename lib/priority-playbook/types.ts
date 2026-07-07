import { formatMilestoneRangeLabel } from "./milestone-dates"
import { normalizeMilestoneStatus, type MilestoneStatus } from "./milestone-status"

export type { MilestoneStatus } from "./milestone-status"
export {
  computeAutoMilestoneStatus,
  getEffectiveMilestoneStatus,
  getMilestoneStatusOption,
  isGoalComplete,
  isMilestoneStatusManual,
  MILESTONE_STATUS_OPTIONS,
} from "./milestone-status"

export type ReflectionRating = "yes" | "no"

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

export interface PlaybookTask {
  id?: string
  text: string
  startDate?: string
  endDate?: string
}

export interface PlaybookMilestone {
  id?: string
  title: string
  startDate?: string
  endDate?: string
  tasks?: PlaybookTask[]
  status?: MilestoneStatus
  /** When true, status was set manually and won't be overridden by date-based rules. */
  statusManual?: boolean
}

export interface PlaybookGoal {
  id: string
  title: string
  milestones: PlaybookMilestone[]
  firstMilestoneTasks: string[]
}

export const EMPTY_TASK: PlaybookTask = {
  text: "",
  startDate: "",
  endDate: "",
}

export const EMPTY_MILESTONE: PlaybookMilestone = {
  title: "",
  startDate: "",
  endDate: "",
  tasks: [EMPTY_TASK],
  status: "not_started",
}

export function createTask(overrides: Partial<PlaybookTask> = {}): PlaybookTask {
  return {
    id: crypto.randomUUID(),
    text: "",
    startDate: "",
    endDate: "",
    ...overrides,
  }
}

export function createMilestone(overrides: Partial<PlaybookMilestone> = {}): PlaybookMilestone {
  return {
    id: crypto.randomUUID(),
    title: "",
    startDate: "",
    endDate: "",
    tasks: [createTask()],
    status: "not_started",
    ...overrides,
  }
}

export function createEmptyGoal(title = ""): PlaybookGoal {
  const milestone = createMilestone()
  return {
    id: crypto.randomUUID(),
    title,
    milestones: [milestone],
    firstMilestoneTasks: [""],
  }
}

export function normalizeTask(entry: unknown): PlaybookTask {
  if (typeof entry === "string") {
    return createTask({ text: entry })
  }
  if (entry && typeof entry === "object") {
    const raw = entry as PlaybookTask
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : crypto.randomUUID(),
      text: typeof raw.text === "string" ? raw.text : "",
      startDate: typeof raw.startDate === "string" ? raw.startDate : "",
      endDate: typeof raw.endDate === "string" ? raw.endDate : "",
    }
  }
  return createTask()
}

export function normalizeMilestone(entry: unknown): PlaybookMilestone {
  if (typeof entry === "string") {
    return createMilestone({ title: entry })
  }
  if (entry && typeof entry === "object" && "title" in entry) {
    const raw = entry as PlaybookMilestone & { targetDate?: string }
    const legacyEnd = typeof raw.targetDate === "string" ? raw.targetDate : ""
    const tasks = Array.isArray(raw.tasks)
      ? raw.tasks.map(normalizeTask)
      : undefined
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : crypto.randomUUID(),
      title: typeof raw.title === "string" ? raw.title : "",
      startDate: typeof raw.startDate === "string" ? raw.startDate : "",
      endDate: typeof raw.endDate === "string" ? raw.endDate : legacyEnd,
      tasks: tasks && tasks.length > 0 ? tasks : [createTask()],
      status: normalizeMilestoneStatus(raw.status),
      statusManual: raw.statusManual === true,
    }
  }
  return createMilestone()
}

export function normalizeMilestones(entries: unknown): PlaybookMilestone[] {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [{ ...EMPTY_MILESTONE }]
  }
  return entries.map(normalizeMilestone)
}

export function getMilestoneTasks(milestone: PlaybookMilestone): PlaybookTask[] {
  if (Array.isArray(milestone.tasks) && milestone.tasks.length > 0) {
    return milestone.tasks.map(normalizeTask)
  }
  return [createTask()]
}

export function goalHasTasks(goal: PlaybookGoal): boolean {
  return normalizeMilestones(goal.milestones).some((milestone) =>
    getMilestoneTasks(milestone).some((task) => task.text.trim())
  )
}

export function normalizeGoal(goal: PlaybookGoal): PlaybookGoal {
  let milestones = normalizeMilestones(goal.milestones).map((milestone) => ({
    ...milestone,
    tasks: getMilestoneTasks(milestone),
  }))

  if (
    milestones[0] &&
    !milestones[0].tasks.some((task) => task.text.trim()) &&
    goal.firstMilestoneTasks?.some((task) => task.trim())
  ) {
    milestones[0] = {
      ...milestones[0],
      tasks: goal.firstMilestoneTasks.map((text) => createTask({ text })),
    }
  }

  const firstMilestoneTasks = milestones[0]?.tasks.map((task) => task.text) ?? [""]

  return {
    ...goal,
    milestones,
    firstMilestoneTasks,
  }
}

export function formatMilestoneLabel(milestone: PlaybookMilestone): string {
  const title = milestone.title.trim()
  if (!title) return ""

  const dateLabel = formatMilestoneRangeLabel(milestone.startDate, milestone.endDate)
  if (!dateLabel) return title

  return `${title} (${dateLabel})`
}

export function getFirstMilestoneLabel(goal: PlaybookGoal): string {
  const first = normalizeMilestones(goal.milestones).find((m) => m.title.trim())
  return first ? formatMilestoneLabel(first) : ""
}

export interface PlaybookItem {
  id: string
  text: string
  source?: "goal" | "other"
  goalTitle?: string
  milestoneTitle?: string
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
  source?: "goal" | "other"
  goalTitle?: string
  milestoneTitle?: string
}

export interface MatrixReflection {
  thoughts: string
  feelings: string
  improve: string
  stepsNow: string
  /** Stored in JSON when DB only allows current_step <= 9 */
  reviewStarted?: boolean
}

/** Max step index persisted while DB constraint is still <= 9 */
export const PERSISTED_MAX_STEP = 9

export function getDisplayStep(session: PriorityPlaybookSession): number {
  if (session.status === "completed") return TOTAL_STEPS
  if (session.current_step >= PERSISTED_MAX_STEP && session.matrix_reflection.reviewStarted) {
    return TOTAL_STEPS
  }
  return session.current_step
}

export function persistPlaybookSession(session: PriorityPlaybookSession): PriorityPlaybookSession {
  const displayStep = getDisplayStep(session)
  return {
    ...session,
    current_step: Math.min(displayStep, PERSISTED_MAX_STEP),
  }
}

export function withDisplayStep(
  session: PriorityPlaybookSession,
  displayStep: number
): PriorityPlaybookSession {
  return {
    ...session,
    current_step: Math.min(displayStep, PERSISTED_MAX_STEP),
    matrix_reflection: {
      ...session.matrix_reflection,
      reviewStarted: displayStep >= TOTAL_STEPS,
    },
  }
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

export const TOTAL_STEPS = 10

export const STEP_TITLES: Record<number, string> = {
  1: "Opening Reflection",
  2: "Life Focus Areas",
  3: "Future Self Visualization",
  4: "Write Your Future Self",
  5: "Break It Up",
  6: "Everything Else",
  7: "Big Rocks, Gravel & Sand",
  8: "Eisenhower Matrix",
  9: "Matrix Reflection",
  10: "Summary & Complete",
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
    goals: Array.isArray(row.goals)
      ? (row.goals as PlaybookGoal[]).map(normalizeGoal)
      : [],
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
    const normalized = normalizeGoal(goal)
    for (const milestone of normalizeMilestones(normalized.milestones)) {
      const milestoneLabel = formatMilestoneLabel(milestone)
      getMilestoneTasks(milestone).forEach((task, index) => {
        const text = task.text.trim()
        if (!text) return
        items.push({
          id: `${goal.id}-${milestone.id}-task-${index}`,
          text,
          source: "goal",
          goalTitle: goal.title.trim(),
          milestoneTitle: milestoneLabel,
        })
      })
    }
  }

  for (const item of session.other_tasks) {
    const text = item.text.trim()
    if (!text) continue
    items.push({
      id: item.id,
      text,
      source: "other",
      goalTitle: "Other",
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
      milestones: [createMilestone()],
      firstMilestoneTasks: [""],
    }))
}
