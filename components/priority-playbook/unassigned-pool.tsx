"use client"

import { PlaybookItemCard } from "./playbook-item-card"
import type { PlaybookItem } from "@/lib/priority-playbook/types"

interface UnassignedPoolProps {
  items: PlaybookItem[]
  selectedId: string | null
  onSelect: (item: PlaybookItem) => void
  onDragStart: (item: PlaybookItem) => void
  onDragEnd: () => void
  sticky?: boolean
}

export function UnassignedPool({
  items,
  selectedId,
  onSelect,
  onDragStart,
  onDragEnd,
  sticky = true,
}: UnassignedPoolProps) {
  if (items.length === 0) return null

  return (
    <div
      className={
        sticky
          ? "sticky top-0 z-20 -mx-1 px-1 py-3 mb-4 bg-gradient-to-b from-white via-white/95 to-transparent backdrop-blur-sm"
          : "mb-4"
      }
    >
      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium text-slate-800">
            Unassigned ({items.length})
          </h4>
          <p className="text-xs text-slate-500 hidden sm:block">
            Tap a task, then tap a category — or drag and drop
          </p>
          <p className="text-xs text-slate-500 sm:hidden">Tap task, then category</p>
        </div>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {items.map((item) => (
            <PlaybookItemCard
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              className="max-w-full sm:max-w-xs"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
