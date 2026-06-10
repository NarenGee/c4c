"use client"

import { FacilitatorPanel } from "../facilitator-panel"
import { DynamicStringList } from "../dynamic-string-list"
import { MilestoneList } from "../milestone-list"
import type { PlaybookGoal } from "@/lib/priority-playbook/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GoalsBreakdownStepProps {
  goals: PlaybookGoal[]
  onChange: (goals: PlaybookGoal[]) => void
}

export function GoalsBreakdownStep({ goals, onChange }: GoalsBreakdownStepProps) {
  const updateGoal = (index: number, patch: Partial<PlaybookGoal>) => {
    const next = [...goals]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  if (goals.length === 0) {
    return (
      <div className="rounded-xl border bg-amber-50 p-6 text-center text-amber-800">
        Add at least one accomplishment in the Future Self step, then return here to break down your goals.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FacilitatorPanel
        title="Break It Up"
        description="Identify key milestones that helped your future self achieve each goal, then list the tasks needed to reach the first milestone."
        prompt="For each accomplishment, write milestones and the specific tasks to reach your first milestone."
      />
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <Card key={goal.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-800">{goal.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MilestoneList
                label="Key milestones"
                placeholder="A milestone on the way to this goal..."
                values={goal.milestones}
                onChange={(milestones) => updateGoal(index, { milestones })}
              />
              <DynamicStringList
                label="Tasks to reach the first milestone"
                placeholder="A task to complete..."
                values={goal.firstMilestoneTasks}
                onChange={(firstMilestoneTasks) => {
                  const milestones = [...goal.milestones]
                  if (milestones[0]) {
                    milestones[0] = { ...milestones[0], tasks: firstMilestoneTasks }
                  }
                  updateGoal(index, { firstMilestoneTasks, milestones })
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
