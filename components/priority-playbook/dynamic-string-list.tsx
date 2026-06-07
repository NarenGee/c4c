"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

interface DynamicStringListProps {
  label: string
  placeholder?: string
  values: string[]
  onChange: (values: string[]) => void
  minItems?: number
}

export function DynamicStringList({
  label,
  placeholder = "Add an item...",
  values,
  onChange,
  minItems = 1,
}: DynamicStringListProps) {
  const updateItem = (index: number, value: string) => {
    const next = [...values]
    next[index] = value
    onChange(next)
  }

  const addItem = () => onChange([...values, ""])

  const removeItem = (index: number) => {
    if (values.length <= minItems) return
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={value}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeItem(index)}
              disabled={values.length <= minItems}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
