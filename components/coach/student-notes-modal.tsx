"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { StickyNote, Clock, User } from "lucide-react"

interface Note {
  id: string
  note_type: "general" | "application" | "meeting"
  content: string
  created_at: string
  author_name: string
  college_name?: string
  meeting_date?: string
}

interface StudentNotesModalProps {
  studentId: string
  studentName: string
  onNotesUpdated?: () => void
}

const noteTypeLabels = {
  general: "General Note",
  application: "Application Note", 
  meeting: "Meeting Note"
}

const noteTypeColors = {
  general: "bg-blue-100 text-blue-800",
  application: "bg-green-100 text-green-800",
  meeting: "bg-purple-100 text-purple-800"
}

export function StudentNotesModal({ studentId, studentName, onNotesUpdated }: StudentNotesModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [notesLoaded, setNotesLoaded] = useState(false)
  
  // New note form state
  const [newNote, setNewNote] = useState({
    type: "general" as "general" | "application" | "meeting",
    content: "",
    college_name: "",
    meeting_date: ""
  })

  const loadNotes = async () => {
    if (notesLoaded) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/coach/students/${studentId}/notes`)
      const data = await response.json()
      
      if (data.success) {
        setNotes(data.notes || [])
        setNotesLoaded(true)
      } else {
        console.error("Failed to load notes:", data.error)
      }
    } catch (error) {
      console.error("Error loading notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return
    
    setLoading(true)
    try {
      const payload = {
        note_type: newNote.type,
        content: newNote.content.trim()
        // Note: college_name and meeting_date will be added in future update
      }

      const response = await fetch(`/api/coach/students/${studentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        // Reload notes
        setNotesLoaded(false)
        await loadNotes()
        
        // Reset form
        setNewNote({
          type: "general",
          content: "",
          college_name: "",
          meeting_date: ""
        })
        
        onNotesUpdated?.()
      } else {
        console.error("Failed to add note:", data.error)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error adding note:", error)
      alert("Failed to add note")
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      loadNotes()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <StickyNote className="h-4 w-4 mr-1" />
          Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notes for {studentName}
          </DialogTitle>
          <DialogDescription>
            Add and view private notes about this student. Notes are only visible to coaches and administrators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Note Form */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-lg">Add New Note</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note-type">Note Type</Label>
                <Select 
                  value={newNote.type} 
                  onValueChange={(value: "general" | "application" | "meeting") => 
                    setNewNote(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Note</SelectItem>
                    <SelectItem value="application">Application Note</SelectItem>
                    <SelectItem value="meeting">Meeting Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newNote.type === "application" && (
                <div>
                  <Label htmlFor="college-name">College Name (Coming Soon)</Label>
                  <Input
                    id="college-name"
                    value={newNote.college_name}
                    onChange={(e) => setNewNote(prev => ({ ...prev, college_name: e.target.value }))}
                    placeholder="e.g., Stanford University"
                    disabled
                    className="opacity-50"
                  />
                  <p className="text-xs text-slate-500 mt-1">College-specific notes will be available soon</p>
                </div>
              )}

              {newNote.type === "meeting" && (
                <div>
                  <Label htmlFor="meeting-date">Meeting Date (Coming Soon)</Label>
                  <Input
                    id="meeting-date"
                    type="date"
                    value={newNote.meeting_date}
                    onChange={(e) => setNewNote(prev => ({ ...prev, meeting_date: e.target.value }))}
                    disabled
                    className="opacity-50"
                  />
                  <p className="text-xs text-slate-500 mt-1">Meeting dates will be available soon</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="note-content">Note Content</Label>
              <Textarea
                id="note-content"
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your note here..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleAddNote} 
              disabled={!newNote.content.trim() || loading}
              className="w-full md:w-auto"
            >
              {loading ? "Adding..." : "Add Note"}
            </Button>
          </div>

          {/* Existing Notes */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Previous Notes ({notes.length})</h3>
            
            {loading && !notesLoaded ? (
              <div className="text-center py-8 text-slate-500">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No notes yet. Add the first note above.
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={noteTypeColors[note.note_type]}>
                          {noteTypeLabels[note.note_type]}
                        </Badge>
                        {note.college_name && (
                          <Badge variant="outline" className="text-xs">
                            {note.college_name}
                          </Badge>
                        )}
                        {note.meeting_date && (
                          <Badge variant="outline" className="text-xs">
                            Meeting: {new Date(note.meeting_date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <User className="h-3 w-3" />
                        {note.author_name}
                        <Clock className="h-3 w-3 ml-2" />
                        {formatDate(note.created_at)}
                      </div>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
