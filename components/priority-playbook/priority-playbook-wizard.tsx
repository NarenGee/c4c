"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Target, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import {
  completePlaybook,
  getOrCreateSession,
  prepareStepData,
  savePlaybookSession,
  startNewPlaybookSession,
} from "@/app/actions/priority-playbook"
import {
  type PriorityPlaybookSession,
  TOTAL_STEPS,
  STEP_TITLES,
  collectInventoryItems,
  goalsFromAccomplishments,
} from "@/lib/priority-playbook/types"
import { isStepValid } from "@/lib/priority-playbook/validation"
import { ReflectionStep } from "./steps/reflection-step"
import { FocusAreasStep } from "./steps/focus-areas-step"
import { FutureSelfStep } from "./steps/future-self-step"
import { GoalsBreakdownStep } from "./steps/goals-breakdown-step"
import { InventoryStep } from "./steps/inventory-step"
import { RocksSortStep } from "./steps/rocks-sort-step"
import { EisenhowerMatrixStep } from "./steps/eisenhower-matrix-step"
import { MatrixReflectionStep } from "./steps/matrix-reflection-step"
import { SummaryStep } from "./steps/summary-step"

export function PriorityPlaybookWizard() {
  const [session, setSession] = useState<PriorityPlaybookSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionsCreated, setActionsCreated] = useState(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionRef = useRef<PriorityPlaybookSession | null>(null)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const loadSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getOrCreateSession()
    if (result.success && result.session) {
      setSession(result.session)
      if (result.session.status === "completed") {
        setActionsCreated(0)
      }
    } else {
      setError(result.error || "Failed to load playbook")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const scheduleSave = useCallback((updated: PriorityPlaybookSession) => {
    setSession(updated)
    if (updated.status === "completed") return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      const result = await savePlaybookSession(updated)
      if (!result.success) {
        setError(result.error || "Failed to save")
      } else if (result.session) {
        setSession(result.session)
      }
      setSaving(false)
    }, 600)
  }, [])

  const handleNext = async () => {
    if (!session) return
    const nextStep = Math.min(session.current_step + 1, TOTAL_STEPS)

    setSaving(true)
    let updated = { ...session, current_step: nextStep }

    if (nextStep === 4 && updated.goals.length === 0) {
      updated.goals = goalsFromAccomplishments(updated.future_self.accomplishments)
    }

    if (nextStep === 5 && updated.other_tasks.length === 0) {
      updated.other_tasks = [{ id: crypto.randomUUID(), text: "", source: "other" }]
    }

    const prepResult = await prepareStepData(updated, nextStep)
    if (prepResult.success && prepResult.session) {
      updated = { ...prepResult.session, current_step: nextStep }
      const saveResult = await savePlaybookSession(updated)
      if (saveResult.success && saveResult.session) {
        setSession(saveResult.session)
      }
    }
    setSaving(false)
  }

  const handleBack = async () => {
    if (!session || session.current_step <= 1) return
    const updated = { ...session, current_step: session.current_step - 1 }
    scheduleSave(updated)
    await savePlaybookSession(updated)
  }

  const handleComplete = async () => {
    if (!session) return
    setCompleting(true)
    setError(null)

    await savePlaybookSession(session)
    const result = await completePlaybook(session.id)
    if (result.success && result.session) {
      setSession(result.session)
      setActionsCreated(result.actionsCreated ?? 0)
    } else {
      setError(result.error || "Failed to complete playbook")
    }
    setCompleting(false)
  }

  const handleStartNew = async () => {
    setLoading(true)
    setError(null)
    const result = await startNewPlaybookSession()
    if (result.success && result.session) {
      setSession(result.session)
      setActionsCreated(0)
    } else {
      setError(result.error || "Failed to start new session")
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Unable to load Priority Playbook"}</AlertDescription>
      </Alert>
    )
  }

  const isCompleted = session.status === "completed"
  const currentStep = isCompleted ? TOTAL_STEPS : session.current_step
  const progress = (currentStep / TOTAL_STEPS) * 100
  const canContinue = isStepValid(session, currentStep)

  const inventory = collectInventoryItems(session)

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Target className="h-5 w-5" />
          The Priority Playbook
        </CardTitle>
        <CardDescription className="text-slate-300">
          Cut out the noise. Do what matters.
          {saving && <span className="ml-2 text-slate-400">Saving...</span>}
        </CardDescription>
        {!isCompleted && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Step {currentStep} of {TOTAL_STEPS}: {STEP_TITLES[currentStep]}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-700" />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6 lg:p-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isCompleted && (
          <div className="mb-6 flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Start New Playbook
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start a new playbook?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2 text-left">
                    <span className="block">
                      Your completed playbook will stay saved and coaches can still review it.
                    </span>
                    <span className="block">
                      Any unfinished draft will be discarded. Dashboard actions from previous runs will not be removed; completing this new playbook will only add tasks that are not already there.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStartNew}>
                    Start fresh
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {currentStep === 1 && (
          <ReflectionStep
            reflection={session.reflection}
            onChange={(reflection) => scheduleSave({ ...session, reflection })}
          />
        )}
        {currentStep === 2 && (
          <FocusAreasStep
            focusAreas={session.focus_areas}
            onChange={(focus_areas) => scheduleSave({ ...session, focus_areas })}
          />
        )}
        {currentStep === 3 && (
          <FutureSelfStep
            futureSelf={session.future_self}
            onChange={(future_self) => scheduleSave({ ...session, future_self })}
          />
        )}
        {currentStep === 4 && (
          <GoalsBreakdownStep
            goals={session.goals}
            onChange={(goals) => scheduleSave({ ...session, goals })}
          />
        )}
        {currentStep === 5 && (
          <InventoryStep
            otherTasks={session.other_tasks}
            onChange={(other_tasks) => scheduleSave({ ...session, other_tasks })}
          />
        )}
        {currentStep === 6 && (
          <RocksSortStep
            inventory={inventory}
            rockSort={session.rock_sort}
            onChange={(rock_sort) => scheduleSave({ ...session, rock_sort })}
          />
        )}
        {currentStep === 7 && (
          <EisenhowerMatrixStep
            matrix={session.matrix}
            onChange={(matrix) => scheduleSave({ ...session, matrix })}
          />
        )}
        {currentStep === 8 && (
          <MatrixReflectionStep
            matrixReflection={session.matrix_reflection}
            onChange={(matrix_reflection) => scheduleSave({ ...session, matrix_reflection })}
          />
        )}
        {currentStep === 9 && (
          <SummaryStep
            session={session}
            onComplete={handleComplete}
            completing={completing}
            completed={isCompleted}
            actionsCreated={actionsCreated}
          />
        )}

        {!isCompleted && currentStep < TOTAL_STEPS && (
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep <= 1 || saving}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canContinue || saving}
              className="gap-1"
            >
              {currentStep === 8 ? "Review Summary" : "Continue"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
