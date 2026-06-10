"use client"

import { Badge } from "@/components/ui/badge"

interface FocusAreasReferenceProps {
  focusAreas: string[]
  className?: string
  variant?: "card" | "inline"
}

export function FocusAreasReference({
  focusAreas,
  className,
  variant = "card",
}: FocusAreasReferenceProps) {
  const areas = focusAreas.map((area) => area.trim()).filter(Boolean)

  const content = (
    <>
      <h3 className="text-sm font-medium text-slate-800">Your areas of focus</h3>
      {areas.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <Badge key={area} variant="secondary" className="text-sm">
              {area}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No focus areas added yet.</p>
      )}
    </>
  )

  if (variant === "inline") {
    return (
      <div className={className ?? "mt-2 space-y-2"}>
        {content}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
        {content}
      </div>
    </div>
  )
}
