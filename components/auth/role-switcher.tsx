"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, User, GraduationCap, Users, BookOpen, Shield } from "lucide-react"
import type { User, UserRole, UserRoleType } from "@/lib/auth"

interface RoleSwitcherProps {
  user: User
}

const roleIcons = {
  student: GraduationCap,
  parent: Users,
  counselor: BookOpen,
  coach: BookOpen,
  super_admin: Shield,
}

const roleLabels = {
  student: "Student",
  parent: "Parent/Guardian",
  counselor: "Counselor",
  coach: "College Coach",
  super_admin: "Super Admin",
}

const roleColors = {
  student: "bg-blue-50 text-blue-700 border-blue-200",
  parent: "bg-green-50 text-green-700 border-green-200",
  counselor: "bg-purple-50 text-purple-700 border-purple-200",
  coach: "bg-orange-50 text-orange-700 border-orange-200",
  super_admin: "bg-red-50 text-red-700 border-red-200",
}

export function RoleSwitcher({ user }: RoleSwitcherProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const currentRole = user.current_role || user.role
  const availableRoles = user.roles || []
  const CurrentIcon = roleIcons[currentRole]

  const handleRoleSwitch = async (newRole: UserRoleType) => {
    if (newRole === currentRole) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      const result = await response.json()
      
      if (result.success) {
        // Force a page refresh to update the user context
        router.refresh()
      } else {
        console.error('Failed to switch role:', result.error)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error switching role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // If user only has one role, show a simple badge
  if (availableRoles.length <= 1) {
    return (
      <Badge variant="outline" className={`${roleColors[currentRole]} flex items-center gap-2`}>
        <CurrentIcon className="h-4 w-4" />
        {roleLabels[currentRole]}
      </Badge>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`${roleColors[currentRole]} hover:bg-opacity-80 flex items-center gap-2`}
          disabled={isLoading}
        >
          <CurrentIcon className="h-4 w-4" />
          {roleLabels[currentRole]}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Switch Role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {availableRoles
          .filter(role => role.is_active)
          .map((roleData) => {
            const RoleIcon = roleIcons[roleData.role]
            const isCurrentRole = roleData.role === currentRole
            
            return (
              <DropdownMenuItem
                key={roleData.id}
                onClick={() => handleRoleSwitch(roleData.role)}
                disabled={isCurrentRole || isLoading}
                className={`flex items-center gap-2 ${isCurrentRole ? 'bg-slate-100' : ''}`}
              >
                <RoleIcon className="h-4 w-4" />
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{roleLabels[roleData.role]}</span>
                  {roleData.organization && (
                    <span className="text-xs text-slate-500">{roleData.organization}</span>
                  )}
                </div>
                {isCurrentRole && (
                  <Badge variant="secondary" className="text-xs">Current</Badge>
                )}
              </DropdownMenuItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
