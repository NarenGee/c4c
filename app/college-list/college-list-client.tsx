"use client"

import { useState } from "react"
import { KanbanBoard } from "@/components/college-list/kanban-board"

export function CollegeListClient() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="space-y-8">
      <KanbanBoard refreshTrigger={refreshTrigger} />
    </div>
  )
} 