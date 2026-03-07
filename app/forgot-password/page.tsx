"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { requestPasswordReset } from "@/app/actions/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(undefined)
    try {
      const result = await requestPasswordReset(email)
      if (result.success) {
        setMessage({
          type: "success",
          text: "If an account exists for that email, we've sent a link to reset your password. Check your inbox and spam folder.",
        })
        setEmail("")
      } else {
        setMessage({ type: "error", text: result.error || "Something went wrong. Please try again." })
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "An unexpected error occurred." })
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
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Forgot password?</h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <Card className="bg-white shadow-lg border-slate-200">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-12 border-slate-300 text-lg"
                    placeholder="Enter your email"
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
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-4 sm:mt-6 space-y-2">
            <p className="text-slate-600 text-sm sm:text-base">
              Remember your password?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
