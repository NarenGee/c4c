import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, TrendingUp, Calendar, UserCheck, Activity } from "lucide-react"
import type { User } from "@/lib/auth"
import { Button } from "@/components/ui/button"

interface CounselorDashboardProps {
  user: User
}

export function CounselorDashboard({ user }: CounselorDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-800 text-white rounded-t-lg p-4">
            <CardTitle className="text-sm font-medium text-white">Active Students</CardTitle>
            <Users className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Students under your guidance</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-800 text-white rounded-t-lg p-4">
            <CardTitle className="text-sm font-medium text-white">Total Applications</CardTitle>
            <BookOpen className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Applications this year</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-800 text-white rounded-t-lg p-4">
            <CardTitle className="text-sm font-medium text-white">Success Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">Accepted to top choice</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-800 text-white rounded-t-lg p-4">
            <CardTitle className="text-sm font-medium text-white">Meetings This Week</CardTitle>
            <Calendar className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Scheduled meetings</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-slate-100 border-b">
           <CardTitle className="flex items-center gap-2 text-slate-800">
            <Users className="h-5 w-5" />
            Student Caseload
          </CardTitle>
          <CardDescription>
            Manage your student roster and view their progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
           <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              You have <span className="font-bold text-slate-800">24 students</span> assigned to you.
            </p>
            <Button>
              <UserCheck className="mr-2 h-4 w-4" />
              Manage Students
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
             <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Important dates to track for your students.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">Early Decision Deadline</p>
                <p className="text-sm text-muted-foreground">5 students affected</p>
              </div>
              <span className="font-semibold text-red-600">Nov 15</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">Regular Decision</p>
                <p className="text-sm text-muted-foreground">18 students affected</p>
              </div>
              <span className="font-semibold text-orange-600">Jan 1</span>
            </div>
          </CardContent>
        </Card>
         <Card className="border-0 shadow-lg">
          <CardHeader>
             <CardTitle className="flex items-center gap-2 text-slate-800">
              <Activity className="h-5 w-5 text-green-600" />
              Recent Student Activity
            </CardTitle>
            <CardDescription>Latest updates across your student base.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
              <div>
                <p className="text-sm"><span className="font-semibold">Alex</span> added <span className="font-semibold">UCLA</span> to shortlist.</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
             <div className="flex items-start space-x-3">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 shrink-0"></div>
              <div>
                <p className="text-sm"><span className="font-semibold">Maria</span> completed her application for <span className="font-semibold">NYU</span>.</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
