"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  RefreshCw,
} from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
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

interface AIStudentChatAssistantProps {
  isOpen: boolean
  onToggle: () => void
  sidebarWidth?: number
  onSidebarWidthChange?: (width: number) => void
}

const SIDEBAR_WIDTH_MIN = 320
const SIDEBAR_WIDTH_MAX = 900
const LEGACY_STORAGE_KEY = "student-ai-chat-sessions"

const SUGGESTED_QUESTIONS = [
  "Show me my college recommendations",
  "How complete is my profile right now?",
  "Take me to my applications",
  "What should I do next this week for admissions?",
  "Open my profile so I can update it",
  "What are the top gaps in my profile?",
]

function formatInline(line: string) {
  return line
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
}

function AssistantMessage({ content }: { content: string }) {
  const lines = content.split(/\n/)
  const bulletRegex = /^(\s*)[-•]\s+/
  const formattedLines: React.ReactNode[] = []
  let listBuffer: string[] = []

  const flushList = () => {
    if (listBuffer.length > 0) {
      formattedLines.push(
        <ul key={formattedLines.length} className="list-disc pl-5 my-2 space-y-1">
          {listBuffer.map((text, i) => (
            <li key={i} className="pl-1" dangerouslySetInnerHTML={{ __html: formatInline(text) }} />
          ))}
        </ul>
      )
      listBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const bulletMatch = line.match(bulletRegex)
    if (bulletMatch) {
      listBuffer.push(line.replace(bulletRegex, "").trim())
    } else {
      flushList()
      if (line.trim() === "") {
        formattedLines.push(<br key={formattedLines.length} />)
      } else {
        formattedLines.push(<span key={formattedLines.length} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />)
        if (i < lines.length - 1) formattedLines.push(<br key={`br-${formattedLines.length}`} />)
      }
    }
  }
  flushList()

  return <div className="text-sm whitespace-pre-wrap break-words min-w-0 max-w-full">{formattedLines}</div>
}

export function AIStudentChatAssistant({
  isOpen,
  onToggle,
  sidebarWidth = 384,
  onSidebarWidthChange,
}: AIStudentChatAssistantProps) {
  const router = useRouter()
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(sidebarWidth)
  const isResizing = useRef(false)

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const loadCurrentUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setCurrentUserId(data.user?.id ?? null)
    }
    void loadCurrentUser()
  }, [])

  const storageKey = currentUserId ? `${LEGACY_STORAGE_KEY}:${currentUserId}` : null

  useEffect(() => {
    if (!storageKey) return

    let savedSessions = localStorage.getItem(storageKey)
    if (!savedSessions) {
      const legacySessions = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacySessions) {
        localStorage.setItem(storageKey, legacySessions)
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        savedSessions = legacySessions
      }
    }

    if (savedSessions) {
      const sessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
      setChatSessions(sessions)
      if (sessions.length > 0) {
        setCurrentSession(sessions[0])
        setShowSuggestions(sessions[0].messages.length === 0)
      }
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    if (chatSessions.length === 0) {
      localStorage.removeItem(storageKey)
      return
    }
    localStorage.setItem(storageKey, JSON.stringify(chatSessions))
  }, [chatSessions, storageKey])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentSession?.messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!onSidebarWidthChange) return
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = resizeStartX.current - e.clientX
      let w = resizeStartWidth.current + delta
      w = Math.max(SIDEBAR_WIDTH_MIN, Math.min(SIDEBAR_WIDTH_MAX, w))
      onSidebarWidthChange(w)
    }
    const onMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [onSidebarWidthChange])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    resizeStartX.current = e.clientX
    resizeStartWidth.current = sidebarWidth
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      created_at: new Date(),
      updated_at: new Date(),
    }
    setCurrentSession(newSession)
    setChatSessions((prev) => [newSession, ...prev])
    setShowSuggestions(true)
    inputRef.current?.focus()
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
        updated_at: new Date(),
      }
      setCurrentSession(session)
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    }

    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage],
      updated_at: new Date(),
      title:
        session.messages.length === 0
          ? message.length > 50
            ? `${message.substring(0, 50)}...`
            : message
          : session.title,
    }

    setCurrentSession(updatedSession)
    setMessage("")
    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const response = await fetch("/api/student/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: session.messages,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to get AI response")
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.response ?? "I didn't get a response. Please try again.",
        timestamp: new Date(),
      }

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updated_at: new Date(),
      }

      setCurrentSession(finalSession)
      setChatSessions((prev) => {
        const existing = prev.find((s) => s.id === finalSession.id)
        if (existing) return prev.map((s) => (s.id === finalSession.id ? finalSession : s))
        return [finalSession, ...prev]
      })

      if (typeof data?.navigateTo === "string" && data.navigateTo.startsWith("/")) {
        router.push(data.navigateTo)
      }
    } catch (error) {
      const err = error instanceof Error ? error.message : "Unknown error"
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I couldn't complete your request. ${err} Please try again.`,
        timestamp: new Date(),
      }
      setCurrentSession({
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        updated_at: new Date(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllSessions = () => {
    setChatSessions([])
    setCurrentSession(null)
    setShowSuggestions(true)
    if (storageKey) {
      localStorage.removeItem(storageKey)
    }
  }

  if (!isOpen) {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50 sm:hidden">
          <Button
            onClick={onToggle}
            className="h-12 w-12 rounded-full p-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl"
            size="icon"
            aria-label="Open AI Student Assistant"
          >
            <MessageSquare className="h-5 w-5 text-white" />
          </Button>
        </div>
        <div className="hidden sm:block fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
          <Button
            onClick={onToggle}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg text-white font-medium rounded-lg"
            size="sm"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Assistant
            <ChevronLeft className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </>
    )
  }

  const isResizable = typeof onSidebarWidthChange === "function"

  return (
    <>
      {isOpen && !isResizable && <div className="fixed inset-0 bg-black bg-opacity-20 z-40" onClick={onToggle} />}
      <div
        className={`flex flex-col h-screen bg-white border-l border-slate-200 shadow-2xl overflow-hidden fixed right-0 top-0 z-50 ${
          !isResizable ? `transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}` : ""
        }`}
        style={
          isMobile
            ? { width: "100%", maxWidth: "100vw", transition: "width 0.2s ease" }
            : isResizable
              ? { width: sidebarWidth, minWidth: sidebarWidth, transition: "width 0.2s ease" }
              : { width: "24rem" }
        }
      >
        {isResizable && isOpen && !isMobile && (
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/20 active:bg-blue-400/30 z-20 flex items-center justify-center group"
            onMouseDown={handleResizeStart}
            aria-label="Resize sidebar"
          >
            <span className="w-0.5 h-16 bg-slate-300 group-hover:bg-blue-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        )}

        <div className="bg-slate-800 text-white p-3 sm:p-4 flex items-center justify-between min-w-0 gap-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base truncate">AI Student Assistant</h3>
              <p className="text-xs sm:text-sm text-slate-300 truncate">Your college planning copilot</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={createNewSession} className="text-white hover:bg-slate-700">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle} className="text-white hover:bg-slate-700">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {chatSessions.length > 1 && (
          <div className="bg-slate-50 border-b p-2 sm:p-3 min-w-0">
            <div className="flex items-center justify-between mb-2 min-w-0">
              <span className="text-sm font-medium text-slate-700 truncate">Recent Conversations</span>
              <Button variant="ghost" size="sm" onClick={clearAllSessions} className="text-slate-500 hover:text-slate-700">
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
                      currentSession?.id === session.id ? "bg-slate-200 text-slate-800" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {session.title}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScrollArea className="flex-1 min-w-0 p-3 sm:p-4 overflow-x-hidden">
          <div className="space-y-4 min-w-0 max-w-full">
            {currentSession?.messages.length === 0 || !currentSession ? (
              <div className="text-center text-slate-500 py-6 sm:py-8 px-2">
                <Bot className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-slate-400" />
                <h4 className="font-medium mb-2 text-sm sm:text-base">Hi! I'm your AI student assistant.</h4>
                <p className="text-xs sm:text-sm mb-4">
                  I can help you with profile completion, recommendations, and applications.
                </p>
              </div>
            ) : (
              currentSession.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 sm:gap-3 min-w-0 max-w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-2 sm:gap-3 max-w-[95%] sm:max-w-[85%] min-w-0 flex-1 ${msg.role === "user" ? "flex-row-reverse justify-end" : "flex-row"}`}>
                    <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-blue-500" : "bg-slate-600"}`}>
                      {msg.role === "user" ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />}
                    </div>
                    <div className={`p-2.5 sm:p-3 rounded-lg min-w-0 overflow-hidden max-w-full ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-800"}`}>
                      {msg.role === "assistant" ? (
                        <AssistantMessage content={msg.content} />
                      ) : (
                        <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                      )}
                      <p className={`text-xs mt-1 ${msg.role === "user" ? "text-blue-100" : "text-slate-500"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3 justify-start min-w-0">
                <div className="flex gap-3 max-w-[85%] min-w-0">
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

        {showSuggestions && (
          <div className="p-3 sm:p-4 border-t bg-slate-50 min-w-0">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-slate-700">Suggested Questions</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMessage(question)
                    inputRef.current?.focus()
                  }}
                  className="w-full text-left text-xs h-auto py-2 px-3 whitespace-normal"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 sm:p-4 border-t bg-white min-w-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2 min-w-0">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={isMobile ? "Ask about profile, matches..." : "Ask about profile, recommendations, applications..."}
              disabled={isLoading}
              className="flex-1 min-w-0 text-sm sm:text-base"
            />
            <Button onClick={sendMessage} disabled={!message.trim() || isLoading} size="sm" className="bg-slate-800 hover:bg-slate-700 flex-shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
