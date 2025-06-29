"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, UserCheck } from "lucide-react"
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
      description: "Search for colleges and track applications",
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
      id: "counselor" as UserRole,
      title: "Counselor",
      description: "Guide students through their college journey",
      icon: UserCheck,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roles.map((role) => {
        const Icon = role.icon
        const isSelected = selectedRole === role.id

        return (
          <Card
            key={role.id}
            className={`cursor-pointer transition-all ${role.color} ${isSelected ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => onRoleSelect(role.id)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 p-3 rounded-full bg-white">
                <Icon className="h-8 w-8" />
              </div>
              <CardTitle className="text-lg">{role.title}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
