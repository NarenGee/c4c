"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { PriorityPlaybookSession } from "@/lib/priority-playbook/types"
import { collectRockSortItems } from "@/lib/priority-playbook/types"

interface CoachPlaybookViewProps {
  session: PriorityPlaybookSession
  studentName: string
}

const QUADRANT_LABELS: Record<string, string> = {
  urgent_important: "Q1 — Urgent & Important",
  important_not_urgent: "Q2 — Important, Not Urgent",
  urgent_not_important: "Q3 — Urgent, Not Important",
  not_urgent_not_important: "Q4 — Not Urgent, Not Important",
}

export function CoachPlaybookView({ session, studentName }: CoachPlaybookViewProps) {
  const completedDate = session.completed_at
    ? new Date(session.completed_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{studentName}&apos;s Priority Playbook</h3>
          <p className="text-sm text-slate-500">Completed {completedDate}</p>
        </div>
        <Badge className="bg-green-100 text-green-800">Complete</Badge>
      </div>

      <Separator />

      <Section title="Opening Reflection">
        <ReflectionRow label="2–3 year vision" answer={session.reflection.visionClarity} />
        <ReflectionRow label="Has a plan" answer={session.reflection.planExists} />
        <ReflectionRow label="Executing satisfactorily" answer={session.reflection.executingSatisfactorily} />
      </Section>

      <Section title="Focus Areas">
        <div className="flex flex-wrap gap-1">
          {session.focus_areas.filter(Boolean).map((area) => (
            <Badge key={area} variant="secondary">{area}</Badge>
          ))}
        </div>
      </Section>

      <Section title="Future Self">
        <p className="text-sm text-slate-600">{session.future_self.narrative}</p>
        <p className="text-sm mt-2">
          <span className="font-medium">Accomplishments: </span>
          {session.future_self.accomplishments.filter(Boolean).join(", ")}
        </p>
        <p className="text-sm">
          <span className="font-medium">Identity words: </span>
          {session.future_self.identityWords.filter(Boolean).join(", ")}
        </p>
      </Section>

      <Section title="Goals & Milestones">
        {session.goals.map((goal) => (
          <div key={goal.id} className="mb-3 last:mb-0">
            <p className="font-medium text-sm text-blue-800">{goal.title}</p>
            <p className="text-xs text-slate-500 mt-1">
              Milestones: {goal.milestones.filter(Boolean).join(", ")}
            </p>
            <p className="text-xs text-slate-500">
              First milestone tasks: {goal.firstMilestoneTasks.filter(Boolean).join(", ")}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Big Rocks / Gravel / Sand">
        <BucketRow label="Big Rocks" items={session.rock_sort.big_rocks} />
        <BucketRow label="Gravel" items={session.rock_sort.gravel} />
        <BucketRow label="Sand" items={session.rock_sort.sand} />
      </Section>

      <Section title="Eisenhower Matrix">
        {session.matrix.filter((m) => m.quadrant).map((item) => (
          <div key={item.id} className="flex gap-2 text-sm mb-1">
            <Badge variant="outline" className="text-xs shrink-0">
              {QUADRANT_LABELS[item.quadrant!]?.split("—")[0]?.trim()}
            </Badge>
            <span className="text-slate-600">{item.text}</span>
          </div>
        ))}
        {session.matrix.filter((m) => m.quadrant).length === 0 && (
          <p className="text-sm text-slate-400">No matrix items recorded.</p>
        )}
      </Section>

      <Section title="Matrix Reflection">
        <ReflectionField label="Thoughts" value={session.matrix_reflection.thoughts} />
        <ReflectionField label="Feelings" value={session.matrix_reflection.feelings} />
        <ReflectionField label="Where to improve" value={session.matrix_reflection.improve} />
        <ReflectionField label="Steps to take now" value={session.matrix_reflection.stepsNow} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">{children}</CardContent>
    </Card>
  )
}

function ReflectionRow({
  label,
  answer,
}: {
  label: string
  answer: { rating: string; notes?: string }
}) {
  return (
    <div className="text-sm mb-2">
      <span className="font-medium">{label}: </span>
      <Badge variant="outline" className="capitalize">{answer.rating || "—"}</Badge>
      {answer.notes && <span className="text-slate-500 ml-2">{answer.notes}</span>}
    </div>
  )
}

function BucketRow({ label, items }: { label: string; items: { text: string }[] }) {
  return (
    <p className="text-sm mb-1">
      <span className="font-medium">{label}: </span>
      <span className="text-slate-600">{items.map((i) => i.text).join(", ") || "—"}</span>
    </p>
  )
}

function ReflectionField({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm mb-2">
      <span className="font-medium">{label}: </span>
      <span className="text-slate-600">{value || "—"}</span>
    </div>
  )
}

export function CoachPlaybookEmpty() {
  return (
    <div className="text-center py-8 text-slate-500 text-sm">
      This student has not completed the Priority Playbook yet.
    </div>
  )
}
