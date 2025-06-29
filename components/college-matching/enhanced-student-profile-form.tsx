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
import { Progress } from "@/components/ui/progress"
import { generateCollegeRecommendations, type StudentProfile } from "@/app/actions/college-matching"
import { Brain, GraduationCap, Loader2 } from "lucide-react"

interface EnhancedStudentProfileFormProps {
  onRecommendationsGenerated?: () => void
}

const ACADEMIC_QUALIFICATIONS = [
  { value: "IB", label: "International Baccalaureate (IB)" },
  { value: "A-Levels", label: "A-Levels (UK)" },
  { value: "SAT", label: "SAT (US)" },
  { value: "ACT", label: "ACT (US)" },
  { value: "AP", label: "Advanced Placement (AP)" },
  { value: "CBSE", label: "CBSE (India)" },
  { value: "ICSE", label: "ICSE (India)" },
  { value: "HSC", label: "Higher Secondary Certificate" },
  { value: "Abitur", label: "Abitur (Germany)" },
  { value: "Baccalauréat", label: "Baccalauréat (France)" },
  { value: "Other", label: "Other" },
]

const POPULAR_MAJORS = [
  "Computer Science",
  "Engineering",
  "Business Administration",
  "Medicine",
  "Economics",
  "Psychology",
  "Biology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Political Science",
  "International Relations",
  "English Literature",
  "History",
  "Philosophy",
  "Art and Design",
  "Architecture",
  "Law",
  "Environmental Science",
  "Data Science",
  "Artificial Intelligence",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Biomedical Engineering",
  "Finance",
  "Marketing",
  "Accounting",
  "Journalism",
  "Communications",
]

const COMMON_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Economics",
  "Business Studies",
  "Computer Science",
  "Psychology",
  "Sociology",
  "Philosophy",
  "Art",
  "Music",
  "French",
  "Spanish",
  "German",
  "Chinese",
  "Japanese",
  "Literature",
  "Political Science",
  "Environmental Science",
  "Statistics",
]

const EXTRACURRICULAR_OPTIONS = [
  "Student Government",
  "Debate Team",
  "Model UN",
  "Robotics Club",
  "Science Olympiad",
  "Math Olympiad",
  "Drama/Theater",
  "Music Band/Orchestra",
  "Choir",
  "Sports Teams",
  "Volunteer Work",
  "Community Service",
  "Tutoring/Teaching",
  "Research Projects",
  "Internships",
  "Part-time Work",
  "Art Club",
  "Photography",
  "Coding Club",
  "Environmental Club",
  "Cultural Clubs",
  "Language Clubs",
  "Chess Club",
  "Academic Competitions",
]

