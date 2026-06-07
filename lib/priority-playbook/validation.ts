import type { PriorityPlaybookSession } from "./types"
import { collectInventoryItems, collectRockSortItems } from "./types"

export function isStepValid(session: PriorityPlaybookSession, step: number): boolean {
  switch (step) {
    case 1: {
      const { reflection } = session
      return (
        !!reflection.visionClarity.rating &&
        !!reflection.planExists.rating &&
        !!reflection.executingSatisfactorily.rating
      )
    }
    case 2:
      return session.focus_areas.some((area) => area.trim().length > 0)
    case 3: {
      const { future_self } = session
      return (
        future_self.narrative.trim().length > 0 &&
        future_self.accomplishments.some((item) => item.trim().length > 0) &&
        future_self.identityWords.some((item) => item.trim().length > 0)
      )
    }
    case 4:
      return (
        session.goals.length > 0 &&
        session.goals.every(
          (goal) =>
            goal.title.trim().length > 0 &&
            goal.milestones.some((m) => m.trim().length > 0) &&
            goal.firstMilestoneTasks.some((t) => t.trim().length > 0)
        )
      )
    case 5:
      return true
    case 6: {
      const inventory = collectInventoryItems(session)
      if (inventory.length === 0) return true
      const sorted = collectRockSortItems(session.rock_sort)
      return sorted.length >= inventory.length
    }
    case 7: {
      const rockItems = collectRockSortItems(session.rock_sort)
      if (rockItems.length === 0) return true
      return session.matrix.filter((item) => item.quadrant).length >= rockItems.length
    }
    case 8: {
      const { matrix_reflection } = session
      return (
        matrix_reflection.thoughts.trim().length > 0 &&
        matrix_reflection.feelings.trim().length > 0 &&
        matrix_reflection.improve.trim().length > 0 &&
        matrix_reflection.stepsNow.trim().length > 0
      )
    }
    case 9:
      return session.status === "completed" || isStepValid(session, 8)
    default:
      return false
  }
}
