"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  formatMilestoneLabel,
  getMilestoneTasks,
  normalizeMilestones,
  type PriorityPlaybookSession,
} from "@/lib/priority-playbook/types"
import { formatMilestoneRangeLabel } from "@/lib/priority-playbook/milestone-dates"
import { EisenhowerMatrixDiagram } from "./eisenhower-matrix-diagram"
import { PlaybookItemSummaryList } from "./playbook-item-summary-list"

export function PlaybookSummaryContent({ session }: { session: PriorityPlaybookSession }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 [&>*]:break-inside-avoid">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Opening Reflection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">2–3 year vision:</span>
            <Badge variant="outline" className="capitalize">
              {session.reflection.visionClarity.rating || "—"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">Has a plan:</span>
            <Badge variant="outline" className="capitalize">
              {session.reflection.planExists.rating || "—"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">Executing satisfactorily:</span>
            <Badge variant="outline" className="capitalize">
              {session.reflection.executingSatisfactorily.rating || "—"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Focus Areas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1">
          {session.focus_areas.filter(Boolean).map((area) => (
            <Badge key={area} variant="secondary">
              {area}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Future Self</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>{session.future_self.narrative || "—"}</p>
          <div>
            <span className="font-medium">Accomplishments: </span>
            {session.future_self.accomplishments.filter(Boolean).join(", ") || "—"}
          </div>
          <div>
            <span className="font-medium">Identity: </span>
            {session.future_self.identityWords.filter(Boolean).join(", ") || "—"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Goals & Milestones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-3">
          {session.goals.map((goal) => (
            <div key={goal.id}>
              <p className="font-medium text-blue-800">{goal.title}</p>
              <div className="mt-2 space-y-2">
                {normalizeMilestones(goal.milestones).map((milestone) => {
                  const tasks = getMilestoneTasks(milestone).filter((task) => task.text.trim())
                  if (!milestone.title.trim() && tasks.length === 0) return null
                  return (
                    <div key={milestone.id}>
                      <p className="text-xs font-medium text-slate-600">
                        {formatMilestoneLabel(milestone) || "Milestone"}
                      </p>
                      {tasks.length > 0 ? (
                        <ul className="mt-1 space-y-0.5 text-xs text-slate-500">
                          {tasks.map((task) => {
                            const dateLabel = formatMilestoneRangeLabel(task.startDate, task.endDate)
                            return (
                              <li key={task.id}>
                                {task.text}
                                {dateLabel ? ` (${dateLabel})` : ""}
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400 mt-0.5">No tasks</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Big Rocks ({session.rock_sort.big_rocks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PlaybookItemSummaryList items={session.rock_sort.big_rocks} goals={session.goals} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Gravel ({session.rock_sort.gravel.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PlaybookItemSummaryList items={session.rock_sort.gravel} goals={session.goals} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sand ({session.rock_sort.sand.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PlaybookItemSummaryList items={session.rock_sort.sand} goals={session.goals} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Eisenhower Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <EisenhowerMatrixDiagram matrix={session.matrix} goals={session.goals} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Matrix Reflection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>
            <span className="font-medium">Thoughts: </span>
            {session.matrix_reflection.thoughts || "—"}
          </p>
          <p>
            <span className="font-medium">Feelings: </span>
            {session.matrix_reflection.feelings || "—"}
          </p>
          <p>
            <span className="font-medium">Where to improve: </span>
            {session.matrix_reflection.improve || "—"}
          </p>
          <p>
            <span className="font-medium">Steps to take now: </span>
            {session.matrix_reflection.stepsNow || "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
