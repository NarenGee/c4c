"use client"

import { ReactNode, useEffect, useState } from "react"
import { AIStudentChatAssistant } from "@/components/student/ai-student-chat-assistant"
import { useStudentSidebar } from "@/components/dashboard/dashboard-shell"

interface StudentAISidebarShellProps {
  children: ReactNode
  enabled?: boolean
}

export function StudentAISidebarShell({ children, enabled = true }: StudentAISidebarShellProps) {
  const studentSidebar = useStudentSidebar()
  const [localOpen, setLocalOpen] = useState(false)
  const [localWidth, setLocalWidth] = useState(384)

  const isAIChatOpen = studentSidebar ? studentSidebar.isOpen : localOpen
  const setAIChatOpen = studentSidebar ? studentSidebar.setIsOpen : setLocalOpen
  const sidebarWidth = studentSidebar ? studentSidebar.width : localWidth
  const handleSidebarWidthChange = studentSidebar
    ? studentSidebar.setWidth
    : (w: number) => {
        setLocalWidth(w)
        if (typeof window !== "undefined") localStorage.setItem("student-ai-sidebar-width", String(w))
      }

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("student-ai-sidebar-width")
    if (stored) {
      const n = parseInt(stored, 10)
      if (!isNaN(n) && n >= 320 && n <= 900) {
        setLocalWidth(n)
      }
    }
    setLocalOpen(window.innerWidth >= 1024)
  }, [])

  useEffect(() => {
    if (enabled && studentSidebar && typeof window !== "undefined" && window.innerWidth >= 1024) {
      studentSidebar.setIsOpen(true)
    }
  }, [enabled, studentSidebar])

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <AIStudentChatAssistant
        isOpen={isAIChatOpen}
        onToggle={() => setAIChatOpen(!isAIChatOpen)}
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={handleSidebarWidthChange}
      />
    </>
  )
}
