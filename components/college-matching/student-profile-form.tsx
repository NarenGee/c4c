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
import { Checkbox } from "@/components/ui/checkbox"
import { generateCollegeRecommendations, type StudentProfile } from "@/app/actions/college-matching"
import { Brain, GraduationCap, Loader2 } from "lucide-react"

interface StudentProfileFormProps {
  onRecommendationsGenerated?: () => void
}

export function StudentProfileForm({ onRecommendationsGenerated }: StudentProfileFormProps) {
  const [formData, setFormData] = useState<StudentProfile>({
    test_type: "",
    intended_major: "",
    campus_type: "",
    financial_aid_needed: false,
    research_interest: false,
    extracurriculars: [],
    interests: [],
    languages: [],
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const result = await generateCollegeRecommendations(formData)

      if (result.success) {
        setMessage({
          type: "success",
          text: `Generated ${result.matches?.length || 0} college recommendations! Check the results below.`,
        })
        onRecommendationsGenerated?.()
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to generate recommendations",
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

  const handleArrayInput = (field: keyof StudentProfile, value: string) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    setFormData((prev) => ({ ...prev, [field]: items }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Student Profile for AI Matching
        </CardTitle>
        <CardDescription>
          Provide your academic background and preferences to get personalized college recommendations powered by Gemini
          AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Academic Information</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="test_type">Test Type</Label>
                <Select
                  value={formData.test_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, test_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IB">International Baccalaureate (IB)</SelectItem>
                    <SelectItem value="A-Levels">A-Levels</SelectItem>
                    <SelectItem value="SAT">SAT</SelectItem>
                    <SelectItem value="ACT">ACT</SelectItem>
                    <SelectItem value="AP">Advanced Placement (AP)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_score">Total Score/Grade</Label>
                <Input
                  id="total_score"
                  value={formData.total_score || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, total_score: e.target.value }))}
                  placeholder="e.g., 38/45 (IB), 3A*1A (A-Levels)"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (if applicable)</Label>
                <Input
                  id="gpa"
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  value={formData.gpa || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, gpa: Number.parseFloat(e.target.value) || undefined }))
                  }
                  placeholder="3.85"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sat_score">SAT Score</Label>
                <Input
                  id="sat_score"
                  type="number"
                  min="400"
                  max="1600"
                  value={formData.sat_score || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sat_score: Number.parseInt(e.target.value) || undefined }))
                  }
                  placeholder="1450"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="act_score">ACT Score</Label>
                <Input
                  id="act_score"
                  type="number"
                  min="1"
                  max="36"
                  value={formData.act_score || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, act_score: Number.parseInt(e.target.value) || undefined }))
                  }
                  placeholder="32"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hl_subjects">HL/Advanced Subjects</Label>
                <Input
                  id="hl_subjects"
                  value={formData.hl_subjects?.join(", ") || ""}
                  onChange={(e) => handleArrayInput("hl_subjects", e.target.value)}
                  placeholder="Math, Physics, Economics"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sl_subjects">SL/Standard Subjects</Label>
                <Input
                  id="sl_subjects"
                  value={formData.sl_subjects?.join(", ") || ""}
                  onChange={(e) => handleArrayInput("sl_subjects", e.target.value)}
                  placeholder="English, History, Chemistry"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preferences & Goals</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="intended_major">Intended Major</Label>
                <Input
                  id="intended_major"
                  value={formData.intended_major || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, intended_major: e.target.value }))}
                  placeholder="Computer Science"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campus_type">Campus Type</Label>
                <Select
                  value={formData.campus_type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, campus_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urban">Urban</SelectItem>
                    <SelectItem value="Suburban">Suburban</SelectItem>
                    <SelectItem value="Rural">Rural</SelectItem>
                    <SelectItem value="No Preference">No Preference</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location_preference">Location Preference</Label>
                <Input
                  id="location_preference"
                  value={formData.location_preference || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location_preference: e.target.value }))}
                  placeholder="USA, UK, Canada, or specific regions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance_from_home">Distance from Home</Label>
                <Input
                  id="distance_from_home"
                  value={formData.distance_from_home || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, distance_from_home: e.target.value }))}
                  placeholder="Within 1500km from New Delhi"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="budget_range">Budget Range</Label>
                <Select
                  value={formData.budget_range}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, budget_range: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under $20,000">Under $20,000</SelectItem>
                    <SelectItem value="$20,000 - $40,000">$20,000 - $40,000</SelectItem>
                    <SelectItem value="$40,000 - $60,000">$40,000 - $60,000</SelectItem>
                    <SelectItem value="$60,000 - $80,000">$60,000 - $80,000</SelectItem>
                    <SelectItem value="Over $80,000">Over $80,000</SelectItem>
                    <SelectItem value="No Constraint">No Constraint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_class_size">Preferred Class Size</Label>
                <Select
                  value={formData.preferred_class_size}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, preferred_class_size: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small (Under 20)">Small (Under 20)</SelectItem>
                    <SelectItem value="Medium (20-50)">Medium (20-50)</SelectItem>
                    <SelectItem value="Large (50+)">Large (50+)</SelectItem>
                    <SelectItem value="No Preference">No Preference</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financial_aid_needed"
                  checked={formData.financial_aid_needed}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, financial_aid_needed: !!checked }))}
                />
                <Label htmlFor="financial_aid_needed">Financial aid needed</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="research_interest"
                  checked={formData.research_interest}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, research_interest: !!checked }))}
                />
                <Label htmlFor="research_interest">Interested in research opportunities</Label>
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Background & Experience</h3>

            <div className="space-y-2">
              <Label htmlFor="extracurriculars">Extracurricular Activities</Label>
              <Input
                id="extracurriculars"
                value={formData.extracurriculars?.join(", ") || ""}
                onChange={(e) => handleArrayInput("extracurriculars", e.target.value)}
                placeholder="Robotics club, debate team, volunteer teaching"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Academic Interests</Label>
              <Input
                id="interests"
                value={formData.interests?.join(", ") || ""}
                onChange={(e) => handleArrayInput("interests", e.target.value)}
                placeholder="Machine learning, sustainable energy, international relations"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="work_experience">Work Experience</Label>
                <Textarea
                  id="work_experience"
                  value={formData.work_experience || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, work_experience: e.target.value }))}
                  placeholder="Internships, part-time jobs, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volunteer_work">Volunteer Work</Label>
                <Textarea
                  id="volunteer_work"
                  value={formData.volunteer_work || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, volunteer_work: e.target.value }))}
                  placeholder="Community service, NGO work, etc."
                  rows={3}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="languages">Languages</Label>
                <Input
                  id="languages"
                  value={formData.languages?.join(", ") || ""}
                  onChange={(e) => handleArrayInput("languages", e.target.value)}
                  placeholder="English, Hindi, Spanish"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="career_goals">Career Goals</Label>
                <Input
                  id="career_goals"
                  value={formData.career_goals || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, career_goals: e.target.value }))}
                  placeholder="Software engineer, researcher, entrepreneur"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_circumstances">Special Circumstances</Label>
              <Textarea
                id="special_circumstances"
                value={formData.special_circumstances || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, special_circumstances: e.target.value }))}
                placeholder="Any unique circumstances, challenges, or achievements"
                rows={3}
              />
            </div>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <GraduationCap className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating AI Recommendations...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate College Recommendations
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
