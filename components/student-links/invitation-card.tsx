"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  Users, 
  Mail, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle
} from "lucide-react"
import { getStudentLinks, cancelInvitation, type StudentLink } from "@/app/actions/student-links"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function InvitationCard() {
  const [email, setEmail] = useState("")
  const [relationship, setRelationship] = useState<"parent" | "other">("parent")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [links, setLinks] = useState<StudentLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)

  const loadLinks = async () => {
    setLoadingLinks(true)
    try {
      const result = await getStudentLinks()
      if (result.success && result.links) {
        setLinks(result.links)
      }
    } catch (error) {
      console.error("Failed to load links:", error)
    } finally {
      setLoadingLinks(false)
    }
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const handleInvite = async () => {
    if (!email || !relationship) {
      setMessage({ type: "error", text: "Please fill in all fields" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // Use API route instead of server action for proper email sending
      const response = await fetch('/api/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          relationship,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage({ 
          type: "success", 
          text: result.emailSent 
            ? `Invitation sent successfully to ${email}!` 
            : result.message || "Invitation created! Email will be sent shortly."
        })
        setEmail("")
        await loadLinks() // Refresh the links list
      } else {
        setMessage({ type: "error", text: result.error || "Failed to send invitation" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const result = await cancelInvitation(invitationId)
      if (result.success) {
        setMessage({ type: "success", text: "Invitation cancelled successfully" })
        await loadLinks()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to cancel invitation" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An unexpected error occurred" })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRelationshipDisplay = (relationship: string) => {
    switch (relationship) {
      case 'parent':
        return 'Parent/Guardian'
      case 'other':
        return 'Family Member'
      default:
        return relationship
    }
  }

  const connectedCount = links.filter(link => link.status === 'accepted').length
  const pendingCount = links.filter(link => link.status === 'pending').length

  return (
    <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
          <div className="p-2 bg-white/20 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          Share Your Progress
        </CardTitle>
        <CardDescription className="text-slate-100 text-base">
          Invite parents/guardians or family members to follow your college search journey with read-only access
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        {/* Status Overview */}
        <div className="flex gap-4">
          <Badge className={`px-3 py-1 ${getStatusColor('accepted')}`}>
            {connectedCount} Connected
          </Badge>
          {pendingCount > 0 && (
            <Badge className={`px-3 py-1 ${getStatusColor('pending')}`}>
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        {message && (
          <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Invitation Form */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send New Invitation
          </h3>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={relationship} onValueChange={(value: "parent" | "other") => setRelationship(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent/Guardian</SelectItem>
                  <SelectItem value="other">Other Family Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleInvite} 
              disabled={loading || !email}
              className="w-full bg-slate-800 hover:bg-slate-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Current Connections */}
        {links.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Connections
              </h3>
              
              <div className="space-y-3">
                {loadingLinks ? (
                  <div className="text-center py-4 text-slate-600">Loading connections...</div>
                ) : (
                  links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(link.status)}
                        <div>
                          <p className="font-medium text-slate-800">{link.invited_email}</p>
                          <p className="text-sm text-slate-600 capitalize">
                            {getRelationshipDisplay(link.relationship)} • {link.status}
                            {link.status === 'accepted' && link.linked_at && (
                              <span className="ml-1">
                                • Connected {new Date(link.linked_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`px-2 py-1 text-xs ${getStatusColor(link.status)}`}>
                          {link.status}
                        </Badge>
                        {link.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvitation(link.invitation_token)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* What's Shared Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">What's Shared?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your academic profile and test scores</li>
            <li>• College recommendations and matches</li>
            <li>• Your college shortlist and applications</li>
            <li>• Application deadlines and progress</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            All shared data is read-only. Connected users cannot make changes to your profile.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 