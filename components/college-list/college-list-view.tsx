"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getMyCollegeList,
  removeCollegeFromList,
  updateCollegeInList,
  type CollegeListItem,
} from "@/app/actions/college-list"
import { getStudentCollegeMatches, type CollegeMatch } from "@/lib/college-matching-client"
import { School, Trash2, MapPin, DollarSign, Users, Calendar, Edit3, Save, X, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface CollegeListViewProps {
  refreshTrigger?: number
}

export function CollegeListView({ refreshTrigger }: CollegeListViewProps) {
  const [colleges, setColleges] = useState<CollegeListItem[]>([])
  const [collegeMatches, setCollegeMatches] = useState<CollegeMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<CollegeListItem>>({})

  const loadCollegeMatches = async () => {
    try {
      const result = await getStudentCollegeMatches()
      if (result.success && result.matches) {
        setCollegeMatches(result.matches)
      }
    } catch (error) {
      console.error("Failed to load college matches:", error)
    }
  }

  const loadColleges = async () => {
    try {
      const result = await getMyCollegeList()
      if (result.success && result.data) {
        setColleges(result.data)
      }
    } catch (error) {
      console.error("Failed to load colleges:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (collegeId: string) => {
    setRemoving(collegeId)
    try {
      const result = await removeCollegeFromList(collegeId)
      if (result.success) {
        await loadColleges()
      }
    } catch (error) {
      console.error("Failed to remove college:", error)
    } finally {
      setRemoving(null)
    }
  }

  const handleEdit = (college: CollegeListItem) => {
    setEditing(college.id)
    setEditData(college)
  }

  const handleSaveEdit = async () => {
    if (!editing || !editData) return

    try {
      const result = await updateCollegeInList(editing, editData)
      if (result.success) {
        setEditing(null)
        setEditData({})
        await loadColleges()
      }
    } catch (error) {
      console.error("Failed to update college:", error)
    }
  }

  const handleCancelEdit = () => {
    setEditing(null)
    setEditData({})
  }

  useEffect(() => {
    loadColleges()
    loadCollegeMatches()
  }, [refreshTrigger])

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-red-100 text-red-800"
      case 2:
        return "bg-yellow-100 text-yellow-800"
      case 3:
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return "High"
      case 2:
        return "Medium"
      case 3:
        return "Low"
      default:
        return "Not Set"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      case "Waitlisted":
        return "bg-yellow-100 text-yellow-800"
      case "Submitted":
        return "bg-blue-100 text-blue-800"
      case "In Progress":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isDreamCollege = (collegeName: string): boolean => {
    return collegeMatches.some(match => 
      match.college_name.toLowerCase() === collegeName.toLowerCase() && 
      match.is_dream_college === true
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading your college list...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="bg-slate-800 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <School className="h-6 w-6" />
          My College List ({colleges.length})
        </CardTitle>
        <CardDescription className="text-slate-300">Track your college applications and preferences</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {colleges.length === 0 ? (
          <Alert>
            <School className="h-4 w-4" />
            <AlertDescription>
              Your college list is empty. Use the form above to add colleges you're interested in.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {colleges.map((college) => (
              <div key={college.id} className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                {editing === college.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">College Name</label>
                        <Input
                          value={editData.college_name || ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, college_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Location</label>
                        <Input
                          value={editData.college_location || ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, college_location: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium">Priority</label>
                        <Select
                          value={editData.priority?.toString() || "0"}
                          onValueChange={(value) =>
                            setEditData((prev) => ({ ...prev, priority: Number.parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Not Set</SelectItem>
                            <SelectItem value="1">High</SelectItem>
                            <SelectItem value="2">Medium</SelectItem>
                            <SelectItem value="3">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Application Status</label>
                        <Select
                          value={editData.application_status || "Considering"}
                          onValueChange={(value) => setEditData((prev) => ({ ...prev, application_status: value as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Considering">Considering</SelectItem>
                            <SelectItem value="Planning to Apply">Planning to Apply</SelectItem>
                            <SelectItem value="Applied">Applied</SelectItem>
                            <SelectItem value="Interviewing">Interviewing</SelectItem>
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Enrolled">Enrolled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Application Deadline</label>
                        <Input
                          type="date"
                          value={editData.application_deadline || ""}
                          onChange={(e) => setEditData((prev) => ({ ...prev, application_deadline: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={editData.notes || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 className="font-bold text-xl sm:text-2xl text-slate-800 mb-2 leading-tight break-words overflow-visible">
                          {college.college_name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                          {college.college_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">{college.college_location}</span>
                            </span>
                          )}
                          {college.tuition_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">{college.tuition_range}</span>
                            </span>
                          )}
                          {college.acceptance_rate && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-slate-500" />
                              <span className="font-medium">{college.acceptance_rate}% acceptance</span>
                            </span>
                          )}
                          {isDreamCollege(college.college_name) && (
                            <span className="flex items-center gap-1">
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm text-xs px-2 py-1">
                                <Star className="h-2 w-2 mr-1" />
                                Dream College
                              </Badge>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-6">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(college)} className="h-9 px-3 whitespace-nowrap">
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemove(college.id)}
                          disabled={removing === college.id}
                          className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap"
                        >
                          {removing === college.id ? "..." : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Badge className={`${getPriorityColor(college.priority)} px-3 py-1 text-sm font-medium`}>
                        {getPriorityLabel(college.priority)} Priority
                      </Badge>
                      <Badge className={`${getStatusColor(college.application_status)} px-3 py-1 text-sm font-medium`}>
                        {college.application_status}
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                        {college.source}
                      </Badge>
                      {college.college_type && (
                        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                          {college.college_type}
                        </Badge>
                      )}
                      {isDreamCollege(college.college_name) && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg px-3 py-1 text-sm font-medium">
                          <Star className="h-3 w-3 mr-1" />
                          Dream College
                        </Badge>
                      )}
                    </div>

                    {college.application_deadline && (
                      <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Application Deadline: {new Date(college.application_deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {college.notes && (
                      <div className="text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="font-medium text-slate-800 mb-1">Notes:</div>
                        <p className="text-slate-700 leading-relaxed">{college.notes}</p>
                      </div>
                    )}

                    <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                      Added to your list on {new Date(college.added_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
