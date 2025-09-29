"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AuthDebugInfo {
  authUser: any
  userProfile: any
  authError: string | null
  profileError: string | null
}

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const checkAuthStatus = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Check auth user
      const { data: authData, error: authError } = await supabase.auth.getUser()

      let userProfile = null
      let profileError = null

      if (authData.user) {
        const { data: profile, error: pError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        userProfile = profile
        profileError = pError?.message || null
      }

      setDebugInfo({
        authUser: authData.user,
        userProfile,
        authError: authError?.message || null,
        profileError,
      })
    } catch (error: any) {
      console.error("Debug check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  if (!debugInfo) return null

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Auth Debug Info</CardTitle>
        <CardDescription>Current authentication status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium">Auth User:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo.authUser, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium">User Profile:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo.userProfile, null, 2)}
          </pre>
        </div>

        {debugInfo.authError && (
          <div>
            <h4 className="font-medium text-red-600">Auth Error:</h4>
            <p className="text-sm text-red-600">{debugInfo.authError}</p>
          </div>
        )}

        {debugInfo.profileError && (
          <div>
            <h4 className="font-medium text-red-600">Profile Error:</h4>
            <p className="text-sm text-red-600">{debugInfo.profileError}</p>
          </div>
        )}

        <Button onClick={checkAuthStatus} disabled={loading} size="sm">
          {loading ? "Checking..." : "Refresh"}
        </Button>
      </CardContent>
    </Card>
  )
}
