"use client"

import { useMemo, useState } from "react"
import { FacilitatorPanel } from "../facilitator-panel"
import { DropZone, DraggableItem } from "../item-pool"
import type { PlaybookItem, RockSort } from "@/lib/priority-playbook/types"
import { collectRockSortItems } from "@/lib/priority-playbook/types"

interface RocksSortStepProps {
  inventory: PlaybookItem[]
  rockSort: RockSort
  onChange: (rockSort: RockSort) => void
}

type Bucket = keyof RockSort

export function RocksSortStep({ inventory, rockSort, onChange }: RocksSortStepProps) {
  const [draggedItem, setDraggedItem] = useState<PlaybookItem | null>(null)

  const unassigned = useMemo(() => {
    const assignedIds = new Set(collectRockSortItems(rockSort).map((item) => item.id))
    return inventory.filter((item) => !assignedIds.has(item.id))
  }, [inventory, rockSort])

  const removeFromAllBuckets = (itemId: string): RockSort => ({
    big_rocks: rockSort.big_rocks.filter((i) => i.id !== itemId),
    gravel: rockSort.gravel.filter((i) => i.id !== itemId),
    sand: rockSort.sand.filter((i) => i.id !== itemId),
  })

  const dropInto = (bucket: Bucket, item: PlaybookItem) => {
    const cleaned = removeFromAllBuckets(item.id)
    onChange({
      ...cleaned,
      [bucket]: [...cleaned[bucket], item],
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FacilitatorPanel
          title="Big Rocks, Gravel & Sand"
          description="Prioritize your goals using Stephen Covey's metaphor: put the big rocks in first."
          quote={`"If the big rocks don't go in first, they aren't going to fit in later." — Stephen Covey`}
        />
        <div className="lg:col-span-2 space-y-4">
          <p className="text-sm text-slate-600">
            Drag each item into the right category. <strong>Big Rocks</strong> first, then{" "}
            <strong>Gravel</strong>, then <strong>Sand</strong>.
          </p>
          {unassigned.length > 0 && (
            <div className="rounded-xl border bg-slate-50 p-3">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Unassigned ({unassigned.length})</h4>
              <div className="flex flex-wrap gap-2">
                {unassigned.map((item) => (
                  <DraggableItem key={item.id} item={item} onDragStart={setDraggedItem} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DropZone
          title="Big Rocks"
          description="High priority projects and tasks"
          items={rockSort.big_rocks}
          onDrop={(item) => dropInto("big_rocks", item)}
          onDragStart={setDraggedItem}
          className="border-red-200 bg-red-50/50"
        />
        <DropZone
          title="Gravel"
          description="Urgent or important tasks"
          items={rockSort.gravel}
          onDrop={(item) => dropInto("gravel", item)}
          onDragStart={setDraggedItem}
          className="border-amber-200 bg-amber-50/50"
        />
        <DropZone
          title="Sand"
          description="Unimportant projects and tasks"
          items={rockSort.sand}
          onDrop={(item) => dropInto("sand", item)}
          onDragStart={setDraggedItem}
          className="border-slate-200 bg-slate-50/50"
        />
      </div>
      {draggedItem && null}
    </div>
  )
}
