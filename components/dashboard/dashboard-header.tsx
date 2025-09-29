"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  User, 
  Brain, 
  BookOpen, 
  LogOut, 
  GraduationCap, 
  Award, 
  Target, 
  Menu, 
  X,
  ChevronDown,
  Shield,
  Users
} from "lucide-react"
import type { User as AuthUser } from "@/lib/auth"
import { signOut } from "@/app/actions/auth"
import { RoleSwitcher } from "@/components/auth/role-switcher"
import { AddRoleForm } from "@/components/auth/add-role-form"

interface DashboardHeaderProps {
  user: AuthUser
}

const getNavigationItems = (userRole: string) => {
  // Super admin only sees dashboard
  if (userRole === 'super_admin') {
    return [
      {
        name: "Admin Dashboard",
        href: "/dashboard",
        icon: Shield,
        description: "System administration & management",
        color: "text-red-600"
      }
    ]
  }
  
  // Coach navigation
  if (userRole === 'coach') {
    return [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Users,
        description: "Student management & coaching",
        color: "text-blue-600"
      },
      {
        name: "My Profile",
        href: "/dashboard/profile",
        icon: User,
        description: "Coach profile & organization",
        color: "text-green-600"
      }
    ]
  }

  // Parent/Guardian navigation
  if (userRole === 'parent') {
    return [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        description: "Monitor student progress",
        color: "text-blue-600"
      }
    ]
  }

  // Counselor navigation
  if (userRole === 'counselor') {
    return [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        description: "Student counseling & guidance",
        color: "text-blue-600"
      },
      {
        name: "My Profile",
        href: "/dashboard/profile",
        icon: User,
        description: "Counselor profile",
        color: "text-green-600"
      }
    ]
  }

  // Default student navigation
  return [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Overview & progress tracking",
      color: "text-blue-600"
    },
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: User,
      description: "Academic profile & preferences",
      color: "text-green-600"
    },
    {
      name: "College Matches",
      href: "/college-recommendations",
      icon: Target,
      description: "Recommended matches",
      color: "text-purple-600"
    },
    {
      name: "My Applications",
      href: "/college-list",
      icon: BookOpen,
      description: "Track application progress",
      color: "text-orange-600"
    }
  ]
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  
  const currentRole = user.current_role || user.role
  const navigationItems = getNavigationItems(currentRole)

  return (
    <div className="sticky top-0 z-50">
      {/* Top Header */}
      <div className="bg-gray-100 text-blue-900 shadow-lg">
        <div className="max-w-none mx-auto px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3">
                <Image 
                  src="/logo.png" 
                  alt="Coaching for College Logo" 
                  width={240} 
                  height={55}
                  className="w-24 sm:w-32 md:w-48 lg:w-60"
                />
              </Link>
              <div className="bg-slate-700 text-white px-2 py-1 sm:px-3 rounded-full text-xs font-medium">
                Alpha v1.0
              </div>
              
              {/* Desktop User Info */}
              <div className="hidden lg:block border-l border-blue-900 border-opacity-20 pl-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900 bg-opacity-10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-900">{user.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-blue-900">Welcome back, {user.full_name.split(" ")[0]}!</h1>
                    <p className="text-blue-700 text-sm">Ready to continue your college journey?</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3 sm:gap-4">
              <a
                href="https://cal.com/coachingforcollege/preliminary-meeting"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-semibold px-3 sm:px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-300 bg-[#1a1d2e] text-sm sm:text-base"
                style={{ textDecoration: 'none' }}
              >
                <img src="/Untitled-1-1.png" alt="Coach Logo" width={24} height={24} className="rounded-full bg-white shadow w-6 h-6 sm:w-7 sm:h-7" />
                <span className="hidden sm:inline">Speak to a Coach</span>
                <span className="sm:hidden">Coach</span>
              </a>
              <RoleSwitcher user={user} />
              <AddRoleForm user={user} />
              <form action={signOut}>
                <Button variant="outline" size="sm" className="border-blue-900 border-opacity-30 text-blue-900 bg-transparent hover:bg-blue-900 hover:text-white">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </form>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile User Info */}
          <div className="lg:hidden mt-4 pb-4 border-t border-blue-900 border-opacity-20">
            <div className="flex items-center gap-3 pt-4">
              <div className="w-10 h-10 bg-blue-900 bg-opacity-10 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-900">{user.full_name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-blue-900">Welcome back, {user.full_name.split(" ")[0]}!</h1>
                <p className="text-blue-700 text-sm">Ready to continue your college journey?</p>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-blue-900 border-opacity-20">
              <div className="flex flex-col gap-3 pt-4">
                <a
                  href="https://cal.com/coachingforcollege/preliminary-meeting"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-semibold px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-300 bg-[#1a1d2e] text-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <img src="/Untitled-1-1.png" alt="Coach Logo" width={24} height={24} className="rounded-full bg-white shadow w-6 h-6" />
                  Speak to a Coach
                </a>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <RoleSwitcher user={user} />
                    <AddRoleForm user={user} />
                  </div>
                  <form action={signOut}>
                    <Button variant="outline" size="sm" className="w-full border-blue-900 border-opacity-30 text-blue-900 bg-transparent hover:bg-blue-900 hover:text-white">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-none mx-auto px-4 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b-3 border-transparent transition-all hover:bg-slate-50 min-w-fit whitespace-nowrap",
                    isActive && "border-blue-600 bg-blue-50"
                  )}
                >
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isActive ? "text-blue-600" : "text-slate-500")} />
                  <div className="text-center">
                    <div className={cn("font-medium text-xs sm:text-sm", isActive ? "text-blue-700" : "text-slate-700")}>
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 hidden sm:block">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="w-full justify-between py-4"
            >
              <span className="font-medium">Navigation</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", mobileNavOpen && "rotate-180")} />
            </Button>
            
            {mobileNavOpen && (
              <div className="border-t border-gray-200">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 border-l-3 border-transparent transition-all hover:bg-slate-50",
                        isActive && "border-blue-600 bg-blue-50"
                      )}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-500")} />
                      <div>
                        <div className={cn("font-medium text-sm", isActive ? "text-blue-700" : "text-slate-700")}>
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 