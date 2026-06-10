import { startOfToday } from "date-fns"
import { parseMilestoneDate } from "./milestone-dates"
import type { PlaybookGoal, PlaybookMilestone } from "./types"

export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "at_risk"
  | "completed"
  | "delayed"

export interface MilestoneStatusOption {
  value: MilestoneStatus
  label: string
  color: string
  ring: string
}

export const MILESTONE_STATUS_OPTIONS: MilestoneStatusOption[] = [
  { value: "not_started", label: "Not started", color: "#94a3b8", ring: "#cbd5e1" },
  { value: "in_progress", label: "In progress", color: "#3b82f6", ring: "#93c5fd" },
  { value: "at_risk", label: "At risk", color: "#f59e0b", ring: "#fcd34d" },
  { value: "completed", label: "Completed", color: "#22c55e", ring: "#86efac" },
  { value: "delayed", label: "Delayed", color: "#ef4444", ring: "#fca5a5" },
]

const STATUS_SET = new Set<MilestoneStatus>(MILESTONE_STATUS_OPTIONS.map((option) => option.value))

export function normalizeMilestoneStatus(value: unknown): MilestoneStatus {
  if (typeof value === "string" && STATUS_SET.has(value as MilestoneStatus)) {
    return value as MilestoneStatus
  }
  return "not_started"
}

export function getMilestoneStatusOption(status: MilestoneStatus): MilestoneStatusOption {
  return (
    MILESTONE_STATUS_OPTIONS.find((option) => option.value === status) ?? MILESTONE_STATUS_OPTIONS[0]
  )
}

/**
 * Derive status from milestone dates. Never auto-sets at_risk or completed —
 * those are manual labels only.
 */
export function computeAutoMilestoneStatus(milestone: PlaybookMilestone): MilestoneStatus {
  const today = startOfToday()
  const start = parseMilestoneDate(milestone.startDate)
  const end = parseMilestoneDate(milestone.endDate)

  if (end && today > end) {
    return "delayed"
  }

  if (start && today < start) {
    return "not_started"
  }

  if (start && today >= start) {
    return "in_progress"
  }

  if (end && !start) {
    return "in_progress"
  }

  return "not_started"
}

export function getEffectiveMilestoneStatus(milestone: PlaybookMilestone): MilestoneStatus {
  if (milestone.statusManual) {
    return normalizeMilestoneStatus(milestone.status)
  }
  return computeAutoMilestoneStatus(milestone)
}

export function isMilestoneStatusManual(milestone: PlaybookMilestone): boolean {
  return milestone.statusManual === true
}

export function getActiveMilestones(goal: PlaybookGoal): PlaybookMilestone[] {
  if (!Array.isArray(goal.milestones)) return []
  return goal.milestones.filter(
    (milestone) => typeof milestone.title === "string" && milestone.title.trim().length > 0
  )
}

export function isGoalComplete(goal: PlaybookGoal): boolean {
  const milestones = getActiveMilestones(goal)
  if (milestones.length === 0) return false
  return milestones.every((milestone) => getEffectiveMilestoneStatus(milestone) === "completed")
}
