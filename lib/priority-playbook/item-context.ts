import type { MatrixItem, PlaybookGoal, PlaybookItem } from "./types"
import { formatMilestoneLabel, getMilestoneTasks, normalizeMilestones } from "./types"

export type PlaybookItemContext = Pick<
  PlaybookItem,
  "source" | "goalTitle" | "milestoneTitle"
>

export function getItemContextLabel(item: PlaybookItemContext): string {
  if (item.source === "other" || item.goalTitle === "Other") return "Other"
  if (item.goalTitle && item.milestoneTitle) {
    return `${item.goalTitle} → ${item.milestoneTitle}`
  }
  if (item.goalTitle) return item.goalTitle
  return "Other"
}

export function enrichPlaybookItem(item: PlaybookItem, goals: PlaybookGoal[]): PlaybookItem {
  if (item.source === "other") {
    return { ...item, goalTitle: "Other" }
  }

  if (item.goalTitle && item.milestoneTitle) {
    return item
  }

  for (const goal of goals) {
    for (const milestone of normalizeMilestones(goal.milestones)) {
      const tasks = getMilestoneTasks(milestone)
      for (let index = 0; index < tasks.length; index++) {
        const milestoneId = milestone.id ?? "milestone"
        const newId = `${goal.id}-${milestoneId}-task-${index}`
        const legacyId = `${goal.id}-task-${index}`
        if (item.id !== newId && item.id !== legacyId) continue

        return {
          ...item,
          source: "goal",
          goalTitle: goal.title.trim(),
          milestoneTitle: formatMilestoneLabel(milestone),
        }
      }
    }
  }

  return item
}

export function enrichPlaybookItems(items: PlaybookItem[], goals: PlaybookGoal[]): PlaybookItem[] {
  return items.map((item) => enrichPlaybookItem(item, goals))
}

export function enrichMatrixItem(item: MatrixItem, goals: PlaybookGoal[]): MatrixItem {
  const enriched = enrichPlaybookItem(
    {
      id: item.id,
      text: item.text,
      source: item.source,
      goalTitle: item.goalTitle,
      milestoneTitle: item.milestoneTitle,
    },
    goals
  )

  return {
    ...item,
    source: enriched.source,
    goalTitle: enriched.goalTitle,
    milestoneTitle: enriched.milestoneTitle,
  }
}

export function enrichMatrixItems(items: MatrixItem[], goals: PlaybookGoal[]): MatrixItem[] {
  return items.map((item) => enrichMatrixItem(item, goals))
}
