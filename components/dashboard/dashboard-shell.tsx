"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface CoachSidebarState {
  isOpen: boolean
  width: number
  setIsOpen: (open: boolean) => void
  setWidth: (width: number) => void
}

interface StudentSidebarState {
  isOpen: boolean
  width: number
  setIsOpen: (open: boolean) => void
  setWidth: (width: number) => void
}

const CoachSidebarContext = createContext<CoachSidebarState | null>(null)
const StudentSidebarContext = createContext<StudentSidebarState | null>(null)

export function useCoachSidebar() {
  return useContext(CoachSidebarContext)
}

export function useStudentSidebar() {
  return useContext(StudentSidebarContext)
}

const DEFAULT_SIDEBAR_WIDTH = 384

export function DashboardShell({ children }: { children: ReactNode }) {
  const [coachIsOpen, setCoachIsOpen] = useState(false)
  const [coachWidth, setCoachWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH
    const stored = localStorage.getItem("coach-ai-sidebar-width")
    if (stored) {
      const n = parseInt(stored, 10)
      if (!isNaN(n) && n >= 320 && n <= 900) return n
    }
    return DEFAULT_SIDEBAR_WIDTH
  })

  const [studentIsOpen, setStudentIsOpen] = useState(false)
  const [studentWidth, setStudentWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH
    const stored = localStorage.getItem("student-ai-sidebar-width")
    if (stored) {
      const n = parseInt(stored, 10)
      if (!isNaN(n) && n >= 320 && n <= 900) return n
    }
    return DEFAULT_SIDEBAR_WIDTH
  })

  const coachValue: CoachSidebarState = {
    isOpen: coachIsOpen,
    width: coachWidth,
    setIsOpen: setCoachIsOpen,
    setWidth: useCallback((w: number) => {
      setCoachWidth(w)
      if (typeof window !== "undefined") {
        localStorage.setItem("coach-ai-sidebar-width", String(w))
      }
    }, []),
  }

  const studentValue: StudentSidebarState = {
    isOpen: studentIsOpen,
    width: studentWidth,
    setIsOpen: setStudentIsOpen,
    setWidth: useCallback((w: number) => {
      setStudentWidth(w)
      if (typeof window !== "undefined") {
        localStorage.setItem("student-ai-sidebar-width", String(w))
      }
    }, []),
  }

  const activeMargin = coachIsOpen ? coachWidth : studentIsOpen ? studentWidth : 0

  return (
    <CoachSidebarContext.Provider value={coachValue}>
      <StudentSidebarContext.Provider value={studentValue}>
        <div className="min-h-screen transition-[margin-right] duration-200" style={{ marginRight: activeMargin }}>
          {children}
        </div>
      </StudentSidebarContext.Provider>
    </CoachSidebarContext.Provider>
  )
}
