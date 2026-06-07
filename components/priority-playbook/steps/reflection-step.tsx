"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FacilitatorPanel } from "../facilitator-panel"
import type { PlaybookReflection, ReflectionRating } from "@/lib/priority-playbook/types"

interface ReflectionStepProps {
  reflection: PlaybookReflection
  onChange: (reflection: PlaybookReflection) => void
}

const QUESTIONS: {
  key: keyof PlaybookReflection
  question: string
}[] = [
  {
    key: "visionClarity",
    question: "Do you have an idea of where you want to be in the next 2 or 3 years?",
  },
  {
    key: "planExists",
    question: "Have you planned out exactly how you are going to get there?",
  },
  {
    key: "executingSatisfactorily",
    question: "Are you executing that plan to your satisfaction?",
  },
]

const RATINGS: { value: ReflectionRating; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "somewhat", label: "Somewhat" },
  { value: "no", label: "No" },
]

export function ReflectionStep({ reflection, onChange }: ReflectionStepProps) {
  const updateAnswer = (key: keyof PlaybookReflection, field: "rating" | "notes", value: string) => {
    onChange({
      ...reflection,
      [key]: {
        ...reflection[key],
        [field]: value,
      },
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FacilitatorPanel
        title="Opening Reflection"
        description="Take a moment to honestly assess where you are today relative to your future goals."
        prompt="Your facilitator will guide you through three reflection questions. Answer honestly — there are no wrong answers."
      />
      <div className="space-y-6">
        {QUESTIONS.map(({ key, question }) => (
          <div key={key} className="rounded-xl border bg-white p-4 space-y-3">
            <Label className="text-base font-medium text-slate-800">{question}</Label>
            <div className="flex flex-wrap gap-2">
              {RATINGS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateAnswer(key, "rating", value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    reflection[key].rating === value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Textarea
              value={reflection[key].notes || ""}
              onChange={(e) => updateAnswer(key, "notes", e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
