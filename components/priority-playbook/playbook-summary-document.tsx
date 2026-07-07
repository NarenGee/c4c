"use client"

import type { PlaybookGoal, PriorityPlaybookSession } from "@/lib/priority-playbook/types"
import { PlaybookGanttChart } from "./playbook-gantt-chart"
import { PlaybookSummaryContent } from "./playbook-summary-content"

interface PlaybookSummaryDocumentProps {
  session: PriorityPlaybookSession
  studentName: string
  onGoalsChange?: (goals: PlaybookGoal[]) => void
  captureMode?: boolean
}

export function PlaybookSummaryPdfHeader({ studentName }: { studentName: string }) {
  return (
    <div className="border-b border-slate-200 pb-5 mb-2">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
        Priority Playbook Summary
      </p>
      <h1 className="text-2xl font-bold text-slate-800">{studentName.trim() || "Student"}</h1>
    </div>
  )
}

export function PlaybookSummaryDocument({
  session,
  studentName,
  onGoalsChange,
  captureMode = false,
}: PlaybookSummaryDocumentProps) {
  return (
    <div className="space-y-6 bg-white">
      {captureMode && <PlaybookSummaryPdfHeader studentName={studentName} />}
      <PlaybookGanttChart
        goals={session.goals}
        onChange={captureMode ? undefined : onGoalsChange}
        readOnly={captureMode}
      />
      <PlaybookSummaryContent session={session} />
    </div>
  )
}
