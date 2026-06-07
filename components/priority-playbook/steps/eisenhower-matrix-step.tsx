"use client"

import { useMemo, useState } from "react"
import { FacilitatorPanel } from "../facilitator-panel"
import { DraggableItem, parseDroppedItem } from "../item-pool"
import type { MatrixItem, QuadrantPriority } from "@/lib/priority-playbook/types"
import { cn } from "@/lib/utils"

interface EisenhowerMatrixStepProps {
  matrix: MatrixItem[]
  onChange: (matrix: MatrixItem[]) => void
}

const QUADRANTS: {
  key: QuadrantPriority
  title: string
  subtitle: string
  description: string
  className: string
}[] = [
  {
    key: "urgent_important",
    title: "Quadrant 1",
    subtitle: "Crises — Important & Urgent",
    description: "Deadlines, pressing problems, fire-fighting. Goal: minimise time here.",
    className: "border-red-300 bg-red-50",
  },
  {
    key: "important_not_urgent",
    title: "Quadrant 2",
    subtitle: "Goals & Planning — Important & Non-Urgent",
    description: "Your magic quadrant! Actions that move you toward big goals. Goal: maximise time here.",
    className: "border-green-300 bg-green-50",
  },
  {
    key: "urgent_not_important",
    title: "Quadrant 3",
    subtitle: "Interruptions — Urgent & Not Important",
    description: "Tasks that interrupt important work. Goal: minimise time here.",
    className: "border-amber-300 bg-amber-50",
  },
  {
    key: "not_urgent_not_important",
    title: "Quadrant 4",
    subtitle: "Distractions — Not Urgent & Not Important",
    description: "Distractions from what matters. Goal: eliminate unconscious time here.",
    className: "border-slate-300 bg-slate-50",
  },
]

export function EisenhowerMatrixStep({ matrix, onChange }: EisenhowerMatrixStepProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const unassigned = useMemo(
    () => matrix.filter((item) => !item.quadrant),
    [matrix]
  )

  const assignQuadrant = (itemId: string, quadrant: QuadrantPriority) => {
    onChange(
      matrix.map((item) => (item.id === itemId ? { ...item, quadrant } : item))
    )
  }

  const itemsInQuadrant = (quadrant: QuadrantPriority) =>
    matrix.filter((item) => item.quadrant === quadrant)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FacilitatorPanel
          title="The Urgent–Important Matrix"
          description="Sort your tasks into four quadrants based on urgency and importance."
          quote={`"What is important is seldom urgent and what is urgent is seldom important." — Dwight D. Eisenhower`}
        />
        <div className="lg:col-span-2">
          {unassigned.length > 0 && (
            <div className="rounded-xl border bg-white p-3 mb-4">
              <h4 className="text-sm font-medium mb-2">Unassigned ({unassigned.length})</h4>
              <div className="flex flex-wrap gap-2">
                {unassigned.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={{ id: item.id, text: item.text }}
                    onDragStart={() => setDraggedId(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {QUADRANTS.map((q) => (
          <div
            key={q.key}
            className={cn("rounded-xl border-2 p-3 min-h-[160px]", q.className)}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
            }}
            onDrop={(e) => {
              e.preventDefault()
              const dropped = parseDroppedItem(e.dataTransfer)
              const itemId = dropped?.id || draggedId
              if (itemId) assignQuadrant(itemId, q.key)
              setDraggedId(null)
            }}
          >
            <div className="mb-2">
              <h4 className="font-semibold text-sm">{q.title}</h4>
              <p className="text-xs font-medium text-slate-700">{q.subtitle}</p>
              <p className="text-xs text-slate-500 mt-1">{q.description}</p>
            </div>
            <div className="space-y-2">
              {itemsInQuadrant(q.key).map((item) => (
                <DraggableItem
                  key={item.id}
                  item={{ id: item.id, text: item.text }}
                  onDragStart={() => setDraggedId(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:grid grid-cols-2 text-center text-xs text-slate-500 font-medium">
        <span>URGENT</span>
        <span>NON-URGENT</span>
      </div>
    </div>
  )
}