export function EnhancedStudentProfileForm({ onRecommendationsGenerated }: EnhancedStudentProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
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

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

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

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleArraySelect = (field: keyof StudentProfile, value: string, checked: boolean) => {
    setFormData((prev) => {
      const currentArray = (prev[field] as string[]) || []
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] }
      } else {
        return { ...prev, [field]: currentArray.filter((item) => item !== value) }
      }
    })
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Academic Background</h3>
        <p className="text-sm text-muted-foreground">Tell us about your academic qualifications and scores</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="test_type">Academic Qualification *</Label>
          <Select
            value={formData.test_type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, test_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your qualification" />
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_QUALIFICATIONS.map((qual) => (
                <SelectItem key={qual.value} value={qual.value}>
                  {qual.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_score">Overall Score/Grade</Label>
          <Input
            id="total_score"
            value={formData.total_score || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, total_score: e.target.value }))}
            placeholder="e.g., 38/45, 3A*1A, 1450"
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
            onChange={(e) => setFormData((prev) => ({ ...prev, gpa: Number.parseFloat(e.target.value) || undefined }))}
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
          <Label>Advanced/Higher Level Subjects</Label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
            {COMMON_SUBJECTS.map((subject) => (
              <div key={subject} className="flex items-center space-x-2">
                <Checkbox
                  id={`hl-${subject}`}
                  checked={formData.hl_subjects?.includes(subject) || false}
                  onCheckedChange={(checked) => handleArraySelect("hl_subjects", subject, !!checked)}
                />
                <Label htmlFor={`hl-${subject}`} className="text-sm">
                  {subject}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Standard Level Subjects</Label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
            {COMMON_SUBJECTS.map((subject) => (
              <div key={subject} className="flex items-center space-x-2">
                <Checkbox
                  id={`sl-${subject}`}
                  checked={formData.sl_subjects?.includes(subject) || false}
                  onCheckedChange={(checked) => handleArraySelect("sl_subjects", subject, !!checked)}
                />
                <Label htmlFor={`sl-${subject}`} className="text-sm">
                  {subject}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Academic Interests & Goals</h3>
        <p className="text-sm text-muted-foreground">What do you want to study and achieve?</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intended_major">Intended Major *</Label>
        <Select
          value={formData.intended_major}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, intended_major: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your intended major" />
          </SelectTrigger>
          <SelectContent>
            {POPULAR_MAJORS.map((major) => (
              <SelectItem key={major} value={major}>
                {major}
              </SelectItem>
            ))}
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="career_goals">Career Goals</Label>
        <Input
          id="career_goals"
          value={formData.career_goals || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, career_goals: e.target.value }))}
          placeholder="Software engineer, researcher, entrepreneur, doctor"
        />
      </div>

      <div className="space-y-2">
        <Label>Academic Interests</Label>
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-2">
          {POPULAR_MAJORS.slice(0, 15).map((interest) => (
            <div key={interest} className="flex items-center space-x-2">
              <Checkbox
                id={`interest-${interest}`}
                checked={formData.interests?.includes(interest) || false}
                onCheckedChange={(checked) => handleArraySelect("interests", interest, !!checked)}
              />
              <Label htmlFor={`interest-${interest}`} className="text-sm">
                {interest}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
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
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">College Preferences</h3>
        <p className="text-sm text-muted-foreground">Tell us about your ideal college environment</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
              <SelectItem value="Urban">Urban - City environment</SelectItem>
              <SelectItem value="Suburban">Suburban - Town environment</SelectItem>
              <SelectItem value="Rural">Rural - Countryside environment</SelectItem>
              <SelectItem value="No Preference">No Preference</SelectItem>
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
              <SelectItem value="Small (Under 20)">Small (Under 20 students)</SelectItem>
              <SelectItem value="Medium (20-50)">Medium (20-50 students)</SelectItem>
              <SelectItem value="Large (50+)">Large (50+ students)</SelectItem>
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
            placeholder="USA, UK, Canada, Europe, Asia"
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
              <SelectItem value="Under $20,000">Under $20,000 per year</SelectItem>
              <SelectItem value="$20,000 - $40,000">$20,000 - $40,000 per year</SelectItem>
              <SelectItem value="$40,000 - $60,000">$40,000 - $60,000 per year</SelectItem>
              <SelectItem value="$60,000 - $80,000">$60,000 - $80,000 per year</SelectItem>
              <SelectItem value="Over $80,000">Over $80,000 per year</SelectItem>
              <SelectItem value="No Constraint">No Budget Constraint</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="financial_aid_needed"
            checked={formData.financial_aid_needed}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, financial_aid_needed: !!checked }))}
          />
          <Label htmlFor="financial_aid_needed">I need financial aid/scholarships</Label>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Background & Experience</h3>
        <p className="text-sm text-muted-foreground">Tell us about your activities and experiences</p>
      </div>

      <div className="space-y-2">
        <Label>Extracurricular Activities</Label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
          {EXTRACURRICULAR_OPTIONS.map((activity) => (
            <div key={activity} className="flex items-center space-x-2">
              <Checkbox
                id={`activity-${activity}`}
                checked={formData.extracurriculars?.includes(activity) || false}
                onCheckedChange={(checked) => handleArraySelect("extracurriculars", activity, !!checked)}
              />
              <Label htmlFor={`activity-${activity}`} className="text-sm">
                {activity}
              </Label>
            </div>
          ))}
        </div>
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

      <div className="space-y-2">
        <Label htmlFor="languages">Languages Spoken</Label>
        <Input
          id="languages"
          value={formData.languages?.join(", ") || ""}
          onChange={(e) => {
            const langs = e.target.value
              .split(",")
              .map((lang) => lang.trim())
              .filter(Boolean)
            setFormData((prev) => ({ ...prev, languages: langs }))
          }}
          placeholder="English, Hindi, Spanish, French"
        />
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
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Student Profile for College Recommendations
        </CardTitle>
        <CardDescription>
          Complete your profile to get personalized college recommendations powered by AI
        </CardDescription>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Step {currentStep} of {totalSteps}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <GraduationCap className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Get College Recommendations
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
