import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  eachMonthOfInterval,
  endOfMonth,
  format,
  max,
  min,
  startOfMonth,
  startOfToday,
} from "date-fns"
import { parseMilestoneDate, toMilestoneDateString } from "./milestone-dates"
import { getEffectiveMilestoneStatus } from "./milestone-status"
import type { MilestoneStatus } from "./milestone-status"
import type { PlaybookGoal, PlaybookMilestone } from "./types"
import { normalizeGoal, normalizeMilestones } from "./types"

export interface TimelineRange {
  start: Date
  end: Date
  totalDays: number
}

export interface MilestoneBar {
  goalId: string
  milestoneId: string
  title: string
  status: MilestoneStatus
  start: Date
  end: Date
  leftPercent: number
  widthPercent: number
  hasExplicitDates: boolean
}

/** Hex colors so milestone bars render without relying on Tailwind scanning lib/. */
export const GOAL_SWIMLANE_COLORS = [
  { bar: "#3b82f6", barHover: "#2563eb", ring: "#93c5fd", label: "#1e40af" },
  { bar: "#8b5cf6", barHover: "#7c3aed", ring: "#c4b5fd", label: "#5b21b6" },
  { bar: "#10b981", barHover: "#059669", ring: "#6ee7b7", label: "#047857" },
  { bar: "#f59e0b", barHover: "#d97706", ring: "#fcd34d", label: "#b45309" },
  { bar: "#f43f5e", barHover: "#e11d48", ring: "#fda4af", label: "#be123c" },
  { bar: "#06b6d4", barHover: "#0891b2", ring: "#67e8f9", label: "#0e7490" },
] as const

export function getGoalSwimlaneColor(goalIndex: number) {
  return GOAL_SWIMLANE_COLORS[goalIndex % GOAL_SWIMLANE_COLORS.length]
}

function hasExplicitMilestoneDates(milestone: PlaybookMilestone): boolean {
  return Boolean(milestone.startDate?.trim() || milestone.endDate?.trim())
}

export function getMilestoneDisplayDates(
  milestone: PlaybookMilestone,
  milestoneIndex: number,
  fallbackStart: Date
): { start: Date; end: Date; hasExplicitDates: boolean } {
  const start = parseMilestoneDate(milestone.startDate)
  const end = parseMilestoneDate(milestone.endDate)

  if (start && end) {
    return {
      start: start <= end ? start : end,
      end: end >= start ? end : start,
      hasExplicitDates: true,
    }
  }

  if (start) {
    return { start, end: addWeeks(start, 2), hasExplicitDates: true }
  }

  if (end) {
    return { start: addWeeks(end, -2), end, hasExplicitDates: true }
  }

  const defaultStart = addWeeks(fallbackStart, milestoneIndex * 3)
  return {
    start: defaultStart,
    end: addWeeks(defaultStart, 2),
    hasExplicitDates: false,
  }
}

export function computeTimelineRange(goals: PlaybookGoal[]): TimelineRange {
  const today = startOfToday()
  let minDate = addMonths(today, -1)
  let maxDate = addMonths(today, 5)
  let foundDates = false

  for (const goal of goals) {
    const normalized = normalizeGoal(goal)
    const milestones = normalizeMilestones(normalized.milestones).filter((m) => m.title.trim())

    milestones.forEach((milestone, index) => {
      const { start, end } = getMilestoneDisplayDates(milestone, index, today)
      if (hasExplicitMilestoneDates(milestone) || milestone.title.trim()) {
        if (!foundDates || start < minDate) minDate = start
        if (!foundDates || end > maxDate) maxDate = end
        foundDates = true
      }
    })
  }

  if (!foundDates) {
    return {
      start: minDate,
      end: maxDate,
      totalDays: Math.max(differenceInCalendarDays(maxDate, minDate), 1),
    }
  }

  const paddedStart = addDays(startOfMonth(minDate), -7)
  const paddedEnd = addDays(addMonths(startOfMonth(maxDate), 1), -1)

  return {
    start: paddedStart,
    end: paddedEnd,
    totalDays: Math.max(differenceInCalendarDays(paddedEnd, paddedStart), 1),
  }
}

