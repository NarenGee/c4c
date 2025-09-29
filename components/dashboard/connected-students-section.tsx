"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ExternalLink, TrendingUp, Target, Heart } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/auth"

interface ConnectedStudent {
  id: string
  full_name: string
  email: string
  linked_at: string
  relationship: string
}

interface ConnectedStudentsSectionProps {
  user: User
}

export function ConnectedStudentsSection({ user }: ConnectedStudentsSectionProps) {
  const [connectedStudents, setConnectedStudents] = useState<ConnectedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentStats, setStudentStats] = useState<Record<string, any>>({})

  const loadConnectedStudents = async () => {
    try {
      const supabase = createClient()

      // Check if we have a valid Supabase client
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const errorMsg = "Database connection not configured. Please check your environment setup."
        console.error(errorMsg)
        setError(errorMsg)
        setLoading(false)
        return
      }
      
      // Clear any previous errors
      setError(null)
      
      // Get linked students
      interface StudentLink {
        id: string
        student_id: string
        relationship: string
        linked_at: string
        student: {
          id: string
          full_name: string
          email: string
        } | null
      }

      console.log("Loading student links for user:", { 
        userId: user.id,
        userRole: user.role,
        userEmail: user.email,
        isParent: user.role === 'parent',
        isCounselor: user.role === 'counselor'
      })
      
      // Get student links without the problematic join
      const { data: rawLinks, error: linksError } = await supabase
        .from("student_links")
        .select("id, student_id, linked_user_id, relationship, linked_at, status")
        .eq("linked_user_id", user.id)
        .eq("status", "accepted")
        .order("linked_at", { ascending: false })

      console.log("Raw links data:", { rawLinks, linksError })

      if (linksError) {
        const errorMessage = linksError.message || JSON.stringify(linksError)
        console.error("Failed to load student links:", errorMessage)
        setError("Failed to load connected students. Please try again later.")
        setLoading(false)
        return
      }

      if (!rawLinks || rawLinks.length === 0) {
        console.log("No student links found for this user")
        setConnectedStudents([])
        setLoading(false)
        return
      }

      // Get student details separately
      const studentIds = rawLinks.map((link: any) => link.student_id)
      console.log("Looking up students:", studentIds)

      const { data: studentUsers, error: studentsError } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .in("id", studentIds)

      console.log("Students data:", { students: studentUsers, studentsError })

      if (studentsError) {
        console.error("Failed to load student details:", studentsError)
        setError("Failed to load student details. Please try again later.")
        setLoading(false)
        return
      }

      // Combine the data
      const links = rawLinks.map((link: any) => ({
        ...link,
        student: studentUsers?.find((s: any) => s.id === link.student_id) || null
      }))

      console.log("Combined links data:", links)

      // Process the data
      console.log("Processing combined links:", links)

      const filteredLinks = links.filter((link: StudentLink): link is StudentLink & { student: NonNullable<StudentLink['student']> } => {
        if (!link.student) {
          console.warn(`No student details found for link:`, {
            linkId: link.id,
            studentId: link.student_id,
            relationship: link.relationship,
            linkedAt: link.linked_at,
            rawLink: link
          })
          return false
        }
        return true
      })

      console.log("Filtered links:", {
        originalCount: links.length,
        filteredCount: filteredLinks.length,
        droppedCount: links.length - filteredLinks.length
      })

      const connectedStudentsList = filteredLinks.map((link: StudentLink & { student: NonNullable<StudentLink['student']> }) => {
        const connectedStudent = {
          id: link.student_id,
          full_name: link.student.full_name,
          email: link.student.email,
          linked_at: link.linked_at,
          relationship: link.relationship
        }
        console.log("Processed student:", connectedStudent)
        return connectedStudent
      })
      
      console.log("Final processed students:", {
        count: connectedStudentsList.length,
        students: connectedStudentsList
      })
      
      setConnectedStudents(connectedStudentsList)

      // Load stats for each student
      const stats: Record<string, any> = {}
      for (const student of connectedStudentsList) {
        // Get college matches count
        const { count: matchesCount } = await supabase
          .from("college_matches")
          .select("*", { count: "exact", head: true })
          .eq("student_id", student.id)

        // Get college list count
        const { count: listCount } = await supabase
          .from("my_college_list")
          .select("*", { count: "exact", head: true })
          .eq("student_id", student.id)

        // Get profile completion
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", student.id)
          .single()

        const profileCompletion = profile && profile.grade_level && profile.gpa ? 75 : 25

        stats[student.id] = {
          matches: matchesCount || 0,
          collegeList: listCount || 0,
          profileCompletion
        }
      }
      setStudentStats(stats)
    } catch (error) {
      console.error("Failed to load connected students:", error)
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnectedStudents()
  }, [user.id])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center text-slate-600">
          Loading connected students...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-slate-100 border-b">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Users className="h-5 w-5" />
            Connected Students
          </CardTitle>
          <CardDescription>
            Students who have shared their college search progress with you
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-2">Error Loading Data</div>
          <p className="text-slate-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-slate-100 border-b">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Users className="h-5 w-5" />
          Connected Students
        </CardTitle>
        <CardDescription>
          Students who have shared their college search progress with you
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {connectedStudents.length > 0 ? (
          <div className="divide-y">
            {connectedStudents.map((student) => (
              <div key={student.id} className="p-6 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {student.full_name}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Connected as {student.relationship} • 
                      Since {new Date(student.linked_at).toLocaleDateString()}
                    </p>
                    
                    {studentStats[student.id] && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span>{studentStats[student.id].matches} matches</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-600" />
                          <span>{studentStats[student.id].collegeList} colleges</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>{studentStats[student.id].profileCompletion}% complete</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <Link href={`/student/${student.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        View Progress
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-600">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2">No Connected Students</h3>
            <p>You'll see students here when they invite you to follow their college search progress.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}