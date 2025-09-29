"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, User, Save, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/auth"

interface CoachProfile {
  organization: string
  updated_at?: string
}

interface CoachProfileProps {
  user: User
}

export function CoachProfile({ user }: CoachProfileProps) {
  const [profile, setProfile] = useState<CoachProfile>({ organization: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("coach_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching coach profile:", error)
        setMessage({ type: "error", text: "Failed to load profile" })
      } else if (data) {
        setProfile({
          organization: data.organization || "",
          updated_at: data.updated_at
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!profile.organization.trim()) {
      setMessage({ type: "error", text: "Organization is required" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("coach_profiles")
        .upsert({
          user_id: user.id,
          organization: profile.organization.trim(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error("Error saving coach profile:", error)
        setMessage({ type: "error", text: "Failed to save profile" })
      } else {
        setMessage({ type: "success", text: "Profile saved successfully!" })
      }
    } catch (error) {
      console.error("Error:", error)
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-800">Coach Profile</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Manage your coaching profile information and organization details.
        </p>
      </div>

      {message && (
        <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 max-w-2xl mx-auto">
        {/* Basic Information */}
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={user.full_name}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500">
                  Contact support to change your name
                </p>
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
          </CardContent>
        </Card>

        {/* Organization Information */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-slate-100 border-b">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Building2 className="h-5 w-5" />
              Organization Details
            </CardTitle>
            <CardDescription>
              Information about your school or organization
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization">School/Organization *</Label>
              <Input
                id="organization"
                placeholder="e.g., Springfield High School"
                value={profile.organization}
                onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                The name of the school or organization you work for
              </p>
            </div>

            {profile.updated_at && (
              <p className="text-xs text-slate-500">
                Last updated: {new Date(profile.updated_at).toLocaleDateString()}
              </p>
            )}

            <Button 
              onClick={saveProfile} 
              disabled={saving || !profile.organization.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="bg-slate-100 border-b">
            <CardTitle className="text-slate-800">Account Status</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Coach</div>
                <div className="text-sm text-slate-600">Account Type</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-slate-600">Member Since</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
