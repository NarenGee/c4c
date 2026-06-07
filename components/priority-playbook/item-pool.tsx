"use client"

import { cn } from "@/lib/utils"
import type { PlaybookItem } from "@/lib/priority-playbook/types"

interface DraggableItemProps {
  item: PlaybookItem
  onDragStart: (item: PlaybookItem) => void
  className?: string
}

export function DraggableItem({ item, onDragStart, className }: DraggableItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/playbook-item", JSON.stringify(item))
        e.dataTransfer.effectAllowed = "move"
        onDragStart(item)
      }}
      className={cn(
        "rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors",
        className
      )}
    >
      {item.text}
    </div>
  )
}

export function parseDroppedItem(dataTransfer: DataTransfer): PlaybookItem | null {
  const raw = dataTransfer.getData("application/playbook-item")
  if (!raw) return null
  try {
    return JSON.parse(raw) as PlaybookItem
  } catch {
    return null
  }
}

interface DropZoneProps {
  title: string
  description?: string
  items: PlaybookItem[]
  onDrop: (item: PlaybookItem) => void
  onDragStart: (item: PlaybookItem) => void
  className?: string
  emptyLabel?: string
}

export function DropZone({
  title,
  description,
  items,
  onDrop,
  onDragStart,
  className,
  emptyLabel = "Drop items here",
}: DropZoneProps) {
  return (
    <div
      className={cn("rounded-xl border-2 border-dashed p-3 min-h-[120px] transition-colors", className)}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
      }}
      onDrop={(e) => {
        e.preventDefault()
        const item = parseDroppedItem(e.dataTransfer)
        if (item) onDrop(item)
      }}
    >
      <div className="mb-2">
        <h4 className="font-semibold text-sm text-slate-800">{title}</h4>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <DraggableItem key={item.id} item={item} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  )
}
