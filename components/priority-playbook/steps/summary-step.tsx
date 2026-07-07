"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, ChevronLeft, Pencil, Download } from "lucide-react"
import type { PlaybookGoal, PriorityPlaybookSession } from "@/lib/priority-playbook/types"
import { PlaybookSummaryDocument } from "../playbook-summary-document"
import { PlaybookSummaryContent } from "../playbook-summary-content"
import { PlaybookGanttChart } from "../playbook-gantt-chart"
import { downloadPlaybookSummaryPdf } from "@/lib/priority-playbook/download-summary-pdf"

interface SummaryStepProps {
  session: PriorityPlaybookSession
  studentName: string
  onComplete: () => void
  onSaveEdits?: () => void
  onEditPlaybook?: () => void
  onCancelEdit?: () => void
  onGoalsChange?: (goals: PlaybookGoal[]) => void
  completing: boolean
  completed: boolean
  isEditing?: boolean
  actionsCreated?: number
}

export function SummaryStep({
  session,
  studentName,
  onComplete,
  onSaveEdits,
  onEditPlaybook,
  onCancelEdit,
  onGoalsChange,
  completing,
  completed,
  isEditing = false,
  actionsCreated = 0,
}: SummaryStepProps) {
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const pdfCaptureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportingPdf) return

    let cancelled = false

    ;(async () => {
      for (let attempt = 0; attempt < 30; attempt++) {
        if (pdfCaptureRef.current) break
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      if (cancelled || !pdfCaptureRef.current) {
        setPdfError("Could not prepare the PDF. Please try again.")
        setExportingPdf(false)
        setDownloadingPdf(false)
        return
      }

      try {
        await downloadPlaybookSummaryPdf({
          element: pdfCaptureRef.current,
          studentName,
          sessionNumber: session.session_number,
        })
      } catch (error) {
        console.error("Failed to generate playbook summary PDF:", error)
        if (!cancelled) {
          setPdfError("Could not generate the PDF. Please try again.")
        }
      } finally {
        if (!cancelled) {
          setExportingPdf(false)
          setDownloadingPdf(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [exportingPdf, studentName, session.session_number])

  const handleDownloadPdf = () => {
    setPdfError(null)
    setDownloadingPdf(true)
    setExportingPdf(true)
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Review Your Changes</h2>
          <p className="text-slate-600 text-sm mt-1 max-w-xl mx-auto">
            Save to update your playbook and sync any new tasks to your dashboard.
            Tasks removed here stay on your dashboard until you delete them there.
          </p>
        </div>

        <PlaybookSummaryContent session={session} />

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button variant="outline" onClick={onCancelEdit} disabled={completing}>
            Cancel
          </Button>
          <Button size="lg" onClick={onSaveEdits} disabled={completing} className="gap-2">
            {completing ? "Saving..." : "Save Changes & Sync to Dashboard"}
            <CheckCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  if (completed && !showFullSummary) {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-3">
          <CheckCircle className="h-14 w-14 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-800">Priority Playbook Complete!</h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            {actionsCreated > 0
              ? `${actionsCreated} prioritized action${actionsCreated === 1 ? "" : "s"} have been added to your dashboard.`
              : "Your playbook has been saved."}
          </p>
        </div>

        <PlaybookGanttChart goals={session.goals} onChange={onGoalsChange} />

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/dashboard">
            <Button className="gap-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {onEditPlaybook && (
            <Button variant="outline" onClick={onEditPlaybook} className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit Playbook
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowFullSummary(true)}>
            View Summary
          </Button>
        </div>
      </div>
    )
  }

  if (completed && showFullSummary) {
    return (
      <>
        {exportingPdf && (
          <div className="fixed inset-0 z-[999999] overflow-auto bg-white">
            <div className="px-6 py-8">
              <div
                ref={pdfCaptureRef}
                className="mx-auto w-full max-w-5xl min-w-[1024px]"
              >
                <PlaybookSummaryDocument
                  session={session}
                  studentName={studentName}
                  captureMode
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Your Priority Playbook Summary</h2>
              <p className="text-slate-600 text-sm mt-1">
                Review your completed playbook or edit it to update tasks and priorities.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 self-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                {downloadingPdf ? "Generating PDF..." : "Download PDF"}
              </Button>
              {onEditPlaybook && (
                <Button variant="outline" size="sm" onClick={onEditPlaybook} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Playbook
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowFullSummary(false)} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          {pdfError && <p className="text-sm text-red-600">{pdfError}</p>}

          {!exportingPdf && (
            <div className="space-y-6">
              <PlaybookGanttChart goals={session.goals} onChange={onGoalsChange} />
              <PlaybookSummaryContent session={session} />
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Link href="/dashboard">
              <Button className="gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800">Review Your Priority Playbook</h2>
        <p className="text-slate-600 text-sm mt-1">
          Confirm everything looks right, then complete to sync your prioritized actions to the dashboard.
        </p>
      </div>

      <PlaybookSummaryContent session={session} />

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onComplete} disabled={completing} className="gap-2">
          {completing ? "Completing..." : "Complete Playbook & Sync to Dashboard"}
          <CheckCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
