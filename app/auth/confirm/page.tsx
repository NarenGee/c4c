"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid confirmation link. Please check your email and try again.")
      return
    }

    confirmEmail(token)
  }, [token])

  const confirmEmail = async (token: string) => {
    try {
      console.log("=== CONFIRMING EMAIL ===")
      console.log("Token:", token)
      
      const response = await fetch("/api/auth/confirm-email-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      console.log("Confirmation API response status:", response.status)
      
      const result = await response.json()
      console.log("Confirmation API response:", result)

      if (!response.ok) {
        setStatus("error")
        setMessage(result.error || "Failed to confirm email. Please try again.")
        return
      }

      setStatus("success")
      setMessage("Your email has been confirmed successfully! You can now sign in to your account.")
    } catch (error: any) {
      console.error("Email confirmation error:", error)
      setStatus("error")
      setMessage("An unexpected error occurred. Please try again.")
    }
  }

  const handleSignIn = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />}
            {status === "success" && <CheckCircle className="h-12 w-12 text-green-600" />}
            {status === "error" && <XCircle className="h-12 w-12 text-red-600" />}
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            {status === "loading" && "Confirming Email..."}
            {status === "success" && "Email Confirmed!"}
            {status === "error" && "Confirmation Failed"}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {status === "loading" && "Please wait while we confirm your email address."}
            {status === "success" && "Your account is now ready to use."}
            {status === "error" && "There was an issue confirming your email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={status === "success" ? "default" : "destructive"}>
              <AlertDescription className={status === "success" ? "text-green-800" : ""}>
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {status === "success" && (
            <Button 
              onClick={handleSignIn} 
              className="w-full h-12 bg-slate-700 hover:bg-slate-800 text-white"
            >
              Sign In to Your Account
            </Button>
          )}
          
          {status === "error" && (
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/signup")} 
                variant="outline"
                className="w-full h-12"
              >
                Try Signing Up Again
              </Button>
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full h-12 bg-slate-700 hover:bg-slate-800 text-white"
              >
                Go to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 