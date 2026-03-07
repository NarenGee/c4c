"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientForAuthUrl } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClientForAuthUrl()

    const init = async () => {
      // Parse hash fragment from the URL (e.g. #access_token=...&refresh_token=...&type=recovery)
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : ""
      const params = new URLSearchParams(hash)
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")
      const type = params.get("type")

      if (accessToken && refreshToken && type === "recovery") {
        // Explicitly set the session from the hash tokens — most reliable approach
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error && data.session?.user) {
          setHasSession(true)
          setReady(true)
          return
        }
      }

      // Fallback: check if there is already an active session (e.g. page refresh)
      const { data: { session } } = await supabase.auth.getSession()
      setHasSession(!!session?.user)
      setReady(true)
    }

    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." })
      return
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." })
      return
    }
    setLoading(true)
    setMessage(undefined)
    try {
      const supabase = createClientForAuthUrl()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage({ type: "error", text: error.message })
        return
      }
      setMessage({
        type: "success",
        text: "Your password has been updated. Redirecting to sign in...",
      })
      setTimeout(() => {
        router.push("/login")
        router.refresh()
      }, 1500)
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "An unexpected error occurred.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8]">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Coaching for College Logo"
                  width={240}
                  height={55}
                  className="w-32 sm:w-48 md:w-60"
                  style={{ height: "auto" }}
                />
              </Link>
              <div className="bg-slate-700 text-white px-2 py-1 sm:px-3 rounded-full text-xs font-medium">
                Alpha v1.0
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" className="border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                <Button className="bg-slate-700 hover:bg-slate-800 text-white">
                  About Coaching for College
                </Button>
              </Link>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col gap-3 pt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white">
                    About Coaching for College
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4 sm:p-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Set new password</h2>
            <p className="text-slate-600 text-sm sm:text-base">
              {hasSession
                ? "Enter your new password below."
                : "Use the link from your email to set a new password."}
            </p>
          </div>

          <Card className="bg-white shadow-lg border-slate-200">
            <CardContent className="p-6 sm:p-8">
              {!ready ? (
                <p className="text-slate-600 text-center py-4">Loading...</p>
              ) : !hasSession ? (
                <div className="space-y-4">
                  <Alert className="border-slate-200 bg-slate-50">
                    <AlertDescription className="text-slate-700">
                      This page is for setting a new password after clicking the link we sent to your email.
                      If you didn&apos;t receive it, request a new link below.
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-col gap-3">
                    <Link href="/forgot-password" className="w-full">
                      <Button variant="outline" className="w-full border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white">
                        Request reset link
                      </Button>
                    </Link>
                    <Link href="/login" className="w-full">
                      <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white">
                        Back to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-slate-700 font-medium">
                      New password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="h-12 border-slate-300 text-lg"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                      Confirm password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="h-12 border-slate-300 text-lg"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  {message && (
                    <Alert
                      variant={message.type === "error" ? "destructive" : "default"}
                      className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200"}
                    >
                      <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>
                        {message.text}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium"
                  >
                    {loading ? "Updating..." : "Update password"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center mt-4 sm:mt-6 space-y-2">
            <p className="text-slate-600 text-sm sm:text-base">
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
