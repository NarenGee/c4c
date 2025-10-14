"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { GraduationCap, Building2 } from "lucide-react"
import { GoogleAuthButton } from "@/components/auth/google-auth-button"

export function CoachSignupForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    organization: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.fullName || !formData.organization) {
      setError("All fields are required")
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const response = await fetch('/api/auth/coach-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        router.push("/dashboard")
        router.refresh()
      } else if (result.suggestAddRole) {
        // User exists, show special message
        setError(
          `${result.error} You can sign in and add the coach role to your existing account from your profile page.`
        )
      } else {
        setError(result.error || "Failed to create account")
      }
    } catch (err: any) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 p-3 rounded-full bg-purple-100">
          <GraduationCap className="h-8 w-8 text-purple-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">
          Create Coach Account
        </CardTitle>
        <CardDescription>
          Join as a college counselor to guide students through their journey
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Google OAuth Button */}
        <GoogleAuthButton 
          mode="signup" 
          role="coach"
          onSuccess={() => {
            router.push("/dashboard")
            router.refresh()
          }}
          onError={(error) => setError(error)}
        />

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Smith"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@school.edu"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">School/Organization</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="organization"
                type="text"
                placeholder="Springfield High School"
                value={formData.organization}
                onChange={(e) => handleInputChange("organization", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-slate-600">
              Must be at least 8 characters long
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Coach Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <a href="/signin" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
