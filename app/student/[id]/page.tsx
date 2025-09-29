import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  Target, 
  Heart,
  MapPin,
  DollarSign
} from "lucide-react"

interface StudentViewPageProps {
  params: {
    id: string
  }
}

export default async function StudentViewPage({ params }: StudentViewPageProps) {
  const user = await getCurrentUser()

  if (!user || user.role === "student") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  // Verify access to this student
  const { data: link } = await supabase
    .from("student_links")
    .select("*")
    .eq("student_id", params.id)
    .eq("linked_user_id", user.id)
    .eq("status", "accepted")
    .single()

  if (!link) {
    redirect("/dashboard")
  }

  // Get student data
  const { data: student } = await supabase
    .from("users")
    .select("*")
    .eq("id", params.id)
    .eq("role", "student")
    .single()

  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", params.id)
    .single()

  // Get college matches
  const { data: collegeMatches } = await supabase
    .from("college_matches")
    .select("*")
    .eq("student_id", params.id)
    .order("match_score", { ascending: false })
    .limit(10)

  // Get college list
  const { data: collegeList } = await supabase
    .from("my_college_list")
    .select("*")
    .eq("student_id", params.id)
    .order("priority", { ascending: true })

  if (!student) {
    redirect("/dashboard")
  }

  const completionStats = {
    profile: studentProfile?.grade_level && studentProfile?.gpa ? 100 : 50,
    matches: collegeMatches?.length ? 100 : 0,
    applications: collegeList?.length ? 100 : 0
  }

  const overallProgress = Math.round(
    (completionStats.profile + completionStats.matches + completionStats.applications) / 3
  )

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 border">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-800">{student.full_name}'s Progress</h1>
                <p className="text-slate-600 mt-2">
                  Viewing as {link.relationship} • Read-only access
                </p>
                <Badge className="mt-3 bg-blue-100 text-blue-800">
                  Connected since {new Date(link.linked_at || link.created_at).toLocaleDateString()}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-slate-800">{overallProgress}%</div>
                <p className="text-sm text-slate-600">Overall Progress</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Grade Level</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentProfile?.grade_level || "Not set"}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GPA</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentProfile?.gpa || "Not set"}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">College Matches</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collegeMatches?.length || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">College List</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collegeList?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="profile">Academic Profile</TabsTrigger>
              <TabsTrigger value="matches">College Matches</TabsTrigger>
              <TabsTrigger value="list">College List</TabsTrigger>
              <TabsTrigger value="progress">Progress Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-slate-100 border-b">
                  <CardTitle className="text-slate-800">Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2">Test Scores</h4>
                      <div className="space-y-2">
                        <p><strong>SAT:</strong> {studentProfile?.sat_score || "Not taken"}</p>
                        <p><strong>ACT:</strong> {studentProfile?.act_score || "Not taken"}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2">Preferences</h4>
                      <div className="space-y-2">
                        <p><strong>Budget Range:</strong> {studentProfile?.budget_range || "Not specified"}</p>
                        <p><strong>Preferred Majors:</strong> {
                          studentProfile?.preferred_majors?.join(", ") || "Not specified"
                        }</p>
                      </div>
                    </div>
                  </div>
                  {studentProfile?.interests && studentProfile.interests.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-slate-700 mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {studentProfile.interests.map((interest, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="matches" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-slate-100 border-b">
                  <CardTitle className="text-slate-800">AI-Generated College Matches</CardTitle>
                  <CardDescription>
                    Personalized recommendations based on academic profile and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {collegeMatches && collegeMatches.length > 0 ? (
                    <div className="divide-y">
                      {collegeMatches.map((match, index) => (
                        <div key={match.id} className="p-6 hover:bg-slate-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-800">
                                {match.college_name}
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                {match.city && match.country && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {match.city}, {match.country}
                                  </span>
                                )}
                                {match.estimated_cost && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {match.estimated_cost}
                                  </span>
                                )}
                              </div>
                              <p className="mt-3 text-slate-700">{match.justification}</p>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.round(match.match_score * 100)}%
                              </div>
                              <p className="text-xs text-slate-600">Match Score</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-600">
                      <Target className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <h3 className="text-lg font-semibold mb-2">No College Matches Yet</h3>
                      <p>College recommendations will appear here once the student completes their profile.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="list" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-slate-100 border-b">
                  <CardTitle className="text-slate-800">Student's College List</CardTitle>
                  <CardDescription>
                    Colleges the student is considering and tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {collegeList && collegeList.length > 0 ? (
                    <div className="divide-y">
                      {collegeList.map((college) => (
                        <div key={college.id} className="p-6 hover:bg-slate-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-800">
                                {college.college_name}
                              </h3>
                              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {college.college_location}
                                </span>
                                <span className="capitalize">{college.college_type}</span>
                              </div>
                              {college.notes && (
                                <p className="mt-2 text-slate-700">{college.notes}</p>
                              )}
                            </div>
                            <div className="ml-4 space-y-2">
                              <Badge 
                                className={`px-3 py-1 ${
                                  college.priority === 1 
                                    ? 'bg-red-100 text-red-800' 
                                    : college.priority === 2 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {college.priority === 1 ? 'Reach' : college.priority === 2 ? 'Target' : 'Safety'}
                              </Badge>
                              <div className="text-right">
                                <p className="text-sm capitalize text-slate-600">
                                  {college.application_status?.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-600">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <h3 className="text-lg font-semibold mb-2">No Colleges Added Yet</h3>
                      <p>The student's college list will appear here as they add schools they're interested in.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-800">Profile Completion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {completionStats.profile}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${completionStats.profile}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-800">College Research</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {completionStats.matches}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${completionStats.matches}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-slate-800">Application Planning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {completionStats.applications}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${completionStats.applications}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-slate-100 border-b">
                  <CardTitle className="text-slate-800">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center text-slate-600 py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p>Activity timeline will be available in the next update</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
