"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, Plus, Trash2, ListTodo } from "lucide-react"
import {
  assignBarLanes,
  assignTaskBarLanes,
  buildMilestoneBars,
  buildTaskBars,
  computeGoalRowLayout,
  computeTimelineRange,
  formatBarDateRange,
  formatTimelineMonth,
  getTimelineMonthSpans,
  getTimelineWidthPx,
  GOAL_COLUMN_MIN_WIDTH_PX,
  MILESTONE_BAR_HEIGHT_PX,
  MILESTONE_TASK_GAP_PX,
  TASK_BAR_HEIGHT_PX,
  TASK_LANE_HEIGHT_PX,
  getGoalSwimlaneColor,
} from "@/lib/priority-playbook/gantt"
import {
  computeAutoMilestoneStatus,
  getEffectiveMilestoneStatus,
  getMilestoneStatusOption,
  isGoalComplete,
  isMilestoneStatusManual,
  MILESTONE_STATUS_OPTIONS,
  type MilestoneStatus,
} from "@/lib/priority-playbook/milestone-status"
import {
  createEmptyGoal,
  createMilestone,
  getMilestoneTasks,
  normalizeGoal,
  normalizeMilestones,
  type PlaybookGoal,
  type PlaybookMilestone,
} from "@/lib/priority-playbook/types"
import { MilestoneTaskList } from "./milestone-task-list"
import { MilestoneDatePicker } from "./milestone-date-picker"
import { NO_AUTOCORRECT_PROPS } from "./no-autocorrect"
import { normalizeMilestoneDateRange, formatMilestoneRangeLabel } from "@/lib/priority-playbook/milestone-dates"
import { cn } from "@/lib/utils"

interface PlaybookGanttChartProps {
  goals: PlaybookGoal[]
  onChange?: (goals: PlaybookGoal[]) => void
  readOnly?: boolean
}

type SelectedMilestone = {
  goalId: string
  milestoneId: string
}

