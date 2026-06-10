"use client"

import { cn } from "@/lib/utils"
import type { PlaybookItem } from "@/lib/priority-playbook/types"
import { PlaybookItemCard } from "./playbook-item-card"

export function parseDroppedItem(dataTransfer: DataTransfer): PlaybookItem | null {
  const raw = dataTransfer.getData("application/playbook-item")
  if (!raw) return null
  try {
    return JSON.parse(raw) as PlaybookItem
  } catch {
    return null
  }
}

interface DraggableItemProps {
  item: PlaybookItem
  onDragStart: (item: PlaybookItem) => void
  onDragEnd?: () => void
  selected?: boolean
  onSelect?: (item: PlaybookItem) => void
  className?: string
}

export function DraggableItem({
  item,
  onDragStart,
  onDragEnd,
  selected,
  onSelect,
  className,
}: DraggableItemProps) {
  return (
    <PlaybookItemCard
      item={item}
      selected={selected}
      onSelect={onSelect}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={className}
    />
  )
}

interface DropZoneProps {
  title: string
  description?: string
  items: PlaybookItem[]
  onDrop: (item: PlaybookItem) => void
  onDragStart: (item: PlaybookItem) => void
  onDragEnd?: () => void
  selectedItem?: PlaybookItem | null
  onSelect?: (item: PlaybookItem) => void
  selectedId?: string | null
  className?: string
  emptyLabel?: string
  isDragActive?: boolean
}

export function DropZone({
  title,
  description,
  items,
  onDrop,
  onDragStart,
  onDragEnd,
  selectedItem,
  onSelect,
  selectedId,
  className,
  emptyLabel = "Drop items here",
  isDragActive = false,
}: DropZoneProps) {
  const canAcceptSelection = !!selectedItem

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed p-3 min-h-[140px] transition-colors",
        canAcceptSelection && "cursor-pointer hover:border-blue-400 hover:bg-blue-50/40",
        isDragActive && "border-blue-400 bg-blue-50/30",
        className
      )}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      }}
      onDrop={(event) => {
        event.preventDefault()
        const item = parseDroppedItem(event.dataTransfer)
        if (item) onDrop(item)
      }}
      onClick={() => {
        if (selectedItem) onDrop(selectedItem)
      }}
      onKeyDown={(event) => {
        if (!selectedItem) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onDrop(selectedItem)
        }
      }}
      role={canAcceptSelection ? "button" : undefined}
      tabIndex={canAcceptSelection ? 0 : undefined}
    >
      <div className="mb-2">
        <h4 className="font-semibold text-sm text-slate-800">{title}</h4>
        {description && <p className="text-xs text-slate-500">{description}</p>}
        {canAcceptSelection && (
          <p className="text-xs text-blue-600 mt-1">Tap to place selected task here</p>
        )}
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              selected={selectedId === item.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
