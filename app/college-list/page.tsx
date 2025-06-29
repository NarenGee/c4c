"use client"

import { useState } from "react"
import { AddCollegeForm } from "@/components/college-list/add-college-form"
import { CollegeListView } from "@/components/college-list/college-list-view"
import { CollegeListStats } from "@/components/college-list/college-list-stats"

export default function CollegeListPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCollegeAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My College List</h1>
        <p className="text-muted-foreground">Manage your college shortlist and track application progress</p>
      </div>

      <CollegeListStats refreshTrigger={refreshTrigger} />

      <div className="grid gap-8 lg:grid-cols-2">
        <AddCollegeForm onCollegeAdded={handleCollegeAdded} />
        <CollegeListView refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}