export function PlaybookGanttChart({
  goals,
  onChange,
  readOnly = false,
}: PlaybookGanttChartProps) {
  const [selected, setSelected] = useState<SelectedMilestone | null>(null)
  const editable = !readOnly && !!onChange

  const normalizedGoals = useMemo(() => goals.map(normalizeGoal), [goals])
  const range = useMemo(() => computeTimelineRange(normalizedGoals), [normalizedGoals])
  const monthSpans = useMemo(() => getTimelineMonthSpans(range), [range])
  const timelineWidthPx = useMemo(
    () => getTimelineWidthPx(monthSpans.length),
    [monthSpans.length]
  )
  const bars = useMemo(
    () => assignBarLanes(buildMilestoneBars(normalizedGoals, range)),
    [normalizedGoals, range]
  )
  const selectedTaskBars = useMemo(
    () =>
      selected?.milestoneId
        ? assignTaskBarLanes(buildTaskBars(normalizedGoals, range, selected.milestoneId))
        : [],
    [normalizedGoals, range, selected?.milestoneId]
  )

  const selectedGoal = selected
    ? normalizedGoals.find((goal) => goal.id === selected.goalId)
    : undefined
  const selectedMilestone = selectedGoal
    ? normalizeMilestones(selectedGoal.milestones).find((m) => m.id === selected.milestoneId)
    : undefined
  const selectedGoalIndex = selectedGoal
    ? normalizedGoals.findIndex((goal) => goal.id === selectedGoal.id)
    : -1

  const updateGoals = (nextGoals: PlaybookGoal[]) => {
    onChange?.(nextGoals.map(normalizeGoal))
  }

  const updateGoal = (goalId: string, patch: Partial<PlaybookGoal>) => {
    updateGoals(
      normalizedGoals.map((goal) => (goal.id === goalId ? normalizeGoal({ ...goal, ...patch }) : goal))
    )
  }

  const updateMilestone = (
    goalId: string,
    milestoneId: string,
    patch: Partial<PlaybookMilestone>
  ) => {
    const goal = normalizedGoals.find((entry) => entry.id === goalId)
    if (!goal) return

    const milestones = normalizeMilestones(goal.milestones).map((milestone) => {
      if (milestone.id !== milestoneId) return milestone

      const merged = { ...milestone, ...patch }
      if (patch.startDate !== undefined || patch.endDate !== undefined) {
        const normalized = normalizeMilestoneDateRange(merged.startDate, merged.endDate)
        return { ...merged, ...normalized }
      }
      return merged
    })

    updateGoal(goalId, { milestones })
  }

  const addGoal = () => {
    const goal = createEmptyGoal()
    updateGoals([...normalizedGoals, goal])
    const firstMilestone = goal.milestones[0]
    if (firstMilestone?.id) {
      setSelected({ goalId: goal.id, milestoneId: firstMilestone.id })
    }
  }

  const removeGoal = (goalId: string) => {
    if (normalizedGoals.length <= 1) return
    updateGoals(normalizedGoals.filter((goal) => goal.id !== goalId))
    if (selected?.goalId === goalId) setSelected(null)
  }

  const addMilestone = (goalId: string) => {
    const goal = normalizedGoals.find((entry) => entry.id === goalId)
    if (!goal) return

    const newMilestone = createMilestone()
    updateGoal(goalId, {
      milestones: [...normalizeMilestones(goal.milestones), newMilestone],
    })
    if (newMilestone.id) {
      setSelected({ goalId, milestoneId: newMilestone.id })
    }
  }

  const removeMilestone = (goalId: string, milestoneId: string) => {
    const goal = normalizedGoals.find((entry) => entry.id === goalId)
    if (!goal) return

    const milestones = normalizeMilestones(goal.milestones)
    if (milestones.length <= 1) return

    updateGoal(goalId, {
      milestones: milestones.filter((milestone) => milestone.id !== milestoneId),
    })
    if (selected?.milestoneId === milestoneId) setSelected(null)
  }

  const barsByGoal = useMemo(() => {
    const map = new Map<string, typeof bars>()
    for (const bar of bars) {
      const existing = map.get(bar.goalId) ?? []
      existing.push(bar)
      map.set(bar.goalId, existing)
    }
    return map
  }, [bars])

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Goal Timeline</CardTitle>
            <CardDescription>
              Milestones grouped by goal. Click a milestone to reveal its tasks on the timeline and
              open details.
            </CardDescription>
          </div>
          {editable && (
            <Button type="button" variant="outline" size="sm" onClick={addGoal} className="gap-1 shrink-0">
              <Plus className="h-4 w-4" />
              Add goal
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {normalizedGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">No goals yet.</p>
            {editable && (
              <Button type="button" variant="outline" size="sm" onClick={addGoal} className="mt-3 gap-1">
                <Plus className="h-4 w-4" />
                Add your first goal
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200">
            <ScrollArea className="w-full">
              <div
                className="min-w-full"
                style={{ minWidth: `${GOAL_COLUMN_MIN_WIDTH_PX + timelineWidthPx}px` }}
              >
                <div
                  className="grid border-b border-slate-200 bg-slate-50"
                  style={{ gridTemplateColumns: `${GOAL_COLUMN_MIN_WIDTH_PX}px ${timelineWidthPx}px` }}
                >
                  <div className="px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide border-r border-slate-200">
                    Goal
                  </div>
                  <div className="flex h-10 border-l border-slate-200">
                    {monthSpans.map(({ month, widthPercent }) => (
                      <div
                        key={month.toISOString()}
                        className="flex items-center border-r border-slate-200 px-2 last:border-r-0 overflow-hidden"
                        style={{ width: `${widthPercent}%`, flexShrink: 0 }}
                      >
                        <span className="text-xs font-medium text-slate-500 truncate">
                          {formatTimelineMonth(month)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {normalizedGoals.map((goal, goalIndex) => {
                  const goalComplete = isGoalComplete(goal)
                  const goalBars = barsByGoal.get(goal.id) ?? []
                  const selectedBarInGoal =
                    selected?.goalId === goal.id
                      ? goalBars.find((bar) => bar.milestoneId === selected.milestoneId)
                      : undefined
                  const taskBarsInGoal =
                    selectedBarInGoal && selectedTaskBars.length > 0 ? selectedTaskBars : []
                  const rowLayout = computeGoalRowLayout(goalBars, selectedBarInGoal, taskBarsInGoal)
                  const goalColor = getGoalSwimlaneColor(goalIndex)

                  return (
                    <div
                      key={goal.id}
                      className="grid border-b border-slate-100 last:border-b-0"
                      style={{ gridTemplateColumns: `${GOAL_COLUMN_MIN_WIDTH_PX}px ${timelineWidthPx}px` }}
                    >
                      <div
                        className={cn(
                          "px-4 py-3 border-r border-slate-100 bg-white flex flex-col justify-center",
                          goalComplete && "bg-green-50/60"
                        )}
                        style={{ minHeight: `${rowLayout.rowHeightPx}px` }}
                      >
                        {editable ? (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Input
                                value={goal.title}
                                onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
                                placeholder="Goal title"
                                className="h-9 text-sm font-medium flex-1"
                                {...NO_AUTOCORRECT_PROPS}
                              />
                              {goalComplete && (
                                <Badge className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Complete
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1"
                                onClick={() => addMilestone(goal.id)}
                              >
                                <Plus className="h-3 w-3" />
                                Milestone
                              </Button>
                              {normalizedGoals.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                  onClick={() => removeGoal(goal.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <p className="text-sm font-semibold leading-snug break-words text-slate-800">
                              {goal.title || "—"}
                            </p>
                            {goalComplete && (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Complete
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className={cn(
                          "relative bg-slate-50/50 border-l border-slate-100 transition-[height] duration-200 ease-out",
                          rowLayout.isExpanded ? "overflow-visible z-10" : "overflow-hidden"
                        )}
                        style={{ height: `${rowLayout.rowHeightPx}px` }}
                      >
                        <div className="absolute inset-0 flex pointer-events-none">
                          {monthSpans.map(({ month, widthPercent }) => (
                            <div
                              key={`${goal.id}-${month.toISOString()}`}
                              className="h-full border-r border-slate-100 last:border-r-0"
                              style={{ width: `${widthPercent}%`, flexShrink: 0 }}
                            />
                          ))}
                        </div>

                        {goalBars.length === 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center px-3">
                            <p className="text-xs text-slate-400 text-center">
                              {editable ? "Add a milestone to plot on the timeline" : "No milestones"}
                            </p>
                          </div>
                        ) : (
                          goalBars.map((bar) => {
                            const isSelected =
                              selected?.goalId === bar.goalId &&
                              selected?.milestoneId === bar.milestoneId
                            const statusOption = getMilestoneStatusOption(bar.status)
                            const topPx = rowLayout.getMilestoneTopPx(bar)

                            return (
                              <button
                                key={bar.milestoneId}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelected(null)
                                    return
                                  }
                                  setSelected({ goalId: bar.goalId, milestoneId: bar.milestoneId })
                                }}
                                className={cn(
                                  "absolute rounded-md px-2 text-left text-xs font-medium text-white shadow-sm transition-all duration-200 hover:opacity-90",
                                  isSelected ? "z-30" : "z-10",
                                  !bar.hasExplicitDates &&
                                    "outline outline-1 outline-white/40 outline-offset-[-1px]"
                                )}
                                style={{
                                  left: `${bar.leftPercent}%`,
                                  width: `${bar.widthPercent}%`,
                                  minWidth: "4.5rem",
                                  maxWidth: `calc(100% - ${bar.leftPercent}%)`,
                                  top: `${topPx}px`,
                                  height: `${MILESTONE_BAR_HEIGHT_PX}px`,
                                  backgroundColor: statusOption.color,
                                  boxShadow: isSelected
                                    ? `0 0 0 2px white, 0 0 0 4px ${statusOption.ring}`
                                    : undefined,
                                }}
                                title={`${bar.title} (${statusOption.label})`}
                              >
                                <span className="block truncate leading-7">{bar.title}</span>
                              </button>
                            )
                          })
                        )}

                        {selectedBarInGoal && taskBarsInGoal.length > 0 && (
                          <div
                            className="absolute left-0 right-0 z-[15] border-t border-dashed border-slate-300 pointer-events-none"
                            style={{
                              top: `${rowLayout.selectedMilestoneTopPx + MILESTONE_BAR_HEIGHT_PX + MILESTONE_TASK_GAP_PX / 2}px`,
                            }}
                          />
                        )}

                        {taskBarsInGoal.map((taskBar) => {
                          const taskTopPx =
                            rowLayout.selectedMilestoneTopPx +
                            MILESTONE_BAR_HEIGHT_PX +
                            MILESTONE_TASK_GAP_PX +
                            taskBar.lane * TASK_LANE_HEIGHT_PX

                          return (
                            <button
                              key={taskBar.taskId}
                              type="button"
                              onClick={() =>
                                setSelected({
                                  goalId: taskBar.goalId,
                                  milestoneId: taskBar.milestoneId,
                                })
                              }
                              className={cn(
                                "absolute z-20 rounded px-2 text-left text-[11px] font-medium shadow-sm transition-opacity hover:opacity-90 border",
                                !taskBar.hasExplicitDates ? "border-dashed" : "border-solid"
                              )}
                              style={{
                                left: `${taskBar.leftPercent}%`,
                                width: `${taskBar.widthPercent}%`,
                                minWidth: "3.5rem",
                                maxWidth: `calc(100% - ${taskBar.leftPercent}%)`,
                                top: `${taskTopPx}px`,
                                height: `${TASK_BAR_HEIGHT_PX}px`,
                                backgroundColor: `${goalColor.bar}40`,
                                borderColor: goalColor.bar,
                                color: goalColor.label,
                              }}
                              title={taskBar.title}
                            >
                              <span className="block truncate leading-5">{taskBar.title}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {MILESTONE_STATUS_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: option.color }}
              />
              {option.label}
            </div>
          ))}
        </div>

        {!readOnly && (
          <p className="text-xs text-slate-500">
            Status updates automatically from dates unless you set it manually. At risk and Completed
            are manual only. A goal is marked complete when all titled milestones are Completed.
          </p>
        )}
      </CardContent>

      <Sheet
        modal={false}
        open={!!selectedMilestone}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <SheetContent side="right" overlay={false} className="w-full sm:max-w-md overflow-y-auto shadow-xl border-l">
          {selectedMilestone && selectedGoal && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">Milestone details</SheetTitle>
                <SheetDescription className="text-left">
                  {selectedGoal.title || "Untitled goal"}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {editable ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Milestone</label>
                      <Input
                        value={selectedMilestone.title}
                        onChange={(e) =>
                          updateMilestone(selectedGoal.id, selectedMilestone.id!, {
                            title: e.target.value,
                          })
                        }
                        placeholder="Milestone title"
                        {...NO_AUTOCORRECT_PROPS}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Status</label>
                      <Select
                        value={
                          isMilestoneStatusManual(selectedMilestone)
                            ? getEffectiveMilestoneStatus(selectedMilestone)
                            : "auto"
                        }
                        onValueChange={(value) => {
                          if (value === "auto") {
                            updateMilestone(selectedGoal.id, selectedMilestone.id!, {
                              statusManual: false,
                            })
                            return
                          }
                          updateMilestone(selectedGoal.id, selectedMilestone.id!, {
                            status: value as MilestoneStatus,
                            statusManual: true,
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-sm shrink-0 bg-gradient-to-br from-slate-300 to-blue-400" />
                              Automatic (based on dates)
                            </span>
                          </SelectItem>
                          {MILESTONE_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                                  style={{ backgroundColor: option.color }}
                                />
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        {isMilestoneStatusManual(selectedMilestone) ? (
                          <>Manual status — pick Automatic to follow milestone dates again.</>
                        ) : (
                          <>
                            Currently{" "}
                            <span className="font-medium">
                              {getMilestoneStatusOption(computeAutoMilestoneStatus(selectedMilestone)).label}
                            </span>{" "}
                            from dates (before start → Not started, during → In progress, after end →
                            Delayed).
                          </>
                        )}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Timeline</label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <MilestoneDatePicker
                          value={selectedMilestone.startDate}
                          onChange={(startDate) =>
                            updateMilestone(selectedGoal.id, selectedMilestone.id!, { startDate })
                          }
                          emptyLabel="Start date"
                          className="w-full"
                        />
                        <span className="text-xs text-slate-400 text-center">to</span>
                        <MilestoneDatePicker
                          value={selectedMilestone.endDate}
                          onChange={(endDate) =>
                            updateMilestone(selectedGoal.id, selectedMilestone.id!, { endDate })
                          }
                          emptyLabel="End date"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <MilestoneTaskList
                      label="Tasks for this milestone"
                      values={getMilestoneTasks(selectedMilestone)}
                      onChange={(tasks) =>
                        updateMilestone(selectedGoal.id, selectedMilestone.id!, { tasks })
                      }
                    />

                    {normalizeMilestones(selectedGoal.milestones).length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 gap-1"
                        onClick={() => removeMilestone(selectedGoal.id, selectedMilestone.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove milestone
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-lg font-semibold text-slate-800">
                        {selectedMilestone.title || "Untitled milestone"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(() => {
                          const effectiveStatus = getEffectiveMilestoneStatus(selectedMilestone)
                          const statusOption = getMilestoneStatusOption(effectiveStatus)
                          return (
                            <Badge
                              className="gap-1.5"
                              style={{
                                backgroundColor: `${statusOption.color}20`,
                                color: statusOption.color,
                              }}
                            >
                              <span
                                className="h-2 w-2 rounded-sm"
                                style={{ backgroundColor: statusOption.color }}
                              />
                              {statusOption.label}
                              {!isMilestoneStatusManual(selectedMilestone) && " (auto)"}
                            </Badge>
                          )
                        })()}
                        {selectedGoalIndex >= 0 && (
                          <Badge variant="secondary">Goal {selectedGoalIndex + 1}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Timeline: </span>
                      {formatBarDateRange(
                        bars.find((bar) => bar.milestoneId === selectedMilestone.id)?.start ?? new Date(),
                        bars.find((bar) => bar.milestoneId === selectedMilestone.id)?.end ?? new Date()
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ListTodo className="h-4 w-4" />
                        Tasks
                      </div>
                      <ul className="space-y-1">
                        {getMilestoneTasks(selectedMilestone)
                          .filter((task) => task.text.trim())
                          .map((task) => {
                            const dateLabel = formatMilestoneRangeLabel(task.startDate, task.endDate)
                            return (
                              <li
                                key={task.id}
                                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                              >
                                <span>{task.text}</span>
                                {dateLabel && (
                                  <span className="block text-xs text-slate-500 mt-0.5">{dateLabel}</span>
                                )}
                              </li>
                            )
                          })}
                        {getMilestoneTasks(selectedMilestone).filter((task) => task.text.trim()).length === 0 && (
                          <li className="text-sm text-slate-400">No tasks for this milestone.</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  )
}
