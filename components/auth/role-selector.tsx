"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BookOpen } from "lucide-react"
import type { UserRoleType } from "@/lib/auth"

interface RoleSelectorProps {
  onRoleSelect: (role: UserRoleType) => void
  selectedRole?: UserRoleType
}

export function RoleSelector({ onRoleSelect, selectedRole }: RoleSelectorProps) {
  const roles = [
    {
      id: "student" as UserRoleType,
      title: "Student",
      description: "Search for colleges and track application progress",
      icon: GraduationCap,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      id: "coach" as UserRoleType,
      title: "College Coach",
      description: "Professional college counseling and student management",
      icon: BookOpen,
      color: "bg-slate-50 border-slate-200 hover:bg-slate-100",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
      {roles.map((role) => {
        const Icon = role.icon
        const isSelected = selectedRole === role.id
        const isCoach = role.id === "coach"
        
        const handleClick = () => {
          if (isCoach) {
            window.location.href = '/coach/signup'
            return
          }
          onRoleSelect(role.id)
        }
        
        return (
          <Card
            key={role.id}
            className={`transition-all h-56 ${role.color} ${isSelected ? "ring-2 ring-blue-500" : ""} cursor-pointer hover:shadow-lg`}
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
        )
      })}
    </div>
  )
}
