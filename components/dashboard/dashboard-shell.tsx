"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface CoachSidebarState {
  isOpen: boolean
  width: number
  setIsOpen: (open: boolean) => void
  setWidth: (width: number) => void
}

const CoachSidebarContext = createContext<CoachSidebarState | null>(null)

export function useCoachSidebar() {
  return useContext(CoachSidebarContext)
}

const DEFAULT_SIDEBAR_WIDTH = 384

export function DashboardShell({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH
    const stored = localStorage.getItem("coach-ai-sidebar-width")
    if (stored) {
      const n = parseInt(stored, 10)
      if (!isNaN(n) && n >= 320 && n <= 900) return n
    }
    return DEFAULT_SIDEBAR_WIDTH
  })

  const value: CoachSidebarState = {
    isOpen,
    width,
    setIsOpen,
    setWidth: useCallback((w: number) => {
      setWidth(w)
      if (typeof window !== "undefined") {
        localStorage.setItem("coach-ai-sidebar-width", String(w))
      }
    }, []),
  }

  return (
    <CoachSidebarContext.Provider value={value}>
      <div
        className="min-h-screen transition-[margin-right] duration-200"
        style={{ marginRight: isOpen ? width : 0 }}
      >
        {children}
      </div>
    </CoachSidebarContext.Provider>
  )
}
