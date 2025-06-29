"use client"

import { useState } from "react"
import { EnhancedStudentProfileForm } from "@/components/college-matching/enhanced-student-profile-form"
import { CollegeMatchesView } from "@/components/college-matching/college-matches-view"

export default function CollegeMatchingPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRecommendationsGenerated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">College Recommendations</h1>
        <p className="text-muted-foreground">
          Get personalized college recommendations powered by AI based on your academic profile and preferences
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <EnhancedStudentProfileForm onRecommendationsGenerated={handleRecommendationsGenerated} />
        <CollegeMatchesView refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
