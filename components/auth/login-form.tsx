"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { loginUser } from "@/app/actions/auth"

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string }>()

  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(undefined)

    try {
      const result = await loginUser(formData.email, formData.password)

      if (!result.success) {
        setMessage({ type: 'error', text: result.error || "Failed to sign in" })
        return
      }

      // Success - redirect to dashboard with full page reload to ensure clean auth state
      window.location.href = "/dashboard"
    } catch (err: any) {
      console.error("Login error:", err)
      setMessage({ type: 'error', text: err.message || "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          required
          autoComplete="email"
          className="h-12 border-slate-300 text-lg"
          placeholder="Enter your email"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          required
          autoComplete="current-password"
          className="h-12 border-slate-300 text-lg"
          placeholder="Enter your password"
        />
      </div>

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

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium"
      >
        {loading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  )
}
