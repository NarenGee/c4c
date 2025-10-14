"use client"

import { SignupForm } from "@/components/auth/signup-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<"role" | "details">("role")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Listen for step changes from the SignupForm
  useEffect(() => {
    const handleStepChange = (event: CustomEvent) => {
      setCurrentStep(event.detail.step)
    }

    window.addEventListener('signupStepChange', handleStepChange as EventListener)
    return () => {
      window.removeEventListener('signupStepChange', handleStepChange as EventListener)
    }
  }, [])

  const getContent = () => {
    if (currentStep === "role") {
      return {
        title: "Choose Your Role",
        subtitle: "Select how you'll be using the college search platform",
        maxWidth: "max-w-4xl"
      }
    } else {
      return {
        title: "Create Your Account",
        subtitle: "Start your college coaching journey today",
        maxWidth: "max-w-md"
      }
    }
  }

  const content = getContent()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="Coaching for College Logo" 
                  width={240} 
                  height={55}
                  className="w-32 sm:w-48 md:w-60"
                  style={{ height: 'auto' }}
                />
              </Link>
              <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                Alpha v1.0
              </div>
            </div>
            
            {/* Desktop Navigation - Simplified like landing page */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center gap-6">
                <Link href="/college-list" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  Colleges
                </Link>
                <Link href="/college-recommendations" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  Recommendations
                </Link>
                <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                  About
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-700 hover:text-blue-600">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
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
                <Link href="/college-list" className="text-slate-700 hover:text-blue-600 font-medium py-2">
                  Colleges
                </Link>
                <Link href="/college-recommendations" className="text-slate-700 hover:text-blue-600 font-medium py-2">
                  Recommendations
                </Link>
                <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-blue-600 font-medium py-2">
                  About
                </Link>
                <div className="flex gap-3 pt-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full border-slate-300 text-slate-700">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 sm:p-8">
        <div className={`w-full ${content.maxWidth} mx-auto`}>
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">{content.title}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{content.subtitle}</p>
          </div>

          <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
            <CardContent className="p-8 sm:p-10">
              <SignupForm />
            </CardContent>
          </Card>

          <div className="text-center mt-6 sm:mt-8">
            <p className="text-slate-600 text-base">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
