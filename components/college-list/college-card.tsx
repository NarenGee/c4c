"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Star, 
  Edit3, 
  Trash2, 
  Plus, 
  CheckCircle,
  X,
  Save,
  DollarSign,
  Building,
  GripVertical,
  MoreVertical,
  ExternalLink,
  TrendingUp,
  Users,
  RefreshCw
} from "lucide-react"
import { 
  removeCollegeFromList, 
  toggleCollegeFavorite, 
  updateCollegeInList,
  updateCollegeTasks,
  type CollegeListItem,
  type Task 
} from "@/app/actions/college-list"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getStudentCollegeMatches, CollegeMatch, updateDreamCollegeDetails } from "@/lib/college-matching-client"

interface CollegeCardProps {
  college: CollegeListItem
  onUpdate: () => void
  onDragStart: (e: React.DragEvent) => void
  isDragging: boolean
}

export function CollegeCard({ college, onUpdate, onDragStart, isDragging }: CollegeCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  // Recommendation state
  const [recommendation, setRecommendation] = useState<CollegeMatch | null>(null)
  const [recLoading, setRecLoading] = useState(false)
  // Notes state (always blank by default)
  const [editNotes, setEditNotes] = useState("")
  const [notesLoading, setNotesLoading] = useState(false)
  const [newTaskText, setNewTaskText] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEditNotes("") // Always blank by default
    setRecLoading(true)
    getStudentCollegeMatches().then(res => {
      if (res.success && res.matches) {
        // Match by college_name (case-insensitive, trim), and city/country if available
        const match = res.matches.find(m =>
          m.college_name.trim().toLowerCase() === college.college_name.trim().toLowerCase() &&
          (!m.city || !college.college_location || college.college_location.toLowerCase().includes(m.city.toLowerCase()))
        )
        setRecommendation(match || null)
      }
      setRecLoading(false)
    })
  }, [college.college_name, college.college_location])

  // Save notes handler
  const handleSaveNotes = async () => {
    setNotesLoading(true)
    try {
      await updateCollegeInList(college.id, { notes: editNotes })
      onUpdate()
    } catch (error) {
      console.error("Failed to update notes:", error)
    } finally {
      setNotesLoading(false)
    }
  }

  // Add task handler
  const handleAddTask = async () => {
    if (!newTaskText.trim()) return
    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
      created_at: new Date().toISOString()
    }
    const updatedTasks = [...(college.tasks || []), newTask]
    setLoading(true)
    try {
      await updateCollegeTasks(college.id, updatedTasks)
      setNewTaskText("")
      onUpdate()
    } catch (error) {
      console.error("Failed to add task:", error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle task completion
  const handleToggleTask = async (taskId: string) => {
    const updatedTasks = (college.tasks || []).map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )
    setLoading(true)
    try {
      await updateCollegeTasks(college.id, updatedTasks)
      onUpdate()
    } catch (error) {
      console.error("Failed to update task:", error)
    } finally {
      setLoading(false)
    }
  }

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks = (college.tasks || []).filter(task => task.id !== taskId)
    setLoading(true)
    try {
      await updateCollegeTasks(college.id, updatedTasks)
      onUpdate()
    } catch (error) {
      console.error("Failed to delete task:", error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh Dream College details handler
  const handleRefreshDreamCollege = async () => {
    if (!recommendation?.is_dream_college) return
    
    setRecLoading(true)
    try {
      const result = await updateDreamCollegeDetails(college.college_name)
      if (result.success) {
        // Refresh the recommendation data
        const res = await getStudentCollegeMatches()
        if (res.success && res.matches) {
          const match = res.matches.find(m =>
            m.college_name.trim().toLowerCase() === college.college_name.trim().toLowerCase() &&
            (!m.city || !college.college_location || college.college_location.toLowerCase().includes(m.city.toLowerCase()))
          )
          setRecommendation(match || null)
        }
      } else {
        console.error("Failed to refresh dream college details:", result.error)
      }
    } catch (error) {
      console.error("Error refreshing dream college details:", error)
    } finally {
      setRecLoading(false)
    }
  }

  return (
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <Card
        className={`cursor-move bg-white border border-slate-200 shadow-md rounded-xl transition-all duration-200 hover:shadow-lg ${isDragging ? 'opacity-50 scale-95' : ''}`}
        draggable
        onDragStart={onDragStart}
      >
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center w-full mb-1">
                  <GripVertical className="h-5 w-5 text-blue-400 cursor-grab" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-800 text-white text-xs rounded shadow px-3 py-2">
                Drag to move this college to a different stage.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-full min-w-0 flex flex-col items-center">
            <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 leading-tight break-words text-center">
              {college.college_name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 justify-center">
              {college.college_location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-slate-600 break-words">{college.college_location}</span>
                </div>
              )}
              {recommendation?.is_dream_college && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm text-xs px-2 py-1">
                  <Star className="h-2 w-2 mr-1" />
                  Dream
                </Badge>
              )}
            </div>
          </div>
          <div className="w-full flex justify-center mt-4">
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-full border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold shadow-sm">
                More
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
      </Card>
      <DialogContent className="max-w-3xl w-full sm:w-[95vw] p-0 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[80vh]">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Details Section */}
          <div className="flex-1 p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">{college.college_name}</DialogTitle>
              {college.college_location && (
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{college.college_location}</span>
                </div>
              )}
            </DialogHeader>
            {/* Notes & Tasks Section (moved above recommendation) */}
            <div>
              <div className="font-semibold text-slate-800 mb-2 text-lg flex items-center gap-2">Notes</div>
              <Textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={4}
                className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200"
                placeholder="Add your notes about this college..."
                disabled={notesLoading}
              />
              <Button size="sm" className="mt-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow" onClick={handleSaveNotes} disabled={notesLoading}>
                {notesLoading ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
            <Separator className="my-2" />
            <div>
              <div className="font-semibold text-slate-800 mb-2 text-lg flex items-center gap-2">Tasks</div>
              <div className="space-y-2">
                {(college.tasks || []).length === 0 && <div className="text-xs text-slate-500">No tasks yet.</div>}
                {(college.tasks || []).map(task => (
                  <div key={task.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                    <Checkbox checked={task.completed} onCheckedChange={() => handleToggleTask(task.id)} />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.text}</span>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteTask(task.id)} className="h-7 w-7 text-red-500"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1 border-slate-300 rounded-lg shadow-sm"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTask() }}
                  />
                  <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow" onClick={handleAddTask} disabled={loading || !newTaskText.trim()}>Add</Button>
                </div>
              </div>
            </div>
            <Separator className="my-2" />
            {/* Recommendation Card (read-only) */}
            {recLoading ? (
              <div className="text-slate-500 text-sm">Loading recommendation...</div>
            ) : recommendation ? (
              <div className="bg-slate-700 rounded-xl shadow-md mb-4 overflow-hidden">
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-bold text-lg sm:text-xl text-white">
                          {recommendation.website_url ? (
                            <a href={recommendation.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 hover:underline flex items-center gap-2">
                              {recommendation.college_name}
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            recommendation.college_name
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300 border">
                            {recommendation.fit_category}
                          </Badge>
                          {recommendation.is_dream_college && (
                            <>
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                                <Star className="h-3 w-3 mr-1" />
                                Dream
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRefreshDreamCollege}
                                disabled={recLoading}
                                className="h-7 px-2 bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200"
                              >
                                <RefreshCw className={`h-3 w-3 ${recLoading ? 'animate-spin' : ''}`} />
                                <span className="ml-1 text-xs">Refresh</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-300 mb-3">
                        {recommendation.city && recommendation.country && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {recommendation.city}, {recommendation.country}
                          </span>
                        )}
                        {recommendation.program_type && (
                          <Badge variant="secondary" className="bg-slate-600 text-slate-200 border-slate-500">
                            {recommendation.program_type}
                          </Badge>
                        )}
                        {recommendation.campus_setting && (
                          <span className="text-xs">{recommendation.campus_setting} Campus</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-stretch mb-6 p-4 bg-gradient-to-r from-blue-50 via-slate-50 to-blue-100 rounded-2xl shadow-lg gap-0 hover:shadow-xl transition-shadow duration-200">
                    <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl font-extrabold text-blue-700 drop-shadow-sm">{Math.round((recommendation.admission_chance || 0) * 100)}%</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Admission Chance</div>
                    </div>
                    <div className="hidden sm:block w-px bg-slate-200 mx-1 my-2 rounded-full" />
                    <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-3xl font-extrabold text-green-700 drop-shadow-sm">{Math.round((recommendation.match_score || 0) * 100)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Match Score</div>
                    </div>
                    <div className="hidden sm:block w-px bg-slate-200 mx-1 my-2 rounded-full" />
                    <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-5 w-5 text-amber-500" />
                        <span className="text-3xl font-extrabold text-amber-600 drop-shadow-sm">{recommendation.acceptance_rate ? Math.round(recommendation.acceptance_rate * 100) + '%' : '--'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Acceptance Rate</div>
                    </div>
                    <div className="hidden sm:block w-px bg-slate-200 mx-1 my-2 rounded-full" />
                    <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-slate-500" />
                        <span className="text-3xl font-extrabold text-slate-700 drop-shadow-sm">{recommendation.student_count ? recommendation.student_count.toLocaleString() : '--'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Students</div>
                    </div>
                  </div>
                  {/* Justification and details */}
                  {recommendation.justification && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-3">Why This is a Great Match:</h4>
                      <p className="text-sm text-slate-700 mb-4 leading-relaxed">{recommendation.justification}</p>
                    </div>
                  )}
                  {recommendation.match_reasons && recommendation.match_reasons.length > 0 && (
                    <div className="pt-3 border-t border-blue-200">
                      <h5 className="font-medium text-slate-800 text-sm mb-2">Coaching for College Recommendation Engine Match Reasons:</h5>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.match_reasons.map((reason, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-white border-blue-200 text-blue-800">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(recommendation.estimated_cost || recommendation.tuition_annual) && (
                    <div className="flex items-center gap-4 mb-4 p-3 bg-green-50 rounded-lg">
                      <span className="flex items-center gap-2 text-green-700 font-medium">
                        <DollarSign className="h-4 w-4" />
                        Annual Cost: {recommendation.estimated_cost || recommendation.tuition_annual}
                      </span>
                    </div>
                  )}
                  {recommendation.admission_requirements && (
                    <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg mb-4">
                      <span className="font-medium text-slate-800">Admission Requirements:</span>
                      <span className="ml-2">{recommendation.admission_requirements}</span>
                    </div>
                  )}
                  {recommendation.source_links && recommendation.source_links.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {recommendation.source_links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Details
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 border-t pt-3">
                    Generated on {new Date(recommendation.generated_at || Date.now()).toLocaleDateString()} at {new Date(recommendation.generated_at || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 