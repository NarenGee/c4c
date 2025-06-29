"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addCollegeToList } from "@/app/actions/college-list"
import { Plus, School } from "lucide-react"

interface AddCollegeFormProps {
  onCollegeAdded?: () => void
}

export function AddCollegeForm({ onCollegeAdded }: AddCollegeFormProps) {
  const [formData, setFormData] = useState({
    college_name: "",
    college_location: "",
    college_type: "",
    tuition_range: "",
    acceptance_rate: "",
    source: "Manually Added",
    notes: "",
    priority: "0",
    application_deadline: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const result = await addCollegeToList({
        college_name: formData.college_name,
        college_location: formData.college_location || undefined,
        college_type: formData.college_type || undefined,
        tuition_range: formData.tuition_range || undefined,
        acceptance_rate: formData.acceptance_rate ? Number.parseFloat(formData.acceptance_rate) : undefined,
        source: formData.source,
        notes: formData.notes || undefined,
        priority: Number.parseInt(formData.priority),
        application_deadline: formData.application_deadline || undefined,
      })

      if (result.success) {
        setMessage({
          type: "success",
          text: `${formData.college_name} has been added to your college list!`,
        })
        setFormData({
          college_name: "",
          college_location: "",
          college_type: "",
          tuition_range: "",
          acceptance_rate: "",
          source: "Manually Added",
          notes: "",
          priority: "0",
          application_deadline: "",
        })
        onCollegeAdded?.()
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to add college to list",
        })
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add College to My List
        </CardTitle>
        <CardDescription>Add a college to your shortlist for tracking and applications</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="college_name">College Name *</Label>
              <Input
                id="college_name"
                value={formData.college_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, college_name: e.target.value }))}
                placeholder="Stanford University"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="college_location">Location</Label>
              <Input
                id="college_location"
                value={formData.college_location}
                onChange={(e) => setFormData((prev) => ({ ...prev, college_location: e.target.value }))}
                placeholder="Stanford, CA"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="college_type">College Type</Label>
              <Select
                value={formData.college_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, college_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Community">Community College</SelectItem>
                  <SelectItem value="Liberal Arts">Liberal Arts</SelectItem>
                  <SelectItem value="Research">Research University</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tuition_range">Tuition Range</Label>
              <Select
                value={formData.tuition_range}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, tuition_range: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under $10,000">Under $10,000</SelectItem>
                  <SelectItem value="$10,000 - $25,000">$10,000 - $25,000</SelectItem>
                  <SelectItem value="$25,000 - $50,000">$25,000 - $50,000</SelectItem>
                  <SelectItem value="$50,000 - $75,000">$50,000 - $75,000</SelectItem>
                  <SelectItem value="Over $75,000">Over $75,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="acceptance_rate">Acceptance Rate (%)</Label>
              <Input
                id="acceptance_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.acceptance_rate}
                onChange={(e) => setFormData((prev) => ({ ...prev, acceptance_rate: e.target.value }))}
                placeholder="15.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Not Set</SelectItem>
                  <SelectItem value="1">High Priority</SelectItem>
                  <SelectItem value="2">Medium Priority</SelectItem>
                  <SelectItem value="3">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="application_deadline">Application Deadline</Label>
              <Input
                id="application_deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData((prev) => ({ ...prev, application_deadline: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, source: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manually Added">Manually Added</SelectItem>
                <SelectItem value="AI Recommended">AI Recommended</SelectItem>
                <SelectItem value="Search Result">Search Result</SelectItem>
                <SelectItem value="Counselor Recommended">Counselor Recommended</SelectItem>
                <SelectItem value="Friend/Family Recommended">Friend/Family Recommended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes about this college..."
              rows={3}
            />
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <School className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding College..." : "Add to My List"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
