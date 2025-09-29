"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, UserCheck, Clock, BookOpen } from "lucide-react"
import type { UserRole } from "@/lib/auth"

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void
  selectedRole?: UserRole
}

export function RoleSelector({ onRoleSelect, selectedRole }: RoleSelectorProps) {
  const roles = [
    {
      id: "student" as UserRole,
      title: "Student",
      description: "Search for colleges and track application progress",
      icon: GraduationCap,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      id: "parent" as UserRole,
      title: "Parent/Guardian",
      description: "Monitor your child's college search progress",
      icon: Users,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      id: "coach" as UserRole,
      title: "College Coach",
      description: "Professional college counseling and student management",
      icon: BookOpen,
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
      {roles.map((role) => {
        const Icon = role.icon
        const isSelected = selectedRole === role.id
        const isComingSoon = role.id === "parent"
        const isCoach = role.id === "coach"
        
        const handleClick = () => {
          if (isComingSoon) return
          if (isCoach) {
            window.location.href = '/coach/signup'
            return
          }
          onRoleSelect(role.id)
        }
        
        return (
          <div className="relative" key={role.id}>
            {isComingSoon && (
              <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                <Clock className="h-5 w-5 text-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400 font-semibold">Coming Soon</span>
              </div>
            )}
          <Card
              className={`transition-all h-56 ${role.color} ${isSelected ? "ring-2 ring-blue-500" : ""} ${isComingSoon ? "opacity-60 cursor-not-allowed pointer-events-none" : "cursor-pointer hover:shadow-lg"}`}
              onClick={handleClick}
          >
            <CardHeader className="text-center h-full flex flex-col justify-center items-center p-6">
              <div className="mx-auto mb-4 p-3 rounded-full bg-white shadow-sm">
                <Icon className="h-8 w-8 text-slate-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-slate-800 mb-3 leading-tight text-center">
                {role.title}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 leading-relaxed text-center px-2 flex-1 flex items-center justify-center">
                {role.description}
              </CardDescription>
            </CardHeader>
          </Card>
          </div>
        )
      })}
    </div>
  )
}
