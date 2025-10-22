"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  BookOpen, 
  Shield,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  X
} from "lucide-react"
import type { User } from "@/lib/auth"
import { AssignmentModal } from "@/components/super-admin/assignment-modal"

interface SuperAdminDashboardProps {
  user: User
}

interface SystemUser {
  id: string
  email: string
  full_name: string
  role: string
  current_role: string
  created_at: string
  organization?: string
  is_active: boolean
}

interface CoachAssignment {
  id: string
  coach_id: string
  student_id: string
  coach_name: string
  coach_email: string
  coach_organization: string
  student_name: string
  student_email: string
  assigned_at: string
  is_active: boolean
}

interface SystemStats {
  total_users: number
  total_students: number
  total_coaches: number
  total_assignments: number
  active_assignments: number
}

export function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assignments'>('overview')
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<SystemUser[]>([])
  const [assignments, setAssignments] = useState<CoachAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load system stats
      const statsResponse = await fetch('/api/super-admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Load users
      const usersResponse = await fetch('/api/super-admin/users?' + new Date().getTime())
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Load assignments
      const assignmentsResponse = await fetch('/api/super-admin/assignments')
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData)
      }
    } catch (error) {
      console.error('Failed to load super admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesRole = roleFilter === 'all' || user.current_role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user)
    setEditModalOpen(true)
  }

  const handleSaveUser = async (updates: Partial<SystemUser>) => {
    if (!editingUser) return

    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.id,
          updates
        })
      })

      if (response.ok) {
        // Reload data
        loadData()
        setEditModalOpen(false)
        setEditingUser(null)
      } else {
        console.error('Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = (user: SystemUser) => {
    setDeletingUser(user)
    setDeleteModalOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!deletingUser) return

    try {
      const response = await fetch(`/api/super-admin/users?userId=${deletingUser.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Reload data
        loadData()
        setDeleteModalOpen(false)
        setDeletingUser(null)
      } else {
        console.error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  // Group assignments by coach
  const groupedAssignments = assignments.reduce((acc, assignment) => {
    const coachId = assignment.coach_id
    if (!acc[coachId]) {
      acc[coachId] = {
        coach: {
          id: assignment.coach_id,
          name: assignment.coach_name,
          email: assignment.coach_email,
          organization: assignment.coach_organization
        },
        students: []
      }
    }
    acc[coachId].students.push({
      id: assignment.student_id,
      name: assignment.student_name,
      email: assignment.student_email,
      assigned_at: assignment.assigned_at,
      is_active: assignment.is_active,
      assignment_id: assignment.id
    })
    return acc
  }, {} as Record<string, { coach: any, students: any[] }>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-slate-600">Loading super admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-6">
      {/* Header */}
      <div className="text-center space-y-2 md:space-y-4">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800">Super Admin Dashboard</h1>
        <p className="text-sm md:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto px-4">
          Manage users, coach assignments, and system-wide settings.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center overflow-x-auto pb-2">
        <div className="bg-white rounded-lg shadow-sm border p-1 flex space-x-1 min-w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'assignments', label: 'Coach Assignments', icon: UserCheck },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id === 'overview' ? 'Overview' : tab.id === 'users' ? 'Users' : 'Assignments'}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4 md:space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stats?.total_users || 0}</div>
                <p className="text-xs text-slate-600">All registered users</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stats?.total_students || 0}</div>
                <p className="text-xs text-slate-600">Active students</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coaches</CardTitle>
                <BookOpen className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stats?.total_coaches || 0}</div>
                <p className="text-xs text-slate-600">Active coaches</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
                <UserCheck className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{stats?.active_assignments || 0}</div>
                <p className="text-xs text-slate-600">Coach-student pairs</p>
              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4 md:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base md:text-lg text-slate-800">User Management</CardTitle>
              <CardDescription className="text-sm">View and manage all system users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="parent">Parents</SelectItem>
                    <SelectItem value="coach">Coaches</SelectItem>
                    <SelectItem value="counselor">Counselors</SelectItem>
                    <SelectItem value="super_admin">Super Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">User</TableHead>
                      <TableHead className="min-w-[100px]">Role</TableHead>
                      <TableHead className="hidden md:table-cell min-w-[150px]">Organization</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[100px]">Joined</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{user.full_name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {user.current_role?.replace('_', ' ') || 'No role'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm">{user.organization || <span className="text-slate-400">-</span>}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs">
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 md:gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4 md:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base md:text-lg text-slate-800">Coach-Student Assignments</CardTitle>
              <CardDescription className="text-sm">Manage which coaches are assigned to which students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <Input
                  placeholder="Search assignments..."
                  className="w-full sm:max-w-sm"
                />
                <AssignmentModal onAssignmentCreated={loadData} />
              </div>

              {/* Grouped Assignments */}
              <div className="space-y-4">
                {Object.values(groupedAssignments).map((group) => (
                  <Card key={group.coach.id} className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <CardTitle className="text-base md:text-lg text-slate-800">{group.coach.name}</CardTitle>
                          <CardDescription className="text-xs md:text-sm">
                            <div className="break-all">{group.coach.email}</div>
                            <div>{group.coach.organization || 'No Organization'}</div>
                          </CardDescription>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-medium text-slate-600">
                            {group.students.length} Student{group.students.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-slate-500">
                            {group.students.filter(s => s.is_active).length} Active
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {group.students.map((student) => (
                          <div key={student.assignment_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col gap-2">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-slate-800">{student.name}</div>
                                  <div className="text-xs text-slate-500 break-all">{student.email}</div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-xs text-slate-600">
                                    Assigned: {new Date(student.assigned_at).toLocaleDateString()}
                                  </div>
                                  <Badge variant={student.is_active ? "default" : "secondary"} className="text-xs">
                                    {student.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 sm:ml-4">
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {Object.keys(groupedAssignments).length === 0 && (
                  <div className="text-center text-slate-500 py-8 text-sm">
                    No coach-student assignments found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Edit User</DialogTitle>
            <DialogDescription className="text-sm">
              Make changes to the user profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="name" className="sm:text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  defaultValue={editingUser.full_name || ""}
                  className="sm:col-span-3"
                  onChange={(e) => {
                    setEditingUser({...editingUser, full_name: e.target.value})
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="email" className="sm:text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  defaultValue={editingUser.email || ""}
                  className="sm:col-span-3"
                  onChange={(e) => {
                    setEditingUser({...editingUser, email: e.target.value})
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="role" className="sm:text-right">
                  Role
                </Label>
                <Select 
                  value={editingUser.current_role || ""} 
                  onValueChange={(value) => {
                    setEditingUser({...editingUser, current_role: value as any})
                  }}
                >
                  <SelectTrigger className="sm:col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="counselor">Counselor</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="organization" className="sm:text-right">
                  Organization
                </Label>
                <Input
                  id="organization"
                  defaultValue={editingUser.organization || ""}
                  placeholder="Enter organization name"
                  className="sm:col-span-3"
                  onChange={(e) => {
                    setEditingUser({...editingUser, organization: e.target.value})
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingUser) {
                handleSaveUser({
                  full_name: editingUser.full_name,
                  email: editingUser.email,
                  current_role: editingUser.current_role,
                  organization: editingUser.organization
                })
              }
            }} className="w-full sm:w-auto">
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Delete User</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingUser && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm md:text-base text-red-900 break-words">{deletingUser.full_name || 'Unknown User'}</div>
                    <div className="text-xs md:text-sm text-red-700 break-all">{deletingUser.email}</div>
                    <div className="text-xs text-red-600 mt-1">
                      Role: {deletingUser.current_role?.replace('_', ' ') || 'No role'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser} className="w-full sm:w-auto">
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
