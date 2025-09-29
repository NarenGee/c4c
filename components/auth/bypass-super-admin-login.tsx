"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function BypassSuperAdminLogin() {
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
    
    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const supabase = createClient()

      // Just do basic authentication - no role checking at all
      console.log("Attempting login with:", formData.email)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      console.log("Auth result:", { authData, authError })

      if (authError) {
        console.error("Auth error details:", authError)
        setError(`Authentication failed: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setError("No user returned from authentication")
        return
      }

      console.log("Login successful, user ID:", authData.user.id)

      // Switch to super admin role before redirecting
      try {
        const roleResponse = await fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'super_admin' })
        })

        if (!roleResponse.ok) {
          const roleError = await roleResponse.json()
          console.error("Failed to switch to super admin role:", roleError)
          
          // If user doesn't have super admin role, show helpful message
          if (roleError.error?.includes('does not have access to role')) {
            setError("This account doesn't have super admin privileges. Please contact an administrator to add super admin role to your account.")
          } else {
            setError(`Failed to switch to super admin role: ${roleError.error || 'Unknown error'}`)
          }
          return
        }

        console.log("Successfully switched to super admin role")
        
        // Small delay to ensure role switch is processed
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (roleError) {
        console.error("Role switch error:", roleError)
        setError("Failed to switch to super admin role")
        return
      }

      // Redirect to dashboard with super admin role active
      router.push("/dashboard")
      router.refresh()

    } catch (err: any) {
      console.error("Login exception:", err)
      setError(`Login error: ${err.message}`)
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
          <Label htmlFor="bypass-email" className="text-slate-200">Email</Label>
          <Input
            id="bypass-email"
            type="email"
            placeholder="your-email@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            required
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bypass-password" className="text-slate-200">Password</Label>
          <div className="relative">
            <Input
              id="bypass-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
          {loading ? "Signing In..." : "Sign In (Bypass Mode)"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400">
          Bypass mode: Pure authentication without role verification.
          Role switching will happen after successful login.
        </p>
      </div>
    </div>
  )
}
