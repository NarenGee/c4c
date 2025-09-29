"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForceRoleSwitchPage() {
  const [formData, setFormData] = useState({
    email: "admin@coachingforcollege.org",
    adminCode: ""
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.adminCode) {
      setResult({ success: false, error: "Admin code is required" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/force-role-switch', {
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
      <h1 className="text-3xl font-bold">Force Role Switch to Super Admin</h1>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Role Switch</CardTitle>
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
              {loading ? "Switching Role..." : "Force Switch to Super Admin"}
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
                  ✅ Role switched successfully! Your current_role is now super_admin.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-500 bg-red-50">
                <AlertDescription className="text-red-700">
                  ❌ {result.error}
                </AlertDescription>
              </Alert>
            )}
            
            <pre className="bg-slate-100 p-4 rounded overflow-auto text-sm mt-4">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Enter the admin authorization code: <strong>COACHING4COLLEGE2024!</strong></li>
            <li>Click "Force Switch to Super Admin"</li>
            <li>This will directly update your current_role in the database</li>
            <li>Try logging in again at <a href="/super-admin/login" className="text-blue-600 underline">/super-admin/login</a></li>
            <li>Or go directly to <a href="/dashboard" className="text-blue-600 underline">/dashboard</a></li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Why this is needed:</strong> The regular role switch function isn't working properly. 
              This tool bypasses all the complex logic and directly sets your current_role to super_admin in the database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
