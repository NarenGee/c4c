"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UserLookupPage() {
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const lookupUser = async () => {
    if (!email) return

    setLoading(true)
    try {
      const response = await fetch('/api/debug/user-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkAuthUser = async () => {
    if (!email) return

    setLoading(true)
    try {
      const response = await fetch('/api/debug/check-auth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testRoleSwitch = async () => {
    if (!email) return

    // First need to get the user ID
    setLoading(true)
    try {
      // Get user info first
      const userResponse = await fetch('/api/debug/check-auth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const userData = await userResponse.json()
      
      // Try different user ID sources
      let userId = userData.auth_user?.id || userData.user_profile?.id
      
      if (!userId) {
        setResult({ 
          error: "Could not find user ID for role switch test", 
          debug_data: userData,
          available_ids: {
            auth_user_id: userData.auth_user?.id || "not found",
            user_profile_id: userData.user_profile?.id || "not found"
          }
        })
        return
      }

      // Test role switch
      const switchResponse = await fetch('/api/debug/role-switch-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const switchData = await switchResponse.json()
      setResult({
        ...switchData,
        original_lookup: userData
      })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testCoachStudents = async () => {
    if (!email) return

    setLoading(true)
    try {
      const response = await fetch('/api/debug/coach-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    if (!email) return

    try {
      // Test basic auth
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const password = prompt("Enter password to test login:")
      if (!password) return

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        alert(`Login failed: ${error.message}`)
      } else {
        alert(`Login successful! User ID: ${data.user?.id}`)
        // Sign out immediately
        await supabase.auth.signOut()
      }
    } catch (error: any) {
      alert(`Login test error: ${error.message}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">User Information Lookup</h1>

      <Card>
        <CardHeader>
          <CardTitle>Lookup User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={lookupUser} disabled={loading || !email}>
              {loading ? "Looking up..." : "Lookup User Info"}
            </Button>
            <Button onClick={testLogin} disabled={!email} variant="outline">
              Test Login
            </Button>
            <Button onClick={checkAuthUser} disabled={loading || !email} variant="secondary">
              Check Auth Status
            </Button>
            <Button onClick={testRoleSwitch} disabled={loading || !email} variant="destructive">
              Test Role Switch
            </Button>
            <Button onClick={testCoachStudents} disabled={loading || !email} variant="outline">
              Test Coach Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {result && (
            <div className="space-y-2">
              <p><strong>User Found in DB:</strong> {result.user_profile ? 'Yes' : 'No'}</p>
              <p><strong>User Exists in Auth:</strong> {result.exists_in_auth ? 'Yes' : 'No'}</p>
              
              {result.diagnosis && (
                <>
                  <p><strong>Can Login:</strong> {result.diagnosis.can_login ? 'Yes' : 'No'}</p>
                  <p><strong>Needs Email Confirmation:</strong> {result.diagnosis.needs_confirmation ? 'Yes' : 'No'}</p>
                  <p><strong>Missing from Auth:</strong> {result.diagnosis.missing_from_auth ? 'Yes' : 'No'}</p>
                  <p><strong>Missing from Profile:</strong> {result.diagnosis.missing_from_profile ? 'Yes' : 'No'}</p>
                </>
              )}
              
              {result.user_profile && (
                <>
                  <p><strong>Original Role:</strong> {result.user_profile.role}</p>
                  <p><strong>Current Role:</strong> {result.user_profile.current_role}</p>
                  <p><strong>Total Roles:</strong> {result.user_roles?.length || 0}</p>
                  <p><strong>Has Super Admin:</strong> {result.user_roles?.some((r: any) => r.role === 'super_admin') ? 'Yes' : 'No'}</p>
                </>
              )}
              
              {result.auth_user && (
                <>
                  <p><strong>Email Confirmed:</strong> {result.auth_user.email_confirmed_at ? 'Yes' : 'No'}</p>
                  <p><strong>Last Sign In:</strong> {result.auth_user.last_sign_in_at || 'Never'}</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
