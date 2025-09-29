"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw
} from "lucide-react"

interface CoachStudent {
  id: string
  full_name: string
  email: string
  grade_level?: string
  gpa?: number
  country_of_residence?: string
  profile_completion: number
  college_matches_count: number
  college_list_count: number
  application_progress: {
    considering: number
    planning_to_apply: number
    applied: number
    interviewing: number
    accepted: number
    rejected: number
    enrolled: number
  }
  assigned_at: string
  last_sign_in_at?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  created_at: Date
  updated_at: Date
}

interface AIChatAssistantProps {
  students: CoachStudent[]
  isOpen: boolean
  onToggle: () => void
}

const SUGGESTED_QUESTIONS = [
  "Who needs my immediate attention this week?",
  "What are my priority action items for each student?",
  "Which students are falling behind their timeline?",
  "How should I prioritize my outreach efforts?",
  "What's blocking my students from making progress?",
  "Which students are ready for their next milestone?",
  "What patterns do you see across my caseload?",
  "How can I better support my struggling students?"
]

// Component to render assistant messages with clickable follow-up questions
function AssistantMessage({ content, onQuestionClick }: { content: string, onQuestionClick: (question: string) => void }) {
  // Split content by "What's next?" section
  const parts = content.split(/\*\*What's next\?\*\*/i)
  const mainContent = parts[0]
  const questionsSection = parts[1]

  // Format main content
  const formattedMainContent = mainContent
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/🔴/g, '<span style="color: #ef4444;">🔴</span>')
    .replace(/🟡/g, '<span style="color: #f59e0b;">🟡</span>')
    .replace(/🟢/g, '<span style="color: #10b981;">🟢</span>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')

  // Extract questions from the questions section
  const questions = questionsSection
    ? questionsSection
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').replace(/"/g, '').trim())
        .filter(q => q.length > 0)
    : []

  return (
    <div>
      {/* Main content */}
      <div dangerouslySetInnerHTML={{ __html: formattedMainContent }} />
      
      {/* Follow-up questions */}
      {questions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="mb-2">
            <strong>What's next?</strong>
          </div>
          <div className="space-y-2">
            {questions.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="block w-full text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function AIChatAssistant({ students, isOpen, onToggle }: AIChatAssistantProps) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('coach-ai-chat-sessions')
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
      setChatSessions(sessions)
      
      // Load the most recent session
      if (sessions.length > 0) {
        setCurrentSession(sessions[0])
        setShowSuggestions(sessions[0].messages.length === 0)
      }
    }
  }, [])

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('coach-ai-chat-sessions', JSON.stringify(chatSessions))
    }
  }, [chatSessions])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.messages])

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      created_at: new Date(),
      updated_at: new Date()
    }
    
    setCurrentSession(newSession)
    setChatSessions(prev => [newSession, ...prev])
    setShowSuggestions(true)
    inputRef.current?.focus()
  }

  const updateSessionTitle = (session: ChatSession, firstMessage: string) => {
    // Generate a title from the first message (first 50 chars)
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + "..."
      : firstMessage
    
    return { ...session, title, updated_at: new Date() }
  }

  const prepareStudentContext = () => {
    return {
      totalStudents: students.length,
      studentsOverview: students.map(student => ({
        id: student.id,
        name: student.full_name,
        email: student.email,
        gradeLevel: student.grade_level,
        country: student.country_of_residence,
        profileCompletion: student.profile_completion,
        collegeMatches: student.college_matches_count,
        collegesInList: student.college_list_count,
        applicationProgress: student.application_progress,
        lastLogin: student.last_sign_in_at,
        assignedDate: student.assigned_at
      })),
      summary: {
        averageProfileCompletion: Math.round(students.reduce((sum, s) => sum + s.profile_completion, 0) / students.length),
        totalRecommendations: students.reduce((sum, s) => sum + s.college_matches_count, 0),
        totalCollegesInLists: students.reduce((sum, s) => sum + s.college_list_count, 0),
        totalApplications: students.reduce((sum, s) => sum + Object.values(s.application_progress).reduce((a, b) => a + b, 0), 0),
        studentsNeedingAttention: students.filter(s => s.profile_completion < 50 || !s.last_sign_in_at).length
      }
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    let session = currentSession
    if (!session) {
      session = {
        id: Date.now().toString(),
        title: "New Conversation",
        messages: [],
        created_at: new Date(),
        updated_at: new Date()
      }
      setCurrentSession(session)
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    }

    // Update session with user message
    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage],
      updated_at: new Date()
    }

    // Update title if this is the first message
    if (session.messages.length === 0) {
      updatedSession.title = message.length > 50 
        ? message.substring(0, 50) + "..."
        : message
    }

    setCurrentSession(updatedSession)
    setMessage("")
    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const studentContext = prepareStudentContext()
      
      const response = await fetch('/api/coach/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          studentContext,
          conversationHistory: session.messages
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updated_at: new Date()
      }

      setCurrentSession(finalSession)
      
      // Update sessions list
      setChatSessions(prev => {
        const existing = prev.find(s => s.id === finalSession.id)
        if (existing) {
          return prev.map(s => s.id === finalSession.id ? finalSession : s)
        } else {
          return [finalSession, ...prev]
        }
      })

    } catch (error) {
      console.error('Error sending message:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        updated_at: new Date()
      }

      setCurrentSession(errorSession)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectSuggestedQuestion = (question: string) => {
    setMessage(question)
    inputRef.current?.focus()
  }

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId))
    if (currentSession?.id === sessionId) {
      const remaining = chatSessions.filter(s => s.id !== sessionId)
      setCurrentSession(remaining.length > 0 ? remaining[0] : null)
      setShowSuggestions(remaining.length === 0)
    }
  }

  const clearAllSessions = () => {
    setChatSessions([])
    setCurrentSession(null)
    setShowSuggestions(true)
    localStorage.removeItem('coach-ai-chat-sessions')
  }

  if (!isOpen) {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <Button
          onClick={onToggle}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 text-white font-medium rounded-lg"
          size="sm"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          AI Assistant
          <ChevronLeft className="h-4 w-4 ml-2" />
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-screen w-96 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">AI Coach Assistant</h3>
            <p className="text-sm text-slate-300">{students.length} students</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewSession}
            className="text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Session History */}
      {chatSessions.length > 1 && (
        <div className="bg-slate-50 border-b p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Recent Conversations</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllSessions}
              className="text-slate-500 hover:text-slate-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          <ScrollArea className="h-20">
            <div className="space-y-1">
              {chatSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    setCurrentSession(session)
                    setShowSuggestions(session.messages.length === 0)
                  }}
                  className={`text-xs p-2 rounded cursor-pointer truncate ${
                    currentSession?.id === session.id 
                      ? 'bg-slate-200 text-slate-800' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {session.title}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {currentSession?.messages.length === 0 || !currentSession ? (
            <div className="text-center text-slate-500 py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <h4 className="font-medium mb-2">Hi! I'm your AI coaching assistant.</h4>
              <p className="text-sm mb-4">I can help you analyze your students' progress, identify who needs attention, and suggest next steps.</p>
            </div>
          ) : (
            currentSession.messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-blue-500' : 'bg-slate-600'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.role === 'assistant' ? (
                        <AssistantMessage content={msg.content} onQuestionClick={selectSuggestedQuestion} />
                      ) : (
                        <div dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/🔴/g, '<span style="color: #ef4444;">🔴</span>')
                            .replace(/🟡/g, '<span style="color: #f59e0b;">🟡</span>')
                            .replace(/🟢/g, '<span style="color: #10b981;">🟢</span>')
                            .replace(/\n\n/g, '<br><br>')
                            .replace(/\n/g, '<br>')
                        }} />
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="p-3 rounded-lg bg-slate-100 text-slate-800">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="p-4 border-t bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Suggested Questions</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => selectSuggestedQuestion(question)}
                className="w-full text-left text-xs h-auto py-2 px-3 whitespace-normal"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your students..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!message.trim() || isLoading}
            size="sm"
            className="bg-slate-800 hover:bg-slate-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </>
  )
}
