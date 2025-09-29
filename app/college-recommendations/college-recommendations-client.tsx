"use client"

import { useState, useEffect } from "react"
import { CollegeMatchesView } from "@/components/college-matching/college-matches-view"


export function CollegeRecommendationsClient() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Refresh recommendations when component mounts (useful for when redirected after generation)
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <div className="space-y-8">
      <CollegeMatchesView refreshTrigger={refreshTrigger} />
    </div>
  )
} 