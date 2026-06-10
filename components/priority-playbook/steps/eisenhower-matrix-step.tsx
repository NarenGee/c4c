"use client"

import { useMemo, useState } from "react"
import { FacilitatorPanel } from "../facilitator-panel"
import { AssignmentHint } from "../assignment-hint"
import { DraggableItem, parseDroppedItem } from "../item-pool"
import { UnassignedPool } from "../unassigned-pool"
import { useDragAutoScroll } from "../use-drag-auto-scroll"
import { enrichMatrixItem, enrichMatrixItems } from "@/lib/priority-playbook/item-context"
import type { MatrixItem, PlaybookGoal, QuadrantPriority } from "@/lib/priority-playbook/types"
import { cn } from "@/lib/utils"

interface EisenhowerMatrixStepProps {
  matrix: MatrixItem[]
  goals: PlaybookGoal[]
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

export function EisenhowerMatrixStep({ matrix, goals, onChange }: EisenhowerMatrixStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useDragAutoScroll(isDragging)

  const enrichedMatrix = useMemo(
    () => enrichMatrixItems(matrix, goals),
    [matrix, goals]
  )

  const unassigned = useMemo(
    () => enrichedMatrix.filter((item) => !item.quadrant),
    [enrichedMatrix]
  )

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return enrichedMatrix.find((item) => item.id === selectedId) || null
  }, [selectedId, enrichedMatrix])

  const assignQuadrant = (itemId: string, quadrant: QuadrantPriority) => {
    const item = enrichedMatrix.find((entry) => entry.id === itemId)
    if (!item) return

    const enrichedItem = enrichMatrixItem(item, goals)
    onChange(
      matrix.map((entry) =>
        entry.id === itemId
          ? { ...entry, ...enrichedItem, quadrant }
          : entry
      )
    )
    setSelectedId(null)
    setDraggedId(null)
  }

  const handleSelect = (item: MatrixItem) => {
    setSelectedId((current) => (current === item.id ? null : item.id))
  }

  const itemsInQuadrant = (quadrant: QuadrantPriority) =>
    enrichedMatrix.filter((item) => item.quadrant === quadrant)

  return (
    <div className="space-y-4">
      <FacilitatorPanel
        title="The Urgent–Important Matrix"
        description="Sort your tasks into four quadrants based on urgency and importance."
        quote={`"What is important is seldom urgent and what is urgent is seldom important." — Dwight D. Eisenhower`}
      />

      <AssignmentHint />

      <UnassignedPool
        items={unassigned}
        selectedId={selectedId}
        onSelect={handleSelect}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setIsDragging(false)
          setDraggedId(null)
        }}
      />

      <div className="hidden md:grid grid-cols-2 text-center text-xs text-slate-500 font-medium px-1">
        <span>URGENT</span>
        <span>NON-URGENT</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {QUADRANTS.map((quadrant) => {
          const canAcceptSelection = !!selectedItem

          return (
            <div
              key={quadrant.key}
              className={cn(
                "rounded-xl border-2 p-3 min-h-[180px] transition-colors",
                quadrant.className,
                canAcceptSelection && "cursor-pointer hover:border-blue-400",
                isDragging && "ring-1 ring-blue-200"
              )}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
              }}
              onDrop={(event) => {
                event.preventDefault()
                const dropped = parseDroppedItem(event.dataTransfer)
                const itemId = dropped?.id || draggedId
                if (itemId) assignQuadrant(itemId, quadrant.key)
                setIsDragging(false)
                setDraggedId(null)
              }}
              onClick={() => {
                if (selectedItem) assignQuadrant(selectedItem.id, quadrant.key)
              }}
              onKeyDown={(event) => {
                if (!selectedItem) return
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  assignQuadrant(selectedItem.id, quadrant.key)
                }
              }}
              role={canAcceptSelection ? "button" : undefined}
              tabIndex={canAcceptSelection ? 0 : undefined}
            >
              <div className="mb-2">
                <h4 className="font-semibold text-sm">{quadrant.title}</h4>
                <p className="text-xs font-medium text-slate-700">{quadrant.subtitle}</p>
                <p className="text-xs text-slate-500 mt-1">{quadrant.description}</p>
                {canAcceptSelection && (
                  <p className="text-xs text-blue-600 mt-1">Tap to place selected task here</p>
                )}
              </div>
              <div className="space-y-2">
                {itemsInQuadrant(quadrant.key).map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={handleSelect}
                    onDragStart={(entry) => {
                      setDraggedId(entry.id)
                      setIsDragging(true)
                    }}
                    onDragEnd={() => {
                      setIsDragging(false)
                      setDraggedId(null)
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
