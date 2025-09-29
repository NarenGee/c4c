"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Users, X } from "lucide-react"

interface AssignmentModalProps {
  onAssignmentCreated: () => void
}

interface SelectableUser {
  id: string
  full_name: string
  email: string
  organization?: string
}

export function AssignmentModal({ onAssignmentCreated }: AssignmentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [coaches, setCoaches] = useState<SelectableUser[]>([])
  const [students, setStudents] = useState<SelectableUser[]>([])
  const [selectedCoach, setSelectedCoach] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [coachSearch, setCoachSearch] = useState("")
  const [studentSearch, setStudentSearch] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/super-admin/users')
      if (response.ok) {
        const users = await response.json()
        
        const coachUsers = users.filter((user: any) => user.current_role === 'coach')
        const studentUsers = users.filter((user: any) => user.current_role === 'student')
        
        setCoaches(coachUsers)
        setStudents(studentUsers)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCoach || selectedStudents.length === 0) return

    setLoading(true)
    try {
      // Create assignments for each selected student
      const assignments = selectedStudents.map(studentId => ({
        coach_id: selectedCoach,
        student_id: studentId,
        notes: notes || null
      }))

      // Send bulk assignment request
      const response = await fetch('/api/super-admin/assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      })

      const result = await response.json()
      
      if (result.success) {
        setIsOpen(false)
        setSelectedCoach("")
        setSelectedStudents([])
        setNotes("")
        onAssignmentCreated()
        
        // You could show a toast notification here with the success message
        console.log('Success:', result.message)
      } else {
        console.error('Failed to create assignments:', result.error)
        // You could show a toast notification here
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const removeStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(id => id !== studentId))
  }

  const selectAllFilteredStudents = () => {
    const filteredIds = filteredStudents.map(s => s.id)
    setSelectedStudents(prev => {
      const newIds = filteredIds.filter(id => !prev.includes(id))
      return [...prev, ...newIds]
    })
  }

  const clearAllStudents = () => {
    setSelectedStudents([])
  }

  const filteredCoaches = coaches.filter(coach =>
    coach.full_name.toLowerCase().includes(coachSearch.toLowerCase()) ||
    coach.email.toLowerCase().includes(coachSearch.toLowerCase())
  )

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearch.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Coach-Student Assignments</DialogTitle>
          <DialogDescription>
            Assign multiple students to a coach for personalized guidance.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coach Selection */}
          <div className="space-y-2">
            <Label htmlFor="coach">Select Coach</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search coaches..."
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a coach" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCoaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{coach.full_name}</span>
                        <span className="text-xs text-slate-500">{coach.email}</span>
                        {coach.organization && (
                          <span className="text-xs text-slate-400">{coach.organization}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="students">Select Students ({selectedStudents.length} selected)</Label>
            
            {/* Selected Students Display */}
            {selectedStudents.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">Selected Students:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map((studentId) => {
                    const student = students.find(s => s.id === studentId)
                    return (
                      <div key={studentId} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                        <span>{student?.full_name}</span>
                        <button
                          type="button"
                          onClick={() => removeStudent(studentId)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Student Search and Selection */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllFilteredStudents}
                  disabled={filteredStudents.length === 0}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllStudents}
                  disabled={selectedStudents.length === 0}
                >
                  Clear
                </Button>
              </div>
              
              {/* Student List with Checkboxes */}
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={student.id}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleStudentToggle(student.id)}
                    />
                    <label htmlFor={student.id} className="flex-1 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{student.full_name}</span>
                        <span className="text-xs text-slate-500">{student.email}</span>
                      </div>
                    </label>
                  </div>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-4">
                    No students found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedCoach || selectedStudents.length === 0 || loading}
              className="flex-1"
            >
              {loading ? "Creating..." : `Create ${selectedStudents.length} Assignment${selectedStudents.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

