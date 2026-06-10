"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { FacilitatorPanel } from "../facilitator-panel"
import { NO_AUTOCORRECT_PROPS } from "../no-autocorrect"
import type { PlaybookItem } from "@/lib/priority-playbook/types"

interface InventoryStepProps {
  otherTasks: PlaybookItem[]
  onChange: (otherTasks: PlaybookItem[]) => void
}

export function InventoryStep({ otherTasks, onChange }: InventoryStepProps) {
  const updateItem = (index: number, text: string) => {
    const next = [...otherTasks]
    next[index] = { ...next[index], text }
    onChange(next)
  }

  const addItem = () => {
    onChange([...otherTasks, { id: crypto.randomUUID(), text: "", source: "other" }])
  }

  const removeItem = (index: number) => {
    onChange(otherTasks.filter((_, i) => i !== index))
  }

  const items = otherTasks.length > 0 ? otherTasks : [{ id: crypto.randomUUID(), text: "", source: "other" as const }]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FacilitatorPanel
        title="Everything Else"
        description="Capture all the other tasks and time commitments that fill your days — not just your big goals."
        prompt="Write down all the other stuff you need to do or that you spend time on every day. EVERYTHING!"
      />
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <label className="text-sm font-medium text-slate-700">Daily tasks & commitments</label>
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2">
            <Input
              value={item.text}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder="e.g. Social media, chores, club meetings..."
              {...NO_AUTOCORRECT_PROPS}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeItem(index)}
              disabled={items.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
          <Plus className="h-4 w-4" />
          Add another
        </Button>
      </div>
    </div>
  )
}
