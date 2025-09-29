"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, XCircle, Loader2, Database } from "lucide-react"

export default function TestAuthStatusPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [envVars, setEnvVars] = useState<any>(null)
  const [authTest, setAuthTest] = useState<any>(null)

  useEffect(() => {
    testEnvironment()
  }, [])

  const testEnvironment = async () => {
    try {
      // Test environment variables
      const envResponse = await fetch("/api/test-env")
      const envData = await envResponse.json()
      setEnvVars(envData)

      // Test Supabase client creation
      try {
        const supabase = createClient()
        setAuthTest({ 
          success: true, 
          message: "Supabase client created successfully",
          hasAuth: !!supabase.auth
        })
        setStatus("success")
      } catch (error: any) {
        setAuthTest({ 
          success: false, 
          message: error.message,
          error: error
        })
        setStatus("error")
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message)
    }
  }

  const testSignIn = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "wrongpassword"
      })
      
      // This should fail, but we want to see if the client works
      setAuthTest((prev: any) => ({
        ...prev,
        signInTest: {
          success: true,
          message: "Sign-in test completed (expected to fail with wrong credentials)",
          error: error?.message
        }
      }))
    } catch (error: any) {
      setAuthTest((prev: any) => ({
        ...prev,
        signInTest: {
          success: false,
          message: "Sign-in test failed",
          error: error.message
        }
      }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Authentication Status Test
            </CardTitle>
            <CardDescription>
              Testing Supabase client and authentication functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
              {status === "error" && <XCircle className="h-4 w-4 text-red-600" />}
              <span className="font-medium">
                {status === "loading" && "Testing..."}
                {status === "success" && "Test Completed"}
                {status === "error" && "Test Failed"}
              </span>
            </div>

            {envVars && (
              <Alert className={envVars.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription>
                  <div className="font-medium mb-2">Environment Variables:</div>
                  <div className="text-sm space-y-1">
                    <div>NEXT_PUBLIC_SUPABASE_URL: {envVars.envVars?.NEXT_PUBLIC_SUPABASE_URL}</div>
                    <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY}</div>
                    <div>SUPABASE_SERVICE_ROLE_KEY: {envVars.envVars?.SUPABASE_SERVICE_ROLE_KEY}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {authTest && (
              <Alert className={authTest.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription>
                  <div className="font-medium mb-2">Supabase Client Test:</div>
                  <div className="text-sm">{authTest.message}</div>
                  {authTest.error && (
                    <div className="text-sm text-red-600 mt-1">Error: {authTest.error}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {authTest?.signInTest && (
              <Alert className={authTest.signInTest.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <AlertDescription>
                  <div className="font-medium mb-2">Sign-In Test:</div>
                  <div className="text-sm">{authTest.signInTest.message}</div>
                  {authTest.signInTest.error && (
                    <div className="text-sm text-red-600 mt-1">Error: {authTest.signInTest.error}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={testSignIn} disabled={!authTest?.success}>
              Test Sign-In (with wrong credentials)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 