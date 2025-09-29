"use client"

import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export default function LoginPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gray-100 shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="Coaching for College Logo" 
                  width={240} 
                  height={55}
                  className="w-32 sm:w-48 md:w-60"
                />
              </Link>
              <div className="bg-slate-700 text-white px-2 py-1 sm:px-3 rounded-full text-xs font-medium">
                Alpha v1.0
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/signup">
                <Button variant="outline" className="border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white">
                  Sign Up
                </Button>
              </Link>
              <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                <Button className="bg-slate-700 hover:bg-slate-800 text-white">
                  About Coaching for College
                </Button>
              </Link>
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

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col gap-3 pt-4">
                <Link href="/signup">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white">
                    Sign Up
                  </Button>
                </Link>
                <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white">
                    About Coaching for College
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 sm:p-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Sign In</h2>
            <p className="text-slate-600 text-sm sm:text-base">Welcome back to your college coaching portal</p>
          </div>

          <Card className="bg-white shadow-lg border-slate-200">
            <CardContent className="p-6 sm:p-8">
              <LoginForm />
            </CardContent>
          </Card>

          <div className="text-center mt-4 sm:mt-6 space-y-2">
            <p className="text-slate-600 text-sm sm:text-base">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up for free
              </Link>
            </p>
            <p className="text-slate-500 text-xs">
              System administrator?{" "}
              <Link href="/super-admin/login" className="text-red-600 hover:text-red-700 font-medium">
                Admin Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
