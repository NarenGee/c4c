"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    email: "admin@coachingforcollege.org",
    newPassword: "",
    adminCode: ""
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.newPassword || !formData.adminCode) {
      setResult({ success: false, error: "New password and admin code are required" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Admin Password Reset</h1>

      <Card>
        <CardHeader>
          <CardTitle>Reset Password for admin@coachingforcollege.org</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Fixed)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 8 characters)"
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminCode">Admin Authorization Code</Label>
              <Input
                id="adminCode"
                type="password"
                placeholder="Enter admin code"
                value={formData.adminCode}
                onChange={(e) => handleInputChange("adminCode", e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Use: COACHING4COLLEGE2024!
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <Alert className="border-green-500 bg-green-50">
                <AlertDescription className="text-green-700">
                  ✅ Password reset successfully! You can now login with your new password.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-700">
                  ❌ {result.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Enter a new password (minimum 8 characters)</li>
            <li>Enter the admin authorization code</li>
            <li>Click "Reset Password"</li>
            <li>Try logging in at <a href="/super-admin/login" className="text-blue-600 underline">/super-admin/login</a></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}














