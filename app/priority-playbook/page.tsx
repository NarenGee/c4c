import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StudentAISidebarShell } from "@/components/student/student-ai-sidebar-shell"
import { PriorityPlaybookWizard } from "@/components/priority-playbook/priority-playbook-wizard"

export const dynamic = "force-dynamic"

export default async function PriorityPlaybookPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const role = user.current_role || user.role
  if (role !== "student") {
    redirect("/dashboard")
  }

  return (
    <div className="bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8] min-h-screen">
      <DashboardHeader user={user} />
      <StudentAISidebarShell enabled>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12">
          <PriorityPlaybookWizard studentName={user.full_name} />
        </div>
      </StudentAISidebarShell>
    </div>
  )
}
