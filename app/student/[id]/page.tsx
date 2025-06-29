import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, BookOpen, TrendingUp, Calendar } from "lucide-react"

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
  const { data: student } = await supabase.from("users").select("*").eq("id", params.id).eq("role", "student").single()

  const { data: studentProfile } = await supabase.from("student_profiles").select("*").eq("user_id", params.id).single()

  if (!student) {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{student.full_name}'s Profile</h1>
          <p className="text-muted-foreground">Viewing as {link.relationship} • Read-only access</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grade Level</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentProfile?.grade_level || "Not set"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GPA</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentProfile?.gpa || "Not set"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SAT Score</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentProfile?.sat_score || "Not taken"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ACT Score</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentProfile?.act_score || "Not taken"}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Academic Interests</CardTitle>
              <CardDescription>Areas of study the student is interested in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {studentProfile?.interests?.length ? (
                  studentProfile.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">
                      {interest}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No interests specified yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferred Majors</CardTitle>
              <CardDescription>Academic programs the student is considering</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {studentProfile?.preferred_majors?.length ? (
                  studentProfile.preferred_majors.map((major, index) => (
                    <Badge key={index} variant="outline">
                      {major}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No preferred majors specified yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>College Search Preferences</CardTitle>
            <CardDescription>Student's criteria for college selection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Budget Range</h4>
              <Badge variant="outline">{studentProfile?.budget_range || "Not specified"}</Badge>
            </div>
            <div>
              <h4 className="font-medium mb-2">Location Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {studentProfile?.location_preferences?.length ? (
                  studentProfile.location_preferences.map((location, index) => (
                    <Badge key={index} variant="secondary">
                      {location}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No location preferences specified</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
