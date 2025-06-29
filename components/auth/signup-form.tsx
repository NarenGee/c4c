"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RoleSelector } from "./role-selector"
import type { UserRole } from "@/lib/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { signupUser } from "@/app/actions/auth"
import { Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function SignupForm() {
  const [step, setStep] = useState<"role" | "details">("role")
  const [selectedRole, setSelectedRole] = useState<UserRole>()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [invitationInfo, setInvitationInfo] = useState<{
    studentName: string
    relationship: string
  } | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for invitation token in URL
  useEffect(() => {
    const token = searchParams.get("token")
    const email = searchParams.get("email")
    const role = searchParams.get("role") as UserRole

    if (token && email && role) {
      // Pre-fill form with invitation data
      setFormData((prev) => ({ ...prev, email }))
      setSelectedRole(role)
      setStep("details")

      // Fetch invitation details
      fetchInvitationDetails(token)
    }
  }, [searchParams])

  const fetchInvitationDetails = async (token: string) => {
    try {
      const supabase = createClient()
      const { data: invitation } = await supabase
        .from("invitation_tokens")
        .select(`
          *,
          student:users!invitation_tokens_student_id_fkey(full_name)
        `)
        .eq("token", token)
        .eq("used", false)
        .single()

      if (invitation && new Date(invitation.expires_at) > new Date()) {
        setInvitationInfo({
          studentName: invitation.student.full_name,
          relationship: invitation.relationship,
        })
      }
    } catch (error) {
      console.error("Failed to fetch invitation details:", error)
      // Don't show error to user, just continue without invitation info
    }
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setStep("details")
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    setLoading(true)
    setError(undefined)

    try {
      const result = await signupUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: selectedRole,
      })

      if (!result.success) {
        setError(result.error || "Failed to create account")
        return
      }

      if (result.needsEmailConfirmation) {
        setError("Please check your email and click the confirmation link to complete your registration.")
        return
      }

      // Success - redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      console.error("Signup error:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (step === "role" && !invitationInfo) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Role</CardTitle>
          <CardDescription>Select how you'll be using the college search platform</CardDescription>
        </CardHeader>
        <CardContent>
          <RoleSelector onRoleSelect={handleRoleSelect} selectedRole={selectedRole} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{invitationInfo ? "Accept Invitation" : "Create Account"}</CardTitle>
        <CardDescription>
          {invitationInfo
            ? `Join as ${invitationInfo.studentName}'s ${invitationInfo.relationship}`
            : `Sign up as a ${selectedRole}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitationInfo && (
          <Alert className="mb-4">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>{invitationInfo.studentName}</strong> has invited you to view their college search progress as
              their <strong>{invitationInfo.relationship}</strong>.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              disabled={!!invitationInfo}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!invitationInfo && (
              <Button type="button" variant="outline" onClick={() => setStep("role")} className="flex-1">
                Back
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating Account..." : invitationInfo ? "Accept & Create Account" : "Sign Up"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
