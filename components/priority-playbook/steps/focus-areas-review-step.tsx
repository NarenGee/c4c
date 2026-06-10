"use client"

import { FacilitatorPanel } from "../facilitator-panel"
import { FocusAreasReference } from "../focus-areas-reference"

interface FocusAreasReviewStepProps {
  focusAreas: string[]
}

export function FocusAreasReviewStep({ focusAreas }: FocusAreasReviewStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FacilitatorPanel
        title="Future Self Visualization"
        description="Imagine your ideal future self 2–3 years from now. What have you accomplished in your areas of focus in this ideal future?"
      />
      <FocusAreasReference focusAreas={focusAreas} />
    </div>
  )
}
