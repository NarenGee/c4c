"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CheckAdminPage() {
  const [user, setUser] = useState<any>(null)
  const [userRoles, setUserRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    checkUserAndRoles()
  }, [])

  const checkUserAndRoles = async () => {
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setError(`Auth error: ${userError.message}`)
        return
      }

      setUser(user)

      if (user) {
        // Get user roles
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)

        if (rolesError) {
          setError(`Roles error: ${rolesError.message}`)
        } else {
          setUserRoles(roles || [])
        }

        // Also get user profile
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          setError(`Profile error: ${profileError.message}`)
        }
      }
    } catch (err: any) {
      setError(`Exception: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSuperAdminApi = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/auth/verify-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const result = await response.json()
      alert(`API Result: ${JSON.stringify(result, null, 2)}`)
    } catch (err: any) {
      alert(`API Error: ${err.message}`)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Admin Access Debug</h1>

      {error && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Created:</strong> {user.created_at}</p>
              <Button onClick={testSuperAdminApi} className="mt-4">
                Test Super Admin API
              </Button>
            </div>
          ) : (
            <p>Not signed in</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Roles ({userRoles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {userRoles.length > 0 ? (
            <div className="space-y-2">
              {userRoles.map((role, index) => (
                <div key={index} className="p-2 border rounded">
                  <p><strong>Role:</strong> {role.role}</p>
                  <p><strong>Active:</strong> {role.is_active ? 'Yes' : 'No'}</p>
                  <p><strong>Primary:</strong> {role.is_primary ? 'Yes' : 'No'}</p>
                  <p><strong>Organization:</strong> {role.organization || 'None'}</p>
                  <p><strong>Created:</strong> {role.created_at}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No roles found</p>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}














