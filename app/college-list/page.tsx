import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { CollegeListClient } from "./college-list-client"

export default async function CollegeListPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8] min-h-screen">
      <DashboardHeader user={user} />
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        <CollegeListClient />
      </div>
    </div>
  )
}
