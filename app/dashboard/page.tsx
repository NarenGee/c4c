import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"
import { RoleDashboard } from "@/components/dashboard/role-dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardPage() {
  try {
    console.log("Dashboard page loading...")
    const user = await getCurrentUser()
    console.log("User result:", user ? "User found" : "No user")

    if (!user) {
      console.log("Redirecting to login - no user found")
      redirect("/login")
    }

    return (
      <div className="bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8] min-h-screen">
        <DashboardShell>
          <DashboardHeader user={user} />
          <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-2 sm:pt-4 lg:pt-8">
            <RoleDashboard user={user} />
          </div>
        </DashboardShell>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    // Redirect to login if there's an authentication error
    redirect("/login")
  }
}
