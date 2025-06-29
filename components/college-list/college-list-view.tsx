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
import { School, Trash2, MapPin, DollarSign, Users, Calendar, Edit3, Save, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface CollegeListViewProps {
  refreshTrigger?: number
}

export function CollegeListView({ refreshTrigger }: CollegeListViewProps) {
  const [colleges, setColleges] = useState<CollegeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<CollegeListItem>>({})

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          My College List ({colleges.length})
        </CardTitle>
        <CardDescription>Track your college applications and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        {colleges.length === 0 ? (
          <Alert>
            <School className="h-4 w-4" />
            <AlertDescription>
              Your college list is empty. Use the form above to add colleges you're interested in.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {colleges.map((college) => (
              <div key={college.id} className="border rounded-lg p-4">
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
                          value={editData.application_status || "Not Started"}
                          onValueChange={(value) => setEditData((prev) => ({ ...prev, application_status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Submitted">Submitted</SelectItem>
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Waitlisted">Waitlisted</SelectItem>
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
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{college.college_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {college.college_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {college.college_location}
                            </span>
                          )}
                          {college.tuition_range && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {college.tuition_range}
                            </span>
                          )}
                          {college.acceptance_rate && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {college.acceptance_rate}% acceptance
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(college)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemove(college.id)}
                          disabled={removing === college.id}
                        >
                          {removing === college.id ? "..." : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={getPriorityColor(college.priority)}>{getPriorityLabel(college.priority)}</Badge>
                      <Badge className={getStatusColor(college.application_status)}>{college.application_status}</Badge>
                      <Badge variant="outline">{college.source}</Badge>
                      {college.college_type && <Badge variant="secondary">{college.college_type}</Badge>}
                    </div>

                    {college.application_deadline && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Deadline: {new Date(college.application_deadline).toLocaleDateString()}
                      </div>
                    )}

                    {college.notes && (
                      <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                        <strong>Notes:</strong> {college.notes}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Added {new Date(college.added_at).toLocaleDateString()}
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
