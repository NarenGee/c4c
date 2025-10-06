import { EnhancedStudentDashboard } from "./enhanced-student-dashboard";
import type { User } from "@/lib/auth";

interface StudentDashboardProps {
  user: User;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  return <EnhancedStudentDashboard user={user} />;
}
