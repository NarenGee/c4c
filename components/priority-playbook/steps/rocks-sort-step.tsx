"use client"

import { useMemo, useState } from "react"
import { FacilitatorPanel } from "../facilitator-panel"
import { AssignmentHint } from "../assignment-hint"
import { DropZone } from "../item-pool"
import { UnassignedPool } from "../unassigned-pool"
import { useDragAutoScroll } from "../use-drag-auto-scroll"
import { enrichPlaybookItem, enrichPlaybookItems } from "@/lib/priority-playbook/item-context"
import type { PlaybookGoal, PlaybookItem, RockSort } from "@/lib/priority-playbook/types"
import { collectRockSortItems } from "@/lib/priority-playbook/types"

interface RocksSortStepProps {
  inventory: PlaybookItem[]
  rockSort: RockSort
  goals: PlaybookGoal[]
  onChange: (rockSort: RockSort) => void
}

type Bucket = keyof RockSort

function enrichRockSort(rockSort: RockSort, goals: PlaybookGoal[]): RockSort {
  return {
    big_rocks: enrichPlaybookItems(rockSort.big_rocks, goals),
    gravel: enrichPlaybookItems(rockSort.gravel, goals),
    sand: enrichPlaybookItems(rockSort.sand, goals),
  }
}

export function RocksSortStep({ inventory, rockSort, goals, onChange }: RocksSortStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useDragAutoScroll(isDragging)

  const enrichedInventory = useMemo(
    () => enrichPlaybookItems(inventory, goals),
    [inventory, goals]
  )

  const enrichedRockSort = useMemo(
    () => enrichRockSort(rockSort, goals),
    [rockSort, goals]
  )

  const unassigned = useMemo(() => {
    const assignedIds = new Set(collectRockSortItems(enrichedRockSort).map((item) => item.id))
    return enrichedInventory.filter((item) => !assignedIds.has(item.id))
  }, [enrichedInventory, enrichedRockSort])

  const selectedItem = useMemo(() => {
    if (!selectedId) return null
    return (
      unassigned.find((item) => item.id === selectedId) ||
      collectRockSortItems(enrichedRockSort).find((item) => item.id === selectedId) ||
      null
    )
  }, [selectedId, unassigned, enrichedRockSort])

  const removeFromAllBuckets = (itemId: string): RockSort => ({
    big_rocks: enrichedRockSort.big_rocks.filter((item) => item.id !== itemId),
    gravel: enrichedRockSort.gravel.filter((item) => item.id !== itemId),
    sand: enrichedRockSort.sand.filter((item) => item.id !== itemId),
  })

  const dropInto = (bucket: Bucket, item: PlaybookItem) => {
    const enrichedItem = enrichPlaybookItem(item, goals)
    const cleaned = removeFromAllBuckets(enrichedItem.id)
    onChange({
      ...cleaned,
      [bucket]: [...cleaned[bucket], enrichedItem],
    })
    setSelectedId(null)
  }

  const handleSelect = (item: PlaybookItem) => {
    setSelectedId((current) => (current === item.id ? null : item.id))
  }

  return (
    <div className="space-y-4">
      <FacilitatorPanel
        title="Big Rocks, Gravel & Sand"
        description="Prioritize your goals using Stephen Covey's metaphor: put the big rocks in first."
        quote={`"If the big rocks don't go in first, they aren't going to fit in later." — Stephen Covey`}
      />

      <AssignmentHint />

      <UnassignedPool
        items={unassigned}
        selectedId={selectedId}
        onSelect={handleSelect}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DropZone
          title="Big Rocks"
          description="High priority projects and tasks"
          items={enrichedRockSort.big_rocks}
          onDrop={(item) => dropInto("big_rocks", item)}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          selectedItem={selectedItem}
          selectedId={selectedId}
          onSelect={handleSelect}
          isDragActive={isDragging}
          className="border-red-200 bg-red-50/50"
        />
        <DropZone
          title="Gravel"
          description="Urgent or important tasks"
          items={enrichedRockSort.gravel}
          onDrop={(item) => dropInto("gravel", item)}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          selectedItem={selectedItem}
          selectedId={selectedId}
          onSelect={handleSelect}
          isDragActive={isDragging}
          className="border-amber-200 bg-amber-50/50"
        />
        <DropZone
          title="Sand"
          description="Unimportant projects and tasks"
          items={enrichedRockSort.sand}
          onDrop={(item) => dropInto("sand", item)}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          selectedItem={selectedItem}
          selectedId={selectedId}
          onSelect={handleSelect}
          isDragActive={isDragging}
          className="border-slate-200 bg-slate-50/50"
        />
      </div>
    </div>
  )
}
