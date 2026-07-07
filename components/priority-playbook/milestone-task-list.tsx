"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalizeMilestoneDateRange } from "@/lib/priority-playbook/milestone-dates"
import { createTask, type PlaybookTask } from "@/lib/priority-playbook/types"
import { Plus, Trash2 } from "lucide-react"
import { MilestoneDatePicker } from "./milestone-date-picker"
import { NO_AUTOCORRECT_PROPS } from "./no-autocorrect"

interface MilestoneTaskListProps {
  label: string
  placeholder?: string
  values: PlaybookTask[]
  onChange: (values: PlaybookTask[]) => void
  minItems?: number
}

export function MilestoneTaskList({
  label,
  placeholder = "A task to complete...",
  values,
  onChange,
  minItems = 1,
}: MilestoneTaskListProps) {
  const updateItem = (index: number, patch: Partial<PlaybookTask>) => {
    const next = [...values]
    const merged = { ...next[index], ...patch }
    if ("startDate" in patch || "endDate" in patch) {
      const normalized = normalizeMilestoneDateRange(merged.startDate, merged.endDate)
      next[index] = { ...merged, ...normalized }
    } else {
      next[index] = merged
    }
    onChange(next)
  }

  const addItem = () => onChange([...values, createTask()])

  const removeItem = (index: number) => {
    if (values.length <= minItems) return
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="space-y-2">
        {values.map((task, index) => (
          <div
            key={task.id ?? index}
            className="rounded-lg border border-slate-200 bg-white p-2 space-y-2"
          >
            <div className="flex gap-2">
              <Input
                value={task.text}
                onChange={(e) => updateItem(index, { text: e.target.value })}
                placeholder={placeholder}
                className="flex-1"
                {...NO_AUTOCORRECT_PROPS}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={values.length <= minItems}
                aria-label="Remove task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <MilestoneDatePicker
                value={task.startDate}
                onChange={(startDate) => updateItem(index, { startDate })}
                emptyLabel="Start date"
                className="w-full sm:min-w-[9.5rem]"
              />
              <span className="hidden sm:inline text-xs text-slate-400">to</span>
              <MilestoneDatePicker
                value={task.endDate}
                onChange={(endDate) => updateItem(index, { endDate })}
                emptyLabel="End date"
                className="w-full sm:min-w-[9.5rem]"
              />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
        <Plus className="h-4 w-4" />
        Add task
      </Button>
    </div>
  )
}
