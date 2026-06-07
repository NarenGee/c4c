"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface FacilitatorPanelProps {
  title: string
  description: string
  prompt?: string
  quote?: string
  showTimer?: boolean
  timerSeconds?: number
}

export function FacilitatorPanel({
  title,
  description,
  prompt,
  quote,
  showTimer = false,
  timerSeconds = 180,
}: FacilitatorPanelProps) {
  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
            Facilitator
          </Badge>
          {showTimer && <WorkshopTimer seconds={timerSeconds} />}
        </div>
        <CardTitle className="text-lg text-slate-800">{title}</CardTitle>
        <CardDescription className="text-slate-600 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      {(prompt || quote) && (
        <CardContent className="pt-0 space-y-3">
          {prompt && (
            <p className="text-sm font-medium text-slate-700 bg-white/80 rounded-lg p-3 border border-slate-200">
              {prompt}
            </p>
          )}
          {quote && (
            <blockquote className="text-sm italic text-slate-600 border-l-4 border-blue-400 pl-3">
              {quote}
            </blockquote>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function WorkshopTimer({ seconds }: { seconds: number }) {
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1">
      <Clock className="h-3 w-3" />
      {Math.floor(seconds / 60)} min exercise
    </Badge>
  )
}
