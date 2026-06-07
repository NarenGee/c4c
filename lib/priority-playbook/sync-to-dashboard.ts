import type {
  MatrixItem,
  PlaybookItem,
  PriorityPlaybookSession,
  QuadrantPriority,
  RockSort,
} from "./types"
import { collectRockSortItems } from "./types"

export interface DashboardActionInsert {
  content: string
  type: "action"
  action_status: "not_started"
  priority: QuadrantPriority
  visible_to_student: true
  author: string
  author_id: string
}

export function buildDashboardActions(
  session: PriorityPlaybookSession,
  studentName: string,
  studentId: string
): DashboardActionInsert[] {
  const actions: DashboardActionInsert[] = []
  const seen = new Set<string>()

  const addAction = (text: string, priority: QuadrantPriority) => {
    const normalized = text.trim()
    if (!normalized) return
    const key = `${priority}:${normalized.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    actions.push({
      content: `[Priority Playbook] ${normalized}`,
      type: "action",
      action_status: "not_started",
      priority,
      visible_to_student: true,
      author: studentName,
      author_id: studentId,
    })
  }

  for (const item of session.matrix) {
    if (item.quadrant && item.text.trim()) {
      addAction(item.text, item.quadrant)
    }
  }

  const matrixTexts = new Set(
    session.matrix.filter((m) => m.text.trim()).map((m) => m.text.trim().toLowerCase())
  )

  for (const rock of session.rock_sort.big_rocks) {
    if (!matrixTexts.has(rock.text.trim().toLowerCase())) {
      addAction(rock.text, "important_not_urgent")
    }
  }

  return actions
}

/** Normalize playbook action content for cross-session deduplication. */
export function playbookActionKey(content: string): string {
  return content.trim().toLowerCase()
}

export function filterNewDashboardActions(
  actions: DashboardActionInsert[],
  existingContents: string[]
): DashboardActionInsert[] {
  const existing = new Set(existingContents.map(playbookActionKey))
  return actions.filter((action) => !existing.has(playbookActionKey(action.content)))
}

export function initializeMatrixFromRocks(rockSort: RockSort, existing: MatrixItem[]): MatrixItem[] {
  const rockItems = collectRockSortItems(rockSort)
  const byId = new Map(existing.map((item) => [item.id, item]))

  return rockItems.map((item) => {
    const existingItem = byId.get(item.id)
    return {
      id: item.id,
      text: item.text,
      quadrant: existingItem?.quadrant ?? null,
    }
  })
}

export function initializeRockSortFromInventory(
  inventory: PlaybookItem[],
  existing: RockSort
): RockSort {
  const inventoryIds = new Set(inventory.map((item) => item.id))

  const result: RockSort = {
    big_rocks: existing.big_rocks.filter((item) => inventoryIds.has(item.id)),
    gravel: existing.gravel.filter((item) => inventoryIds.has(item.id)),
    sand: existing.sand.filter((item) => inventoryIds.has(item.id)),
  }

  const assignedIds = new Set(collectRockSortItems(result).map((item) => item.id))

  if (assignedIds.size === 0 && inventory.length > 0) {
    return {
      big_rocks: inventory.filter((item) => item.source === "goal"),
      gravel: inventory.filter((item) => item.source === "other"),
      sand: [],
    }
  }

  for (const item of inventory) {
    if (!assignedIds.has(item.id)) {
      result.gravel.push(item)
      assignedIds.add(item.id)
    }
  }

  return result
}
