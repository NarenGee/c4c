"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Send } from "lucide-react"

export function SupabaseEmailTest() {
  const [testEmail, setTestEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleTestInvite = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-supabase-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult("✅ Test invitation sent via Supabase Auth!")
      } else {
        setResult(`❌ Failed to send invitation: ${data.error}`)
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Supabase Email Test
        </CardTitle>
        <CardDescription>Test the Supabase Auth email invitation system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testEmail">Test Email Address</Label>
          <Input
            id="testEmail"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
          />
        </div>

        <Button onClick={handleTestInvite} disabled={loading || !testEmail} className="w-full">
          <Send className="mr-2 h-4 w-4" />
          {loading ? "Sending..." : "Send Test Invitation"}
        </Button>

        {result && (
          <Alert>
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> This uses Supabase Auth's built-in email system.
          </p>
          <p>Make sure your Supabase project has email templates configured.</p>
        </div>
      </CardContent>
    </Card>
  )
}
