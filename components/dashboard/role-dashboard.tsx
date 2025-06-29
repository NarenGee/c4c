import type { User } from "@/lib/auth"
import { StudentDashboard } from "./student-dashboard"
import { ParentDashboard } from "./parent-dashboard"
import { CounselorDashboard } from "./counselor-dashboard"

interface RoleDashboardProps {
  user: User
}

export function RoleDashboard({ user }: RoleDashboardProps) {
  switch (user.role) {
    case "student":
      return <StudentDashboard user={user} />
    case "parent":
      return <ParentDashboard user={user} />
    case "counselor":
      return <CounselorDashboard user={user} />
    default:
      return <div>Invalid user role</div>
  }
}
