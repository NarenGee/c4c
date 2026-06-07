"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FacilitatorPanel } from "../facilitator-panel"
import type { MatrixReflection } from "@/lib/priority-playbook/types"

interface MatrixReflectionStepProps {
  matrixReflection: MatrixReflection
  onChange: (matrixReflection: MatrixReflection) => void
}

export function MatrixReflectionStep({ matrixReflection, onChange }: MatrixReflectionStepProps) {
  const fields: { key: keyof MatrixReflection; label: string; placeholder: string }[] = [
    { key: "thoughts", label: "What are your thoughts?", placeholder: "Reflect on your matrix..." },
    { key: "feelings", label: "How do you feel?", placeholder: "Describe your emotional response..." },
    { key: "improve", label: "Where can you improve?", placeholder: "Areas for growth..." },
    { key: "stepsNow", label: "What steps can you take NOW?", placeholder: "Immediate actions..." },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FacilitatorPanel
        title="Reflect on Your Matrix"
        description="Take time to process what you've learned about how you spend your time and energy."
        prompt="What are your thoughts? How do you feel? Where can you improve? What steps can you take NOW?"
      />
      <div className="space-y-4">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className="rounded-xl border bg-white p-4 space-y-2">
            <Label>{label}</Label>
            <Textarea
              value={matrixReflection[key]}
              onChange={(e) => onChange({ ...matrixReflection, [key]: e.target.value })}
              placeholder={placeholder}
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
