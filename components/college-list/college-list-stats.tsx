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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="text-center text-slate-600">Loading...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-lg font-medium">Total Colleges</CardTitle>
          <School className="h-6 w-6 text-white" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-3xl font-bold text-slate-800 mb-2">{stats.total}</div>
          <p className="text-sm text-slate-600">In your shortlist</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
        <CardHeader className="bg-red-600 text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-lg font-medium">High Priority</CardTitle>
          <Target className="h-6 w-6 text-white" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-3xl font-bold text-slate-800 mb-2">{stats.byPriority["High"] || 0}</div>
          <p className="text-sm text-slate-600">Top choice colleges</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
        <CardHeader className="bg-green-600 text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-lg font-medium">Applications Submitted</CardTitle>
          <CheckCircle className="h-6 w-6 text-white" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-3xl font-bold text-slate-800 mb-2">{stats.byStatus["Submitted"] || 0}</div>
          <p className="text-sm text-slate-600">Completed applications</p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
        <CardHeader className="bg-orange-600 text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-lg font-medium">In Progress</CardTitle>
          <Clock className="h-6 w-6 text-white" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-3xl font-bold text-slate-800 mb-2">{stats.byStatus["In Progress"] || 0}</div>
          <p className="text-sm text-slate-600">Applications being worked on</p>
        </CardContent>
      </Card>
    </div>
  )
}
