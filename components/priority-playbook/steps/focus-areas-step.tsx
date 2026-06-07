"use client"

import { FacilitatorPanel } from "../facilitator-panel"
import { DynamicStringList } from "../dynamic-string-list"

interface FocusAreasStepProps {
  focusAreas: string[]
  onChange: (focusAreas: string[]) => void
}

export function FocusAreasStep({ focusAreas, onChange }: FocusAreasStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FacilitatorPanel
        title="Areas That Demand Focus"
        description="Before planning, identify the parts of your life that need the most attention right now."
        prompt="What are the areas of YOUR life that demand focus? Think about academics, health, relationships, extracurriculars, personal growth, and more."
      />
      <div className="rounded-xl border bg-white p-4">
        <DynamicStringList
          label="Life areas that need your focus"
          placeholder="e.g. College applications, mental health, leadership..."
          values={focusAreas}
          onChange={onChange}
        />
      </div>
    </div>
  )
}
