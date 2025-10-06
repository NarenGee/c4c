"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { User, Clock, MessageSquare } from "lucide-react"

interface Note {
  id: string
  content: string
  author: string
  author_id: string
  created_at: string
  parent_note_id?: string
  is_reply?: boolean
}

interface Conversation {
  note: Note
  replies: Note[]
}

interface ConversationModalProps {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation | null
  studentName: string
  currentUserId: string
  onReply: (parentNoteId: string, content: string) => Promise<void>
  onMessageAdded?: () => void
  loading?: boolean
}

export function ConversationModal({
  isOpen,
  onClose,
  conversation,
  studentName,
  currentUserId,
  onReply,
  onMessageAdded,
  loading = false
}: ConversationModalProps) {
  const [replyContent, setReplyContent] = useState("")

  if (!isOpen || !conversation) return null

  const handleReply = async () => {
    if (!replyContent.trim()) return
    
    await onReply(conversation.note.id, replyContent)
    setReplyContent("")
    
    // Notify parent component that a message was added
    onMessageAdded?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleReply()
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">Conversation with {studentName}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-800"
            >
              Close
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Main Note */}
          <div className={`p-4 rounded-lg border shadow-sm ${
            conversation.note.author_id === currentUserId 
              ? 'bg-green-50/90 border-green-200' 
              : 'bg-blue-50/90 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <User className="h-3 w-3" />
              {conversation.note.author}
              <Clock className="h-3 w-3 ml-2" />
              {formatDate(conversation.note.created_at)}
              <span className={`text-xs px-2 py-1 rounded ${
                conversation.note.author_id === currentUserId 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {conversation.note.author_id === currentUserId ? 'Your Note' : 'Coach Note'}
              </span>
            </div>
            <p className="text-slate-800 whitespace-pre-wrap">{conversation.note.content}</p>
          </div>

          {/* Replies */}
          {conversation.replies
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((reply, index) => (
              <div key={`${reply.id}-${index}`} className={`p-4 rounded-lg border shadow-sm ml-6 ${
                reply.author_id === currentUserId 
                  ? 'bg-green-50/90 border-green-200' 
                  : 'bg-blue-50/90 border-blue-200'
              }`}>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <User className="h-3 w-3" />
                  {reply.author}
                  <Clock className="h-3 w-3 ml-2" />
                  {formatDate(reply.created_at)}
                  <span className={`text-xs px-2 py-1 rounded ${
                    reply.author_id === currentUserId 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {reply.author_id === currentUserId ? 'Your Reply' : 'Coach Reply'}
                  </span>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap">{reply.content}</p>
              </div>
            ))}

          {/* Reply Form */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <Label htmlFor="reply-content">Add Reply</Label>
              <Textarea
                id="reply-content"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply here..."
                rows={3}
                className="w-full"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">Press Ctrl+Enter to send</p>
                <Button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
