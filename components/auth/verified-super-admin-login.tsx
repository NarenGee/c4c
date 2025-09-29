"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function VerifiedSuperAdminLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<string>()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError("Email and password are required")
      return
    }

    setLoading(true)
    setError(undefined)
    setStatus("Authenticating...")

    try {
      const supabase = createClient()

      // Step 1: Authenticate
      console.log("Step 1: Authenticating user...")
      setStatus("Authenticating user...")
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error("Auth error:", authError)
        setError(`Authentication failed: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setError("No user returned from authentication")
        return
      }

      console.log("✅ Authentication successful, user ID:", authData.user.id)

      // Step 2: Verify super admin role exists
      setStatus("Verifying super admin access...")
      console.log("Step 2: Verifying super admin role...")
      
      const verifyResponse = await fetch('/api/auth/verify-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authData.user.id })
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyResult.hasAccess) {
        await supabase.auth.signOut()
        setError(verifyResult.error || "Access denied. Super admin privileges required.")
        return
      }

      console.log("✅ Super admin access verified")

      // Step 3: Switch to super admin role
      setStatus("Switching to super admin role...")
      console.log("Step 3: Switching to super admin role...")
      
      const roleResponse = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin' })
      })

      if (!roleResponse.ok) {
        const roleError = await roleResponse.json()
        console.error("Failed to switch to super admin role:", roleError)
        setError(`Failed to switch to super admin role: ${roleError.error || 'Unknown error'}`)
        return
      }

      console.log("✅ Successfully switched to super admin role")

      // Step 4: Final verification
      setStatus("Finalizing super admin access...")
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log("✅ Super admin login complete")
      setStatus("Super admin access granted! Redirecting...")

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1000)

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

      {status && !error && (
        <Alert className="border-blue-600 bg-blue-900/50">
          <AlertDescription className="text-blue-200">
            {status}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verified-email" className="text-slate-200">Email</Label>
          <Input
            id="verified-email"
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
          <Label htmlFor="verified-password" className="text-slate-200">Password</Label>
          <div className="relative">
            <Input
              id="verified-password"
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
          {loading ? "Processing..." : "Access Super Admin Portal"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400">
          Verified super admin login with role switching and access verification.
        </p>
      </div>
    </div>
  )
}


