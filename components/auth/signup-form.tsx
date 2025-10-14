"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RoleSelector } from "./role-selector"
import type { UserRoleType } from "@/lib/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { signupUser } from "@/app/actions/auth"
import { Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { GoogleAuthButton } from "./google-auth-button"

export function SignupForm() {
  const [step, setStep] = useState<"role" | "details">("role")
  const [selectedRole, setSelectedRole] = useState<UserRoleType>()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string }>()
  const [invitationInfo, setInvitationInfo] = useState<{
    studentName: string
    relationship: string
    token: string
  } | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for invitation token in URL
  useEffect(() => {
    const token = searchParams.get("token")
    const email = searchParams.get("email")
    const role = searchParams.get("role") as UserRoleType

    console.log("URL params:", { token, email, role })

    if (token && email && role) {
      // Pre-fill form with invitation data
      setFormData((prev) => ({ ...prev, email }))
      setSelectedRole(role)
      setStep("details")

      // Set invitation info immediately to ensure form renders correctly
      setInvitationInfo({
        studentName: "Loading...",
        relationship: role,
        token: token
      })

      console.log("Fetching invitation details for token:", token)
      // Fetch invitation details
      fetchInvitationDetails(token)
    }
  }, [searchParams])

  // Emit initial step event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('signupStepChange', { detail: { step } }))
    }
  }, [step])

  const fetchInvitationDetails = async (token: string) => {
    try {
      console.log("Fetching invitation for token:", token)
      
      const response = await fetch(`/api/validate-invitation?token=${token}`)
      const result = await response.json()

      console.log("Invitation API response:", result)

      if (!result.success) {
        console.error("Invitation validation failed:", result.error)
        setInvitationInfo(prev => prev ? {
          ...prev,
          studentName: result.error || "Error loading student name"
        } : null)
        return
      }

      const invitationData = {
        studentName: result.invitation.studentName,
        relationship: result.invitation.relationship,
        token: token
      }
      
      console.log("Setting invitation info:", invitationData)
      setInvitationInfo(invitationData)
    } catch (error) {
      console.error("Failed to fetch invitation details:", error)
      setInvitationInfo(prev => prev ? {
        ...prev,
        studentName: "Error loading invitation"
      } : null)
    }
  }

  const handleRoleSelect = (role: UserRoleType) => {
    setSelectedRole(role)
    setStep("details")
    // Emit event to notify parent component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('signupStepChange', { detail: { step: "details" } }))
    }
  }

  const handleBackToRole = () => {
    setStep("role")
    // Emit event to notify parent component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('signupStepChange', { detail: { step: "role" } }))
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    console.log("=== SIGNUP BUTTON CLICKED ===")
    console.log("Selected role:", selectedRole)
    console.log("Form data:", formData)
    console.log("Invitation info:", invitationInfo)

    setLoading(true)
    setError(undefined)
    setMessage(undefined)

    try {
      const signupData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: selectedRole,
        invitationToken: invitationInfo?.token
      }

      console.log("=== SUBMITTING SIGNUP ===")
      console.log("Submitting signup with data:", signupData)

      const result = await signupUser(signupData)

      console.log("=== SIGNUP RESULT ===")
      console.log("Signup result:", result)

      if (!result.success) {
        console.error("=== SIGNUP FAILED ===")
        console.error("Error:", result.error)
        setMessage({ type: 'error', text: result.error || "Failed to create account" })
        return
      }

      console.log("=== SIGNUP SUCCESS ===")
      
      // For invited users, always redirect to dashboard immediately
      if (invitationInfo) {
        console.log("=== REDIRECTING INVITED USER ===")
        console.log("Invited user signup successful, redirecting to dashboard")
        router.push("/dashboard")
        router.refresh()
        return
      }

      // For non-invited users, check if email confirmation is needed
      if (result.needsEmailConfirmation) {
        console.log("=== EMAIL CONFIRMATION NEEDED ===")
        setMessage({ type: 'success', text: "Please check your email and click the confirmation link to complete your registration." })
        return
      }

      // Success - redirect to dashboard
      console.log("=== REDIRECTING REGULAR USER ===")
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      console.error("=== SIGNUP ERROR ===")
      console.error("Signup error:", err)
      setMessage({ type: 'error', text: err.message || "An unexpected error occurred" })
    } finally {
      console.log("=== SIGNUP COMPLETE ===")
      setLoading(false)
    }
  }

  if (step === "role" && !invitationInfo) {
    return <RoleSelector onRoleSelect={handleRoleSelect} selectedRole={selectedRole} />
  }

  console.log("Rendering form with invitationInfo:", invitationInfo)

  return (
    <div className="space-y-6">
      {invitationInfo && (
        <Alert className="border-blue-200 bg-blue-50">
          <Mail className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>{invitationInfo.studentName}</strong> has invited you to view their college search progress as
            their <strong>{invitationInfo.relationship}</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Google OAuth Button - only show for non-invited users */}
      {!invitationInfo && (
        <>
          <GoogleAuthButton 
            mode="signup" 
            onSuccess={() => window.location.href = "/dashboard"}
            onError={(error) => setMessage({ type: 'error', text: error })}
          />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with email</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSignup} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="fullName" className="text-slate-700 font-medium">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
            required
            autoComplete="name"
            className="h-12 border-gray-300 text-lg focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your full name"
          />
          {invitationInfo && (
            <p className="text-xs text-slate-600">You can update your name if needed</p>
          )}
        </div>

        {/* Only show email field for non-invited users */}
        {!invitationInfo && (
          <div className="space-y-3">
            <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              autoComplete="email"
              className="h-12 border-gray-300 text-lg focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            required
            minLength={6}
            autoComplete="new-password"
            className="h-12 border-gray-300 text-lg focus:border-blue-500 focus:ring-blue-500"
            placeholder="Create a password (min 6 characters)"
          />
        </div>

        {/* Show messages for all users */}
        {message && (
          <Alert 
            variant={message.type === 'error' ? 'destructive' : 'default'} 
            className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200'}
          >
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          {!invitationInfo && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleBackToRole} 
              className="flex-1 h-12 border-gray-300 text-slate-700 hover:bg-gray-50 text-lg"
            >
              Back
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading} 
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium"
          >
            {loading 
              ? "Creating Account..." 
              : invitationInfo 
                ? "Accept Invitation & Create Account" 
                : "Sign Up"
            }
          </Button>
        </div>
      </form>
    </div>
  )
}
