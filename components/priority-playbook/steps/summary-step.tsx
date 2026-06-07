"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, ChevronLeft } from "lucide-react"
import type { PriorityPlaybookSession } from "@/lib/priority-playbook/types"
import { EisenhowerMatrixDiagram } from "../eisenhower-matrix-diagram"

interface SummaryStepProps {
  session: PriorityPlaybookSession
  onComplete: () => void
  completing: boolean
  completed: boolean
  actionsCreated?: number
}

function PlaybookSummaryContent({ session }: { session: PriorityPlaybookSession }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Badge key={area} variant="secondary">{area}</Badge>
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
              <p className="text-xs text-slate-500 mt-1">
                Milestones: {goal.milestones.filter(Boolean).join(", ") || "—"}
              </p>
              <p className="text-xs text-slate-500">
                First milestone tasks: {goal.firstMilestoneTasks.filter(Boolean).join(", ") || "—"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Big Rocks ({session.rock_sort.big_rocks.length})</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          {session.rock_sort.big_rocks.map((i) => i.text).join(", ") || "—"}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Eisenhower Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <EisenhowerMatrixDiagram matrix={session.matrix} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Matrix Reflection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p><span className="font-medium">Thoughts: </span>{session.matrix_reflection.thoughts || "—"}</p>
          <p><span className="font-medium">Feelings: </span>{session.matrix_reflection.feelings || "—"}</p>
          <p><span className="font-medium">Where to improve: </span>{session.matrix_reflection.improve || "—"}</p>
          <p><span className="font-medium">Steps to take now: </span>{session.matrix_reflection.stepsNow || "—"}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function SummaryStep({
  session,
  onComplete,
  completing,
  completed,
  actionsCreated = 0,
}: SummaryStepProps) {
  const [showFullSummary, setShowFullSummary] = useState(false)

  if (completed && !showFullSummary) {
    return (
      <div className="text-center space-y-6 py-8">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Priority Playbook Complete!</h2>
        <p className="text-slate-600 max-w-lg mx-auto">
          {actionsCreated > 0
            ? `${actionsCreated} prioritized action${actionsCreated === 1 ? "" : "s"} have been added to your dashboard.`
            : "Your playbook has been saved."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/dashboard">
            <Button className="gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowFullSummary(true)}>
            View Summary
          </Button>
        </div>
      </div>
    )
  }

  if (completed && showFullSummary) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Your Priority Playbook Summary</h2>
            <p className="text-slate-600 text-sm mt-1">Read-only review of your completed workshop.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFullSummary(false)} className="gap-1 self-start">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <PlaybookSummaryContent session={session} />
        <div className="flex justify-center pt-2">
          <Link href="/dashboard">
            <Button className="gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800">Review Your Priority Playbook</h2>
        <p className="text-slate-600 text-sm mt-1">
          Confirm everything looks right, then complete to sync your prioritized actions to the dashboard.
        </p>
      </div>

      <PlaybookSummaryContent session={session} />

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onComplete} disabled={completing} className="gap-2">
          {completing ? "Completing..." : "Complete Playbook & Sync to Dashboard"}
          <CheckCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
