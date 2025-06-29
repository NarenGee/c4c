"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCollegeListStats } from "@/app/actions/college-list"
import { School, Target, CheckCircle, Clock } from "lucide-react"

interface CollegeListStatsProps {
  refreshTrigger?: number
}

export function CollegeListStats({ refreshTrigger }: CollegeListStatsProps) {
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
  })
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    try {
      const data = await getCollegeListStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to load stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Colleges</CardTitle>
          <School className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">In your shortlist</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.byPriority["High"] || 0}</div>
          <p className="text-xs text-muted-foreground">Top choice colleges</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Applications Submitted</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.byStatus["Submitted"] || 0}</div>
          <p className="text-xs text-muted-foreground">Completed applications</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.byStatus["In Progress"] || 0}</div>
          <p className="text-xs text-muted-foreground">Applications being worked on</p>
        </CardContent>
      </Card>
    </div>
  )
}
