import type { User } from "@/lib/auth"
import { StudentDashboard } from "./student-dashboard"
import { ParentDashboard } from "./parent-dashboard"
import { CounselorDashboard } from "./counselor-dashboard"
import { CoachDashboard } from "./coach-dashboard"
import { SuperAdminDashboard } from "./super-admin-dashboard"

interface RoleDashboardProps {
  user: User
}

export function RoleDashboard({ user }: RoleDashboardProps) {
  const currentRole = user.current_role || user.role
  switch (currentRole) {
    case "student":
      return <StudentDashboard user={user} />
    case "parent":
      return <ParentDashboard user={user} />
    case "counselor":
      return <CounselorDashboard user={user} />
    case "coach":
      return <CoachDashboard user={user} />
    case "super_admin":
      return <SuperAdminDashboard user={user} />
    default:
      return <div>Invalid user role</div>
  }
}
