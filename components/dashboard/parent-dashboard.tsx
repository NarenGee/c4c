import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, TrendingUp, Bell, Activity } from "lucide-react"
import type { User } from "@/lib/auth"
import { ConnectedStudentsSection } from "./connected-students-section"
// import { LinkedStudentsList } from "@/components/student-links/linked-students-list"
// import { NotificationCenter } from "@/components/notifications/notification-center"

interface ParentDashboardProps {
  user: User
}

export function ParentDashboard({ user }: ParentDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-800 text-white rounded-t-lg p-4">
            <CardTitle className="text-sm font-medium text-white">Linked Students</CardTitle>
            <Users className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Students you're monitoring</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-800 text-white rounded-t-lg p-4">
            <CardTitle className="text-sm font-medium text-white">Applications</CardTitle>
            <BookOpen className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Total applications in progress</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-800 text-white rounded-t-lg p-4">
            <CardTitle className="text-sm font-medium text-white">Overall Progress</CardTitle>
            <TrendingUp className="h-5 w-5 text-slate-300" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-3xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">Average completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Students Section */}
      <ConnectedStudentsSection user={user} />

      {/* <div className="grid gap-6 md:grid-cols-2">
        <NotificationCenter />
        <LinkedStudentsList />
      </div> */}

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-slate-100 border-b">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Users className="h-5 w-5" />
            Student Overview
          </CardTitle>
          <CardDescription>
            Check the latest updates and application statuses for your student(s).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm">Added <span className="font-semibold">Stanford University</span> to shortlist</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm">Completed application for <span className="font-semibold">MIT</span></p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                 <div className="flex items-start space-x-3">
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm">Received new college recommendation: <span className="font-semibold">Caltech</span></p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-l">
               <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Application Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="text-lg font-bold">3</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Submitted</span>
                  <span className="text-lg font-bold">2</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Accepted</span>
                  <span className="text-lg font-bold text-green-600">0</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
