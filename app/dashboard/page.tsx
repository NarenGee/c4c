import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { RoleDashboard } from "@/components/dashboard/role-dashboard"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <RoleDashboard user={user} />
    </div>
  )
}
