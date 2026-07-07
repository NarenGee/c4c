import type { PriorityPlaybookSession } from "./types"
import { collectInventoryItems, collectRockSortItems, goalHasTasks, normalizeMilestones } from "./types"

export function getStepBlockers(session: PriorityPlaybookSession, step: number): string[] {
  const blockers: string[] = []

  switch (step) {
    case 1: {
      const { reflection } = session
      if (!reflection.visionClarity.rating) blockers.push("Answer the 2–3 year vision question.")
      if (!reflection.planExists.rating) blockers.push("Answer whether you have a plan.")
      if (!reflection.executingSatisfactorily.rating) {
        blockers.push("Answer whether you are executing that plan satisfactorily.")
      }
      break
    }
    case 2:
    case 3:
      if (!session.focus_areas.some((area) => area.trim().length > 0)) {
        blockers.push("Add at least one life focus area.")
      }
      break
    case 4: {
      const { future_self } = session
      if (!future_self.narrative.trim()) blockers.push("Describe your ideal future self.")
      if (!future_self.accomplishments.some((item) => item.trim().length > 0)) {
        blockers.push("Add at least one accomplishment.")
      }
      if (!future_self.identityWords.some((item) => item.trim().length > 0)) {
        blockers.push("Add at least one identity word.")
      }
      break
    }
    case 5:
      if (session.goals.length === 0) {
        blockers.push("Add at least one goal to break down.")
        break
      }
      for (const goal of session.goals) {
        if (!goal.title.trim()) blockers.push("Every goal needs a title.")
        if (!normalizeMilestones(goal.milestones).some((m) => m.title.trim())) {
          blockers.push(`Add milestones for "${goal.title || "each goal"}".`)
        }
        if (!goalHasTasks(goal)) {
          blockers.push(`Add tasks for "${goal.title || "each goal"}".`)
        }
      }
      break
    case 7: {
      const inventory = collectInventoryItems(session)
      const sorted = collectRockSortItems(session.rock_sort)
      if (inventory.length > 0 && sorted.length < inventory.length) {
        blockers.push(`Sort every task into Big Rocks, Gravel, or Sand (${sorted.length} of ${inventory.length} sorted).`)
      }
      break
    }
    case 8: {
      const rockItems = collectRockSortItems(session.rock_sort)
      const placed = session.matrix.filter((item) => item.quadrant).length
      if (rockItems.length > 0 && session.matrix.length === 0) {
        blockers.push("Your Eisenhower matrix is still loading — wait a moment.")
      } else if (rockItems.length > 0 && placed < rockItems.length) {
        blockers.push(`Assign every task to a quadrant (${placed} of ${rockItems.length} placed).`)
      }
      break
    }
    case 9: {
      const { matrix_reflection } = session
      if (!matrix_reflection.thoughts.trim()) blockers.push("Share your thoughts.")
      if (!matrix_reflection.feelings.trim()) blockers.push("Share how you feel.")
      if (!matrix_reflection.improve.trim()) blockers.push("Describe where you can improve.")
      if (!matrix_reflection.stepsNow.trim()) blockers.push("List steps you can take now.")
      break
    }
  }

  return blockers
}

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
    case 3:
      return session.focus_areas.some((area) => area.trim().length > 0)
    case 4: {
      const { future_self } = session
      return (
        future_self.narrative.trim().length > 0 &&
        future_self.accomplishments.some((item) => item.trim().length > 0) &&
        future_self.identityWords.some((item) => item.trim().length > 0)
      )
    }
    case 5:
      return (
        session.goals.length > 0 &&
        session.goals.every(
          (goal) =>
            goal.title.trim().length > 0 &&
            normalizeMilestones(goal.milestones).some((m) => m.title.trim().length > 0) &&
            goalHasTasks(goal)
        )
      )
    case 6:
      return true
    case 7: {
      const inventory = collectInventoryItems(session)
      if (inventory.length === 0) return true
      const sorted = collectRockSortItems(session.rock_sort)
      return sorted.length >= inventory.length
    }
    case 8: {
      const rockItems = collectRockSortItems(session.rock_sort)
      if (rockItems.length === 0) return true
      return session.matrix.filter((item) => item.quadrant).length >= rockItems.length
    }
    case 9: {
      const { matrix_reflection } = session
      return (
        matrix_reflection.thoughts.trim().length > 0 &&
        matrix_reflection.feelings.trim().length > 0 &&
        matrix_reflection.improve.trim().length > 0 &&
        matrix_reflection.stepsNow.trim().length > 0
      )
    }
    case 10:
      return session.status === "completed" || isStepValid(session, 9)
    default:
      return false
  }
}
