"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Plus, GraduationCap, Users, BookOpen, Shield } from "lucide-react"
import type { User, UserRoleType } from "@/lib/auth"

interface AddRoleFormProps {
  user: User
}

const availableRoles: { value: UserRoleType; label: string; description: string; icon: any; requiresOrg?: boolean }[] = [
  {
    value: "student",
    label: "Student",
    description: "Access to college search and application tools",
    icon: GraduationCap,
  },
  {
    value: "parent",
    label: "Parent/Guardian",
    description: "Monitor and support your student's college journey",
    icon: Users,
  },
  {
    value: "coach",
    label: "College Coach",
    description: "Professional college counseling and student management",
    icon: BookOpen,
    requiresOrg: true,
  },
]

export function AddRoleForm({ user }: AddRoleFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRoleType | "">("")
  const [organization, setOrganization] = useState("")
  const router = useRouter()

  const userRoles = user.roles?.map(r => r.role) || [user.role]
  const roleOptions = availableRoles.filter(role => !userRoles.includes(role.value))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    const selectedRoleData = availableRoles.find(r => r.value === selectedRole)
    if (selectedRoleData?.requiresOrg && !organization) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/add-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: selectedRole,
          organization: organization || undefined
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setIsOpen(false)
        setSelectedRole("")
        setOrganization("")
        router.refresh() // Refresh to update the user context
      } else {
        console.error('Failed to add role:', result.error)
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error adding role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (roleOptions.length === 0) {
    return null // No additional roles available
  }

  const selectedRoleData = availableRoles.find(r => r.value === selectedRole)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Additional Role</DialogTitle>
          <DialogDescription>
            Add another role to your account to access different features.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Select Role</Label>
            <Select value={selectedRole} onValueChange={(value: UserRoleType) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role to add" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => {
                  const Icon = role.icon
                  return (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-slate-500">{role.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedRoleData?.requiresOrg && (
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                type="text"
                placeholder="Enter your organization name"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
              />
            </div>
          )}


          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedRole || (selectedRoleData?.requiresOrg && !organization) || isLoading}
              className="flex-1"
            >
              {isLoading ? "Adding..." : "Add Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
