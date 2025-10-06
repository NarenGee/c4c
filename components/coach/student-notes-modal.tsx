"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { StickyNote, Clock, User, Eye, EyeOff } from "lucide-react"

interface Note {
  id: string
  content: string
  created_at: string
  author_name: string
  author_id: string
  type: string
  visible_to_student: boolean
  parent_note_id?: string
  is_reply?: boolean
}

interface StudentNotesModalProps {
  studentId: string
  studentName: string
  onNotesUpdated?: () => void
}


export function StudentNotesModal({ studentId, studentName, onNotesUpdated }: StudentNotesModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [notesLoaded, setNotesLoaded] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<{ note: Note; replies: Note[] } | null>(null)
  const [mounted, setMounted] = useState(false)

  // New note form state
  const [newNote, setNewNote] = useState({
    content: "",
    visible_to_student: false
  })

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Group notes into conversations
  const groupNotesIntoConversations = (notesList: Note[]) => {
    const conversations: { [key: string]: { note: Note; replies: Note[] } } = {}
    
    // First, deduplicate notes by ID to prevent duplicate keys
    const uniqueNotes = notesList.reduce((acc, note) => {
      if (!acc.find(n => n.id === note.id)) {
        acc.push(note)
      }
      return acc
    }, [] as Note[])
    
    uniqueNotes.forEach(note => {
      if (note.is_reply && note.parent_note_id) {
        // This is a reply
        if (!conversations[note.parent_note_id]) {
          // Find the parent note
          const parentNote = uniqueNotes.find(n => n.id === note.parent_note_id)
          if (parentNote) {
            conversations[note.parent_note_id] = { note: parentNote, replies: [] }
          }
        }
        if (conversations[note.parent_note_id]) {
          // Check if this reply is already added to prevent duplicates
          const existingReply = conversations[note.parent_note_id].replies.find(r => r.id === note.id)
          if (!existingReply) {
            conversations[note.parent_note_id].replies.push(note)
          }
        }
      } else {
        // This is a main note
        if (!conversations[note.id]) {
          conversations[note.id] = { note, replies: [] }
        }
      }
    })
    
    return Object.values(conversations)
  }

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
        content: newNote.content.trim(),
        visible_to_student: newNote.visible_to_student
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
              content: "",
              visible_to_student: false
            })

            onNotesUpdated?.()
            handleMessageAdded()
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

  const toggleVisibility = async (noteId: string, currentVisibility: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/coach/students/${studentId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          visible_to_student: !currentVisibility
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Reload notes
        setNotesLoaded(false)
        await loadNotes()
        onNotesUpdated?.()
      } else {
        console.error("Failed to update note visibility:", data.error)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error updating note visibility:", error)
      alert("Failed to update note visibility")
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

  const openConversation = (conversation: { note: Note; replies: Note[] }) => {
    setSelectedConversation(conversation)
    setShowConversation(true)
  }

  const closeConversation = () => {
    setShowConversation(false)
    setSelectedConversation(null)
  }

  const replyToNote = async (parentNoteId: string, replyContent: string) => {
    if (!replyContent.trim()) return

    setLoading(true)
    try {
      const payload = {
        content: replyContent.trim(),
        visible_to_student: true,
        parent_note_id: parentNoteId,
        is_reply: true
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
        onNotesUpdated?.()
      } else {
        console.error("Failed to add reply:", data.error)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error adding reply:", error)
      alert("Failed to add reply")
    } finally {
      setLoading(false)
    }
  }

  const handleMessageAdded = () => {
    // Reload notes from backend to get the latest data
    setNotesLoaded(false)
    loadNotes()
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
    <>
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="visible-to-student"
                checked={newNote.visible_to_student}
                onCheckedChange={(checked) => setNewNote(prev => ({ ...prev, visible_to_student: !!checked }))}
              />
              <Label htmlFor="visible-to-student" className="text-sm font-medium">
                Make visible to student
              </Label>
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
                <h3 className="font-medium text-lg">Conversations ({groupNotesIntoConversations(notes).length})</h3>

                {loading && !notesLoaded ? (
                  <div className="text-center py-8 text-slate-500">Loading notes...</div>
                ) : groupNotesIntoConversations(notes).length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No conversations yet. Add the first note above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupNotesIntoConversations(notes).map((conversation) => {
                      const latestMessage = conversation.replies.length > 0 
                        ? conversation.replies[conversation.replies.length - 1]
                        : conversation.note
                      
                      return (
                        <div key={conversation.note.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <User className="h-3 w-3" />
                              {latestMessage.author_name}
                              <Clock className="h-3 w-3 ml-2" />
                              {formatDate(latestMessage.created_at)}
                              {conversation.replies.length > 0 && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {conversation.replies.length} reply{conversation.replies.length !== 1 ? 'ies' : ''}
                                </span>
                              )}
                              {latestMessage.visible_to_student ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Eye className="h-3 w-3" />
                                  Visible to student
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <EyeOff className="h-3 w-3" />
                                  Private
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openConversation(conversation)}
                                className="text-xs"
                              >
                                View Conversation
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleVisibility(conversation.note.id, conversation.note.visible_to_student)}
                                disabled={loading}
                                className="text-xs"
                              >
                                {conversation.note.visible_to_student ? "Make Private" : "Make Visible"}
                              </Button>
                            </div>
                          </div>
                          <p className="text-slate-700 whitespace-pre-wrap text-sm">
                            {latestMessage.content.length > 100 
                              ? `${latestMessage.content.substring(0, 100)}...` 
                              : latestMessage.content
                            }
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Conversation Modal - Rendered outside Dialog using Portal */}
    {mounted && showConversation && selectedConversation && createPortal(
      <div 
        key={`conversation-${notes.length}`}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeConversation()
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            closeConversation()
          }
        }}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Conversation with {studentName}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={closeConversation}
                className="text-slate-600 hover:text-slate-800"
              >
                Close
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {(() => {
              // Get the latest conversation data from the notes state
              const currentConversation = groupNotesIntoConversations(notes).find(
                conv => conv.note.id === selectedConversation.note.id
              )
              const conversation = currentConversation || selectedConversation
              const replies = conversation.replies
              
              return (
                <>
                  {/* Main Note */}
                  <div className={`p-4 rounded-lg border shadow-sm ${
                    conversation.note.author_id === selectedConversation.note.author_id 
                      ? 'bg-blue-50/90 border-blue-200' 
                      : 'bg-green-50/90 border-green-200'
                  }`}>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <User className="h-3 w-3" />
                      {conversation.note.author_name}
                      <Clock className="h-3 w-3 ml-2" />
                      {formatDate(conversation.note.created_at)}
                      <span className={`text-xs px-2 py-1 rounded ${
                        conversation.note.author_id === selectedConversation.note.author_id 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {conversation.note.author_id === selectedConversation.note.author_id ? 'Coach Note' : 'Student Note'}
                      </span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap">{conversation.note.content}</p>
                  </div>

                  {/* Replies */}
                  {replies
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((reply, index) => (
                    <div key={`${reply.id}-${index}`} className={`p-4 rounded-lg border shadow-sm ml-6 ${
                      reply.author_id === selectedConversation.note.author_id 
                        ? 'bg-blue-50/90 border-blue-200' 
                        : 'bg-green-50/90 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <User className="h-3 w-3" />
                        {reply.author_name}
                        <Clock className="h-3 w-3 ml-2" />
                        {formatDate(reply.created_at)}
                        <span className={`text-xs px-2 py-1 rounded ${
                          reply.author_id === selectedConversation.note.author_id 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {reply.author_id === selectedConversation.note.author_id ? 'Coach Reply' : 'Student Reply'}
                        </span>
                      </div>
                      <p className="text-slate-800 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </>
              )
            })()}

            {/* Reply Form */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <Label htmlFor="reply-content">Add Reply</Label>
                <Textarea
                  id="reply-content"
                  placeholder="Type your reply here..."
                  rows={3}
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      const content = (e.target as HTMLTextAreaElement).value
                      if (content.trim()) {
                        replyToNote(selectedConversation.note.id, content)
                        ;(e.target as HTMLTextAreaElement).value = ''
                        handleMessageAdded()
                      }
                    }
                  }}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">Press Ctrl+Enter to send</p>
                  <Button
                    onClick={(e) => {
                      const textarea = document.getElementById('reply-content') as HTMLTextAreaElement
                      const content = textarea.value
                      if (content.trim()) {
                        replyToNote(selectedConversation.note.id, content)
                        textarea.value = ''
                        handleMessageAdded()
                      }
                    }}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
}
