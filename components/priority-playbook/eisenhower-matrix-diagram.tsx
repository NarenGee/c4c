"use client"

import type { MatrixItem, QuadrantPriority } from "@/lib/priority-playbook/types"
import { cn } from "@/lib/utils"

const QUADRANTS: {
  key: QuadrantPriority
  title: string
  subtitle: string
  className: string
}[] = [
  {
    key: "urgent_important",
    title: "Quadrant 1",
    subtitle: "Crises",
    className: "border-red-300 bg-red-50",
  },
  {
    key: "important_not_urgent",
    title: "Quadrant 2",
    subtitle: "Goals & Planning",
    className: "border-green-300 bg-green-50",
  },
  {
    key: "urgent_not_important",
    title: "Quadrant 3",
    subtitle: "Interruptions",
    className: "border-amber-300 bg-amber-50",
  },
  {
    key: "not_urgent_not_important",
    title: "Quadrant 4",
    subtitle: "Distractions",
    className: "border-slate-300 bg-slate-50",
  },
]

interface EisenhowerMatrixDiagramProps {
  matrix: MatrixItem[]
  className?: string
}

function QuadrantCell({
  quadrant,
  items,
}: {
  quadrant: (typeof QUADRANTS)[number]
  items: MatrixItem[]
}) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-3 min-h-[140px] flex flex-col",
        quadrant.className
      )}
    >
      <div className="mb-2 shrink-0">
        <h4 className="font-semibold text-sm text-slate-800">{quadrant.title}</h4>
        <p className="text-xs text-slate-600">{quadrant.subtitle}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No tasks</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/80 bg-white/90 px-2.5 py-1.5 text-sm text-slate-800 shadow-sm"
            >
              {item.text}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function EisenhowerMatrixDiagram({ matrix, className }: EisenhowerMatrixDiagramProps) {
  const itemsInQuadrant = (quadrant: QuadrantPriority) =>
    matrix.filter((item) => item.quadrant === quadrant)

  const unassigned = matrix.filter((item) => !item.quadrant)
  const placedCount = matrix.filter((item) => item.quadrant).length

  const q1 = QUADRANTS[0]
  const q2 = QUADRANTS[1]
  const q3 = QUADRANTS[2]
  const q4 = QUADRANTS[3]

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Column headers */}
      <div className="grid grid-cols-[3.5rem_1fr_1fr] sm:grid-cols-[4.5rem_1fr_1fr] gap-2">
        <div />
        <div className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">
          Urgent
        </div>
        <div className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">
          Non-Urgent
        </div>
      </div>

      {/* Important row */}
      <div className="grid grid-cols-[3.5rem_1fr_1fr] sm:grid-cols-[4.5rem_1fr_1fr] gap-2">
        <div className="flex items-center justify-center px-1">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500 text-center leading-snug">
            Important
          </span>
        </div>
        <QuadrantCell quadrant={q1} items={itemsInQuadrant(q1.key)} />
        <QuadrantCell quadrant={q2} items={itemsInQuadrant(q2.key)} />
      </div>

      {/* Not important row */}
      <div className="grid grid-cols-[3.5rem_1fr_1fr] sm:grid-cols-[4.5rem_1fr_1fr] gap-2">
        <div className="flex items-center justify-center px-1">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-500 text-center leading-snug">
            Not Important
          </span>
        </div>
        <QuadrantCell quadrant={q3} items={itemsInQuadrant(q3.key)} />
        <QuadrantCell quadrant={q4} items={itemsInQuadrant(q4.key)} />
      </div>

      {unassigned.length > 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600 mb-2">
            Unassigned ({unassigned.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((item) => (
              <span
                key={item.id}
                className="rounded-lg border bg-white px-2.5 py-1 text-sm text-slate-700"
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        {placedCount} of {matrix.length} task{matrix.length === 1 ? "" : "s"} placed
      </p>
    </div>
  )
}
