"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FacilitatorPanel } from "../facilitator-panel"
import { DynamicStringList } from "../dynamic-string-list"
import type { FutureSelf } from "@/lib/priority-playbook/types"
import { Clock, Play, Pause, RotateCcw } from "lucide-react"

interface FutureSelfStepProps {
  futureSelf: FutureSelf
  onChange: (futureSelf: FutureSelf) => void
}

export function FutureSelfStep({ futureSelf, onChange }: FutureSelfStepProps) {
  const [secondsLeft, setSecondsLeft] = useState(180)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [timerRunning, secondsLeft])

  const formatTime = (total: number) => {
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FacilitatorPanel
        title="Future Self Visualization"
        description="Imagine your ideal future self 2–3 years from now. What have you accomplished? Who have you become?"
        prompt="You will have 3 minutes to write down: (1) all the things your ideal future self accomplished, and (2) what words describe future you."
        showTimer
        timerSeconds={180}
      />
      <div className="space-y-5">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <Clock className="h-4 w-4 text-amber-700" />
          <span className="font-mono text-lg font-semibold text-amber-900">{formatTime(secondsLeft)}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => setTimerRunning(true)} disabled={timerRunning}>
            <Play className="h-3 w-3 mr-1" /> Start
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setTimerRunning(false)}>
            <Pause className="h-3 w-3 mr-1" /> Pause
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setTimerRunning(false)
              setSecondsLeft(180)
            }}
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>

        <div className="rounded-xl border bg-white p-4 space-y-2">
          <Label>Imagine your ideal future self (2–3 years)</Label>
          <Textarea
            value={futureSelf.narrative}
            onChange={(e) => onChange({ ...futureSelf, narrative: e.target.value })}
            placeholder="Describe what your ideal future looks like..."
            rows={4}
          />
        </div>

        <div className="rounded-xl border bg-white p-4">
          <DynamicStringList
            label="What have you accomplished? (LEARN)"
            placeholder="An accomplishment or goal..."
            values={futureSelf.accomplishments}
            onChange={(accomplishments) => onChange({ ...futureSelf, accomplishments })}
          />
        </div>

        <div className="rounded-xl border bg-white p-4">
          <DynamicStringList
            label="Who have you become? (BE — descriptive words)"
            placeholder="e.g. Confident, resilient, curious..."
            values={futureSelf.identityWords}
            onChange={(identityWords) => onChange({ ...futureSelf, identityWords })}
          />
        </div>
      </div>
    </div>
  )
}
