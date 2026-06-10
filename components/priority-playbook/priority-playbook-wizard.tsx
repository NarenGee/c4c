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
import { Target, ChevronLeft, ChevronRight, AlertCircle, Pencil } from "lucide-react"
import {
  completePlaybook,
  getOrCreateSession,
  prepareStepData,
  savePlaybookSession,
  startNewPlaybookSession,
  updateCompletedPlaybook,
} from "@/app/actions/priority-playbook"
import {
  type PlaybookGoal,
  type PriorityPlaybookSession,
  TOTAL_STEPS,
  STEP_TITLES,
  collectInventoryItems,
  collectRockSortItems,
  getDisplayStep,
  goalsFromAccomplishments,
  normalizeGoal,
  withDisplayStep,
} from "@/lib/priority-playbook/types"
import { getStepBlockers, isStepValid } from "@/lib/priority-playbook/validation"
import { ReflectionStep } from "./steps/reflection-step"
import { FocusAreasStep } from "./steps/focus-areas-step"
import { FocusAreasReviewStep } from "./steps/focus-areas-review-step"
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
  const [isEditing, setIsEditing] = useState(false)
  const [editStep, setEditStep] = useState(1)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionRef = useRef<PriorityPlaybookSession | null>(null)
  const stepPrepRef = useRef<number | null>(null)
  const isEditingRef = useRef(false)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    stepPrepRef.current = null
  }, [session?.id])

  useEffect(() => {
    if (!session) return
    if (session.status !== "in_progress" && !isEditing) return

    const step = isEditing ? editStep : getDisplayStep(session)
    if (step !== 7 && step !== 8) return
    if (stepPrepRef.current === step) return

    const inventory = collectInventoryItems(session)
    const rockItems = collectRockSortItems(session.rock_sort)
    const needsRockPrep =
      step === 7 && inventory.length > 0 && rockItems.length < inventory.length
    const needsMatrixPrep =
      step === 8 && rockItems.length > 0 && session.matrix.length < rockItems.length

    if (!needsRockPrep && !needsMatrixPrep) return

    stepPrepRef.current = step
    let cancelled = false

    prepareStepData(session, step).then((result) => {
      if (cancelled || !result.success || !result.session) return
      const next = isEditing ? result.session : withDisplayStep(result.session, step)
      setSession(next)
    })

    return () => {
      cancelled = true
    }
  }, [session, isEditing, editStep])

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

  type SessionUpdate =
    | PriorityPlaybookSession
    | ((prev: PriorityPlaybookSession) => PriorityPlaybookSession)

  const scheduleGoalsSave = useCallback((goals: PlaybookGoal[]) => {
    setSession((prev) => {
      if (!prev) return prev
      const updated = { ...prev, goals: goals.map(normalizeGoal) }

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

      return updated
    })
  }, [])

  const scheduleSave = useCallback((update: SessionUpdate) => {
    setSession((prev) => {
      if (!prev) return prev
      const updated = typeof update === "function" ? update(prev) : update
      const shouldPersist =
        updated.status === "in_progress" ||
        (updated.status === "completed" && isEditingRef.current)

      if (!shouldPersist) return updated

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

      return updated
    })
  }, [])

  const flushSave = useCallback(async (snapshot: PriorityPlaybookSession) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setSaving(true)
    const result = await savePlaybookSession(snapshot)
    setSaving(false)
    if (!result.success) {
      setError(result.error || "Failed to save")
      return null
    }
    if (result.session) {
      setSession(result.session)
      return result.session
    }
    return snapshot
  }, [])

  const handleNext = async () => {
    const current = sessionRef.current
    if (!current) return

    setError(null)
    const displayStep = isEditing ? editStep : getDisplayStep(current)
    const nextStep = Math.min(displayStep + 1, TOTAL_STEPS)

    let updated = isEditing ? withDisplayStep(current, nextStep) : withDisplayStep(current, nextStep)

    if (nextStep === 5 && updated.goals.length === 0) {
      updated.goals = goalsFromAccomplishments(updated.future_self.accomplishments)
    }

    if (nextStep === 6 && updated.other_tasks.length === 0) {
      updated.other_tasks = [{ id: crypto.randomUUID(), text: "", source: "other" }]
    }

    const prepResult = await prepareStepData(updated, nextStep)
    if (!prepResult.success || !prepResult.session) {
      setError(prepResult.error || "Failed to prepare the next step")
      return
    }

    updated = withDisplayStep(prepResult.session, nextStep)
    const saved = await flushSave(updated)
    if (!saved) return

    if (isEditing) {
      setEditStep(nextStep)
    }
  }

  const handleBack = async () => {
    const current = sessionRef.current
    if (!current) return

    const displayStep = isEditing ? editStep : getDisplayStep(current)
    if (displayStep <= 1) return

    setError(null)
    const nextDisplayStep = displayStep - 1
    const updated =
      displayStep === TOTAL_STEPS
        ? {
            ...current,
            current_step: 9,
            matrix_reflection: { ...current.matrix_reflection, reviewStarted: false },
          }
        : withDisplayStep(current, nextDisplayStep)

    const saved = await flushSave(updated)
    if (!saved) return

    if (isEditing) {
      setEditStep(nextDisplayStep)
    }
  }

  const handleSaveEdits = async () => {
    const current = sessionRef.current
    if (!current) return
    setCompleting(true)
    setError(null)

    const saved = await flushSave(current)
    if (!saved) {
      setCompleting(false)
      return
    }

    const result = await updateCompletedPlaybook(saved)
    if (result.success && result.session) {
      setSession(result.session)
      setActionsCreated(result.actionsCreated ?? 0)
      setIsEditing(false)
      setEditStep(TOTAL_STEPS)
    } else {
      setError(result.error || "Failed to save changes")
    }
    setCompleting(false)
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditStep(6)
    setActionsCreated(0)
    setError(null)
    stepPrepRef.current = null
  }

  const handleCancelEdit = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setIsEditing(false)
    setEditStep(TOTAL_STEPS)
    setError(null)
    await loadSession()
  }
  const handleComplete = async () => {
    const current = sessionRef.current
    if (!current) return
    setCompleting(true)
    setError(null)

    const saved = await flushSave(current)
    if (!saved) {
      setCompleting(false)
      return
    }

    const result = await completePlaybook(saved.id)
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
      setIsEditing(false)
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
  const isEditingCompleted = isCompleted && isEditing
  const currentStep = isEditingCompleted
    ? editStep
    : isCompleted
      ? TOTAL_STEPS
      : getDisplayStep(session)
  const progress = (currentStep / TOTAL_STEPS) * 100
  const canContinue = isStepValid(session, currentStep)
  const stepBlockers =
    (!isCompleted || isEditingCompleted) && currentStep < TOTAL_STEPS
      ? getStepBlockers(session, currentStep)
      : []
  const showStepNav = !isCompleted || isEditingCompleted

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
        {!isCompleted || isEditingCompleted ? (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>
                {isEditingCompleted ? "Editing — " : ""}
                Step {currentStep} of {TOTAL_STEPS}: {STEP_TITLES[currentStep]}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-700" />
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="p-4 sm:p-6 lg:p-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isCompleted && !isEditing && (
          <div className="mb-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit Playbook
            </Button>
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

        {isEditingCompleted && (
          <div className="mb-6 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              Exit edit mode
            </Button>
          </div>
        )}

        {currentStep === 1 && (
          <ReflectionStep
            reflection={session.reflection}
            onChange={(reflection) => scheduleSave((prev) => ({ ...prev, reflection }))}
          />
        )}
        {currentStep === 2 && (
          <FocusAreasStep
            focusAreas={session.focus_areas}
            onChange={(focus_areas) => scheduleSave((prev) => ({ ...prev, focus_areas }))}
          />
        )}
        {currentStep === 3 && (
          <FocusAreasReviewStep focusAreas={session.focus_areas} />
        )}
        {currentStep === 4 && (
          <FutureSelfStep
            futureSelf={session.future_self}
            focusAreas={session.focus_areas}
            onChange={(future_self) => scheduleSave((prev) => ({ ...prev, future_self }))}
          />
        )}
        {currentStep === 5 && (
          <GoalsBreakdownStep
            goals={session.goals}
            onChange={(goals) => scheduleSave((prev) => ({ ...prev, goals }))}
          />
        )}
        {currentStep === 6 && (
          <InventoryStep
            otherTasks={session.other_tasks}
            onChange={(other_tasks) => scheduleSave((prev) => ({ ...prev, other_tasks }))}
          />
        )}
        {currentStep === 7 && (
          <RocksSortStep
            inventory={inventory}
            rockSort={session.rock_sort}
            goals={session.goals}
            onChange={(rock_sort) => scheduleSave((prev) => ({ ...prev, rock_sort }))}
          />
        )}
        {currentStep === 8 && (
          <EisenhowerMatrixStep
            matrix={session.matrix}
            goals={session.goals}
            onChange={(matrix) => scheduleSave((prev) => ({ ...prev, matrix }))}
          />
        )}
        {currentStep === 9 && (
          <MatrixReflectionStep
            matrixReflection={session.matrix_reflection}
            onChange={(matrix_reflection) => scheduleSave((prev) => ({ ...prev, matrix_reflection }))}
          />
        )}
        {currentStep === 10 && (
          <SummaryStep
            session={session}
            onComplete={handleComplete}
            onSaveEdits={handleSaveEdits}
            onEditPlaybook={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onGoalsChange={scheduleGoalsSave}
            completing={completing}
            completed={isCompleted}
            isEditing={isEditingCompleted}
            actionsCreated={actionsCreated}
          />
        )}

        {showStepNav && currentStep < TOTAL_STEPS && (
          <div className="mt-8 pt-6 border-t space-y-3">
            {!canContinue && stepBlockers.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {stepBlockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between">
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
                {currentStep === 9 ? "Review Summary" : "Continue"}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
