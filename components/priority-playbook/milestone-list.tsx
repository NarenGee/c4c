"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalizeMilestoneDateRange } from "@/lib/priority-playbook/milestone-dates"
import {
  createMilestone,
  getMilestoneTasks,
  type PlaybookMilestone,
} from "@/lib/priority-playbook/types"
import { Plus, Trash2 } from "lucide-react"
import { MilestoneDatePicker } from "./milestone-date-picker"
import { MilestoneTaskList } from "./milestone-task-list"
import { NO_AUTOCORRECT_PROPS } from "./no-autocorrect"

interface MilestoneListProps {
  label: string
  placeholder?: string
  values: PlaybookMilestone[]
  onChange: (values: PlaybookMilestone[]) => void
  minItems?: number
}

export function MilestoneList({
  label,
  placeholder = "A milestone on the way to this goal...",
  values,
  onChange,
  minItems = 1,
}: MilestoneListProps) {
  const updateItem = (index: number, patch: Partial<PlaybookMilestone>) => {
    const next = [...values]
    const merged = { ...next[index], ...patch }
    const normalized = normalizeMilestoneDateRange(merged.startDate, merged.endDate)
    next[index] = { ...merged, ...normalized }
    onChange(next)
  }

  const addItem = () => onChange([...values, createMilestone()])

  const removeItem = (index: number) => {
    if (values.length <= minItems) return
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="space-y-3">
        {values.map((milestone, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2"
          >
            <Input
              value={milestone.title}
              onChange={(e) => updateItem(index, { title: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-white"
              {...NO_AUTOCORRECT_PROPS}
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <MilestoneDatePicker
                value={milestone.startDate}
                onChange={(startDate) => updateItem(index, { startDate })}
                emptyLabel="Start date"
                className="w-full sm:min-w-[9.5rem]"
              />
              <span className="hidden sm:inline text-xs text-slate-400">to</span>
              <MilestoneDatePicker
                value={milestone.endDate}
                onChange={(endDate) => updateItem(index, { endDate })}
                emptyLabel="End date"
                className="w-full sm:min-w-[9.5rem]"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 self-end sm:ml-auto"
                onClick={() => removeItem(index)}
                disabled={values.length <= minItems}
                aria-label="Remove milestone"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <MilestoneTaskList
              label="Tasks for this milestone"
              values={getMilestoneTasks(milestone)}
              onChange={(tasks) => updateItem(index, { tasks })}
            />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
        <Plus className="h-4 w-4" />
        Add another
      </Button>
    </div>
  )
}
