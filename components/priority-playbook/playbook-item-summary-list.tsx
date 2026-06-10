"use client"

import { PlaybookItemCard } from "./playbook-item-card"
import { enrichPlaybookItems } from "@/lib/priority-playbook/item-context"
import type { PlaybookGoal, PlaybookItem } from "@/lib/priority-playbook/types"

interface PlaybookItemSummaryListProps {
  items: PlaybookItem[]
  goals: PlaybookGoal[]
  emptyLabel?: string
}

export function PlaybookItemSummaryList({
  items,
  goals,
  emptyLabel = "—",
}: PlaybookItemSummaryListProps) {
  const enrichedItems = enrichPlaybookItems(items, goals)

  if (enrichedItems.length === 0) {
    return <p className="text-sm text-slate-600">{emptyLabel}</p>
  }

  return (
    <div className="space-y-2">
      {enrichedItems.map((item) => (
        <PlaybookItemCard key={item.id} item={item} draggable={false} compact />
      ))}
    </div>
  )
}
