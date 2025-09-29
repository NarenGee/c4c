"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SuperAdminLoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export function SuperAdminLoginForm({ 
  onSuccess, 
  redirectTo = "/dashboard" 
}: SuperAdminLoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const supabase = createClient()

      // Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError("Failed to sign in")
        return
      }

      // Check if user has super admin role via API (bypasses RLS issues)
      const roleCheckResponse = await fetch('/api/auth/verify-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authData.user.id })
      })

      const roleCheckResult = await roleCheckResponse.json()

      if (!roleCheckResponse.ok || !roleCheckResult.hasAccess) {
        // User doesn't have super admin role
        await supabase.auth.signOut()
        setError(roleCheckResult.error || "Access denied. Super admin privileges required.")
        return
      }

      // Switch to super admin role
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin' })
      })

      if (!response.ok) {
        console.error("Failed to switch to super admin role")
        // Continue anyway, they have the role
      }

      // Success callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectTo)
        router.refresh()
      }

    } catch (err: any) {
      console.error("Super admin login error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="border-red-600 bg-red-900/50">
          <AlertDescription className="text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email" className="text-slate-200">Admin Email</Label>
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@organization.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            required
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password" className="text-slate-200">Password</Label>
          <div className="relative">
            <Input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your secure password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-red-600 hover:bg-red-700 text-white" 
          disabled={loading}
        >
          {loading ? "Verifying Access..." : "Access Admin Portal"}
        </Button>
      </form>
    </div>
  )
}
