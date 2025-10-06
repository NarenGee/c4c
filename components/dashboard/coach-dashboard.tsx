"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  GraduationCap, 
  Target, 
  FileText, 
  Search,
  Download,
  MessageSquare
} from "lucide-react"
import type { User } from "@/lib/auth"
import { StudentNotesModal } from "@/components/coach/student-notes-modal"
import { ExportStudentsButton } from "@/components/coach/export-students-button"
import { StudentDetailModal } from "@/components/coach/student-detail-modal"
import { AIChatAssistant } from "@/components/coach/ai-chat-assistant"

interface CoachStudent {
  id: string
  full_name: string
  email: string
  grade_level?: string
  gpa?: number
  country_of_residence?: string
  profile_completion: number
  college_matches_count: number
  college_list_count: number
  application_progress: {
    considering: number
    planning_to_apply: number
    applied: number
    interviewing: number
    accepted: number
    rejected: number
    enrolled: number
  }
  assigned_at: string
  last_sign_in_at?: string
}

interface CoachDashboardProps {
  user: User
}

export function CoachDashboard({ user }: CoachDashboardProps) {
  const [students, setStudents] = useState<CoachStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  // Close AI assistant by default on small screens
  const [isAIChatOpen, setIsAIChatOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      console.log("Loading students for coach...")
      const response = await fetch('/api/coach/students')
      const data = await response.json()
      console.log("API response:", data)
      
      if (data.success) {
        setStudents(data.students || [])
        console.log("Loaded students:", data.students?.length || 0)
        
        // Debug: Log student details for Ethan
        const ethan = data.students?.find(s => s.email?.includes('coachingforcollegead'))
        if (ethan) {
          console.log("🧑‍🎓 Ethan's data:", {
            email: ethan.email,
            profile_completion: ethan.profile_completion,
            college_matches_count: ethan.college_matches_count,
            college_list_count: ethan.college_list_count,
            grade_level: ethan.grade_level,
            gpa: ethan.gpa
          })
        }
      } else {
        console.error("API error:", data.error)
      }
    } catch (error) {
      console.error("Failed to load students:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "incomplete" && student.profile_completion < 80) ||
                         (filterStatus === "complete" && student.profile_completion >= 80)
    return matchesSearch && matchesFilter
  })

  const stats = {
    totalStudents: students.length,
    incompleteProfiles: students.filter(s => s.profile_completion < 80).length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
            <div className="text-slate-600">Loading your students...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center pb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Coach Dashboard</h1>
          <p className="text-slate-600">Welcome back, {user.full_name}</p>
        </div>

        {/* Stats Cards */}

        {/* Main Content */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-slate-800 text-white border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Management
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Track and manage your assigned students' college search progress
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <ExportStudentsButton 
                  students={filteredStudents} 
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mt-6">
              <div className="relative flex-1 max-w-full sm:max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-800 w-full sm:w-auto"
              >
                <option value="all">All Students</option>
                <option value="incomplete">Incomplete Profiles</option>
                <option value="complete">Complete Profiles</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredStudents.length > 0 ? (
              <>
                {/* Mobile card list */}
                <div className="grid grid-cols-1 gap-3 p-4 sm:hidden">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="rounded-lg border border-slate-200 p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-800">{student.full_name}</div>
                          <div className="text-sm text-slate-600 break-all">{student.email}</div>
                          {student.grade_level && (
                            <div className="text-xs text-slate-500">Grade {student.grade_level}</div>
                          )}
                          <div className="text-xs text-slate-500 mt-1">
                            Last login: {student.last_sign_in_at 
                              ? new Date(student.last_sign_in_at).toLocaleDateString()
                              : "Never"
                            }
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <StudentDetailModal studentId={student.id} studentName={student.full_name} />
                          <StudentNotesModal
                            studentId={student.id}
                            studentName={student.full_name}
                            onNotesUpdated={() => console.log('Notes updated for student:', student.full_name)}
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">Profile Completion</span>
                            <span className="text-sm text-slate-600">{student.profile_completion}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                student.profile_completion >= 80 ? 'bg-green-500' : 
                                student.profile_completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${student.profile_completion}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs font-medium text-slate-700">Country</span>
                            <div className="text-sm text-slate-800">{student.country_of_residence || 'Not specified'}</div>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-slate-700">Grade Level</span>
                            <div className="text-sm text-slate-800">{student.grade_level || 'Not specified'}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <StudentDetailModal studentId={student.id} studentName={student.full_name} defaultTab="matches">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs cursor-pointer hover:bg-blue-100 transition-colors">
                              {student.college_matches_count} AI recommendations
                            </Badge>
                          </StudentDetailModal>
                          <StudentDetailModal studentId={student.id} studentName={student.full_name} defaultTab="applications">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs cursor-pointer hover:bg-purple-100 transition-colors">
                              {student.college_list_count} colleges in application list
                            </Badge>
                          </StudentDetailModal>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="overflow-x-auto hidden sm:block">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-slate-800 w-1/3">Student</th>
                        <th className="text-left p-4 font-medium text-slate-800 w-1/2">Profile Details</th>
                        <th className="text-left p-4 font-medium text-slate-800 w-1/6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-slate-800">{student.full_name}</div>
                              <div className="text-sm text-slate-600">{student.email}</div>
                              {student.grade_level && (
                                <div className="text-xs text-slate-500">Grade {student.grade_level}</div>
                              )}
                              <div className="text-xs text-slate-500 mt-1">
                                Last login: {student.last_sign_in_at 
                                  ? new Date(student.last_sign_in_at).toLocaleDateString()
                                  : "Never"
                                }
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-slate-700">Profile Completion</span>
                                  <span className="text-sm text-slate-600">{student.profile_completion}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${
                                      student.profile_completion >= 80 ? 'bg-green-500' : 
                                      student.profile_completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${student.profile_completion}%` }}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-xs font-medium text-slate-700">Country</span>
                                  <div className="text-sm text-slate-800">{student.country_of_residence || "Not specified"}</div>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-slate-700">Grade Level</span>
                                  <div className="text-sm text-slate-800">{student.grade_level || "Not specified"}</div>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <StudentDetailModal studentId={student.id} studentName={student.full_name} defaultTab="matches">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs cursor-pointer hover:bg-blue-100 transition-colors">
                                    {student.college_matches_count} AI recommendations
                                  </Badge>
                                </StudentDetailModal>
                                <StudentDetailModal studentId={student.id} studentName={student.full_name} defaultTab="applications">
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs cursor-pointer hover:bg-purple-100 transition-colors">
                                    {student.college_list_count} colleges in application list
                                  </Badge>
                                </StudentDetailModal>
                                {student.application_progress.applied > 0 && (
                                  <StudentDetailModal studentId={student.id} studentName={student.full_name} defaultTab="applications">
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs cursor-pointer hover:bg-orange-100 transition-colors">
                                      {student.application_progress.applied} applied
                                    </Badge>
                                  </StudentDetailModal>
                                )}
                                {student.application_progress.accepted > 0 && (
                                  <StudentDetailModal studentId={student.id} studentName={student.full_name} defaultTab="applications">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs cursor-pointer hover:bg-green-100 transition-colors">
                                      {student.application_progress.accepted} accepted
                                    </Badge>
                                  </StudentDetailModal>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-2">
                              <StudentDetailModal studentId={student.id} studentName={student.full_name} />
                              <StudentNotesModal
                                studentId={student.id}
                                studentName={student.full_name}
                                onNotesUpdated={() => {
                                  console.log('Notes updated for student:', student.full_name)
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-600 bg-slate-50">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold mb-2 text-slate-800">No Students Found</h3>
                <p className="text-slate-600">
                  {searchTerm || filterStatus !== "all" 
                    ? "No students match your current filters." 
                    : "You don't have any assigned students yet. Contact your administrator to get students assigned to you."
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Assistant Sidebar */}
      <AIChatAssistant
        students={students}
        isOpen={isAIChatOpen}
        onToggle={() => setIsAIChatOpen(!isAIChatOpen)}
      />
    </div>
  )
}
