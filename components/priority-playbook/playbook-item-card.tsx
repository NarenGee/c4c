"use client"

import { cn } from "@/lib/utils"
import { getItemContextLabel } from "@/lib/priority-playbook/item-context"
import type { PlaybookItem } from "@/lib/priority-playbook/types"

interface PlaybookItemCardProps {
  item: PlaybookItem
  selected?: boolean
  onSelect?: (item: PlaybookItem) => void
  draggable?: boolean
  onDragStart?: (item: PlaybookItem) => void
  onDragEnd?: () => void
  className?: string
  compact?: boolean
}

export function PlaybookItemCard({
  item,
  selected = false,
  onSelect,
  draggable = true,
  onDragStart,
  onDragEnd,
  className,
  compact = false,
}: PlaybookItemCardProps) {
  const contextLabel = getItemContextLabel(item)

  return (
    <div
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable) return
        event.dataTransfer.setData("application/playbook-item", JSON.stringify(item))
        event.dataTransfer.effectAllowed = "move"
        onDragStart?.(item)
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onSelect?.(item)}
      onKeyDown={(event) => {
        if (!onSelect) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(item)
        }
      }}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={cn(
        "rounded-lg border bg-white text-left shadow-sm transition-colors",
        compact ? "px-2.5 py-1.5" : "px-3 py-2",
        draggable && "cursor-grab active:cursor-grabbing",
        onSelect && "cursor-pointer hover:border-blue-300",
        selected && "border-blue-500 ring-2 ring-blue-200",
        !selected && "border-slate-200",
        className
      )}
    >
      <p className={cn("font-medium text-slate-800", compact ? "text-sm" : "text-sm")}>
        {item.text}
      </p>
      <p className={cn("text-slate-500 mt-0.5", compact ? "text-[11px]" : "text-xs")}>
        {contextLabel}
      </p>
    </div>
  )
}
