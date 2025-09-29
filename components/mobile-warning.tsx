"use client"

import React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useState, useEffect } from "react"

export function MobileWarning() {
  const isMobile = useIsMobile()
  const [show, setShow] = useState(true)
  
  useEffect(() => {
    if (!isMobile) setShow(false)
    else setShow(true)
  }, [isMobile])
  
  if (!isMobile || !show) return null
  
  return (
    <div className="fixed top-0 left-0 w-full z-[9999] flex justify-center px-2 pt-2 pointer-events-none">
      <Alert className="max-w-xl bg-blue-50 border-blue-200 text-blue-900 shadow-xl pointer-events-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <AlertTitle className="font-bold">Mobile Experience Notice</AlertTitle>
            <AlertDescription>
              This is <span className="font-semibold">Alpha v1.0</span> of the tool and it is <span className="font-semibold">best viewed on desktop</span>.
            </AlertDescription>
          </div>
          <button
            onClick={() => setShow(false)}
            className="ml-4 text-blue-700 hover:text-blue-900 font-bold text-lg px-2"
            aria-label="Dismiss mobile warning"
          >
            ×
          </button>
        </div>
      </Alert>
    </div>
  )
} 