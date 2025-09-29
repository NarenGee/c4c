import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { RoleDashboard } from "@/components/dashboard/role-dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

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
        <DashboardHeader user={user} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
          <RoleDashboard user={user} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    // Redirect to login if there's an authentication error
    redirect("/login")
  }
}
