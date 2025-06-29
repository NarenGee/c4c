import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Search, BookOpen, Users, Brain } from "lucide-react"
import type { User } from "@/lib/auth"
import { ProfileCompletionPrompt } from "@/components/profile/profile-completion-prompt"
import { getStudentProfileCompletion } from "@/lib/auth"
import Link from "next/link"

interface StudentDashboardProps {
  user: User
}

export async function StudentDashboard({ user }: StudentDashboardProps) {
  // Check profile completion
  const profileCompletion = await getStudentProfileCompletion(user.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.full_name}!</h1>
        <p className="text-muted-foreground">Ready to continue your college search journey?</p>
      </div>

      {/* Profile Completion Prompt */}
      <ProfileCompletionPrompt
        isComplete={profileCompletion.isComplete}
        completionPercentage={profileCompletion.completionPercentage}
        missingFields={profileCompletion.missingFields}
        userName={user.full_name.split(" ")[0]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileCompletion.completionPercentage}%</div>
            <p className="text-xs text-muted-foreground">Complete your profile to get better recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted Colleges</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Colleges in your shortlist</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Applications in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Parents/counselors following your progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your college search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/college-recommendations">
                <Brain className="mr-2 h-4 w-4" />
                College Recommendations
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/college-list">
                <BookOpen className="mr-2 h-4 w-4" />
                View My College List
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <GraduationCap className="mr-2 h-4 w-4" />
              Update Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>College Recommendations</CardTitle>
            <CardDescription>AI-powered matches for your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Stanford University</p>
                  <p className="text-sm text-muted-foreground">95% match</p>
                </div>
                <Button size="sm">View</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">MIT</p>
                  <p className="text-sm text-muted-foreground">92% match</p>
                </div>
                <Button size="sm">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
