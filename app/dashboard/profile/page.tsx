import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProfileClient } from "./profile-client"
import { CoachProfile } from "@/components/profile/coach-profile"

export default async function ProfilePage() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      redirect("/login")
    }

    const currentRole = user.current_role || user.role

    // Super admins shouldn't access profile pages - redirect to dashboard
    if (currentRole === 'super_admin') {
      redirect("/dashboard")
    }

    // Coaches get their coach profile
    if (currentRole === 'coach') {
      return (
        <div className="bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8] min-h-screen">
          <DashboardHeader user={user} />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
            <CoachProfile user={user} />
          </div>
        </div>
      )
    }

    // Students get their full profile
    if (currentRole === 'student') {
      return (
        <div className="bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8] min-h-screen">
          <DashboardHeader user={user} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
            <ProfileClient user={user} />
          </div>
        </div>
      )
    }

    // Other roles (parent, counselor) don't have profile pages yet
    return (
      <div className="bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8] min-h-screen">
        <DashboardHeader user={user} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Profile Coming Soon</h2>
            <p className="text-slate-600">Profile management for {currentRole} role is under development.</p>
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error("Profile page error:", error)
    // Instead of redirecting, render an error state
    return (
      <div className="bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Unable to Load Profile</h2>
            <p className="text-slate-600 mb-4">There was an error loading your profile. Please try refreshing the page or logging in again.</p>
            <a 
              href="/login" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }
}