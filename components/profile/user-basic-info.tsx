"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Save, Loader2 } from "lucide-react"
import type { User as AuthUser } from "@/lib/auth"

interface UserBasicInfoProps {
  user: AuthUser
}

export function UserBasicInfo({ user }: UserBasicInfoProps) {
  const [fullName, setFullName] = useState(user.full_name)
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const saveName = async () => {
    if (!fullName.trim()) {
      setNameMessage({ type: "error", text: "Name is required" })
      return
    }

    setSavingName(true)
    setNameMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ full_name: fullName.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setNameMessage({ type: "error", text: data.error || "Failed to update name" })
      } else {
        setNameMessage({ type: "success", text: "Name updated successfully! Refreshing page..." })
        // Refresh the page to update the user name everywhere
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (error) {
      console.error("Error:", error)
      setNameMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setSavingName(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-white">
      <CardHeader className="bg-slate-100 border-b">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <User className="h-5 w-5" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Your account and contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {nameMessage && (
          <Alert className={nameMessage.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertDescription className={nameMessage.type === "error" ? "text-red-800" : "text-green-800"}>
              {nameMessage.text}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">
              Contact support to change your email
            </p>
          </div>
        </div>

        <Button 
          onClick={saveName} 
          disabled={savingName || !fullName.trim() || fullName === user.full_name}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {savingName ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Name
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