export function dateToTimelinePercent(date: Date, range: TimelineRange): number {
  const offset = differenceInCalendarDays(date, range.start)
  return Math.min(100, Math.max(0, (offset / range.totalDays) * 100))
}

export function buildMilestoneBars(goals: PlaybookGoal[], range: TimelineRange): MilestoneBar[] {
  const bars: MilestoneBar[] = []
  const today = startOfToday()

  goals.forEach((goal, goalIndex) => {
    const normalized = normalizeGoal(goal)
    const milestones = normalizeMilestones(normalized.milestones).filter((m) => m.title.trim())
    const goalFallbackStart = addWeeks(today, goalIndex * 2)

    milestones.forEach((milestone, index) => {
      const { start, end, hasExplicitDates } = getMilestoneDisplayDates(
        milestone,
        index,
        goalFallbackStart
      )
      const leftPercent = dateToTimelinePercent(start, range)
      const rightPercent = dateToTimelinePercent(end, range)
      const widthPercent = Math.max(rightPercent - leftPercent, 4)

      bars.push({
        goalId: normalized.id,
        milestoneId: milestone.id!,
        title: milestone.title.trim(),
        status: getEffectiveMilestoneStatus(milestone),
        start,
        end,
        leftPercent,
        widthPercent,
        hasExplicitDates,
      })
    })
  })

  return bars
}

export interface MilestoneBarWithLane extends MilestoneBar {
  lane: number
  laneCount: number
}

/** Assign vertical lanes when milestone bars overlap within the same goal row. */
export function assignBarLanes(bars: MilestoneBar[]): MilestoneBarWithLane[] {
  const byGoal = new Map<string, MilestoneBar[]>()
  for (const bar of bars) {
    const group = byGoal.get(bar.goalId) ?? []
    group.push(bar)
    byGoal.set(bar.goalId, group)
  }

  const result: MilestoneBarWithLane[] = []

  for (const group of byGoal.values()) {
    const sorted = [...group].sort((a, b) => a.leftPercent - b.leftPercent)
    const laneEnds: number[] = []
    const laneByMilestone = new Map<string, number>()

    for (const bar of sorted) {
      const start = bar.leftPercent
      const end = bar.leftPercent + bar.widthPercent
      let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start + 0.5)

      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(end)
      } else {
        laneEnds[lane] = end
      }

      laneByMilestone.set(bar.milestoneId, lane)
    }

    const laneCount = Math.max(laneEnds.length, 1)
    for (const bar of group) {
      result.push({
        ...bar,
        lane: laneByMilestone.get(bar.milestoneId) ?? 0,
        laneCount,
      })
    }
  }

  return result
}

export const MONTH_COLUMN_MIN_WIDTH_PX = 96
export const GOAL_COLUMN_MIN_WIDTH_PX = 220
export const TIMELINE_MIN_WIDTH_PX = 560

export function getTimelineWidthPx(monthCount: number): number {
  return Math.max(monthCount * MONTH_COLUMN_MIN_WIDTH_PX, TIMELINE_MIN_WIDTH_PX)
}

export function getTimelineMonths(range: TimelineRange): Date[] {
  return eachMonthOfInterval({ start: range.start, end: range.end })
}

export interface TimelineMonthSpan {
  month: Date
  widthPercent: number
}

export function getTimelineMonthSpans(range: TimelineRange): TimelineMonthSpan[] {
  const months = getTimelineMonths(range)

  return months.map((month) => {
    const spanStart = max([startOfMonth(month), range.start])
    const spanEnd = min([endOfMonth(month), range.end])
    const days = Math.max(differenceInCalendarDays(spanEnd, spanStart) + 1, 1)

    return {
      month,
      widthPercent: (days / range.totalDays) * 100,
    }
  })
}

export function formatTimelineMonth(date: Date): string {
  return format(date, "MMM yyyy")
}

export function formatBarDateRange(start: Date, end: Date): string {
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
}

export function applyMilestoneDateRange(
  milestone: PlaybookMilestone,
  start: Date,
  end: Date
): PlaybookMilestone {
  const orderedStart = start <= end ? start : end
  const orderedEnd = end >= start ? end : start

  return {
    ...milestone,
    startDate: toMilestoneDateString(orderedStart),
    endDate: toMilestoneDateString(orderedEnd),
  }
}
