"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { generateCollegeRecommendations, type StudentProfile } from "@/app/actions/college-matching"
import { Brain, GraduationCap, Loader2, HelpCircle, Plus, X, Info } from "lucide-react"
import type { JSX } from "react/jsx-runtime"

interface EnhancedStudentProfileFormProps {
  onRecommendationsGenerated?: () => void
}

interface ALevelSubject {
  subject: string
  grade: string
}

interface IBSubject {
  subject: string
  level: "HL" | "SL"
  grade: string
}

interface ExtracurricularActivity {
  activity: string
  tier: string
}

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "East Timor",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
]

const INTENDED_MAJORS = {
  "🤔 I'm not sure - Help me explore!": "🤔 I'm not sure - Help me explore!",
  Undecided: "Undecided",
  STEM: {
    "Computer Science": "Computer Science",
    "Computer Engineering": "Computer Engineering",
    "Software Engineering": "Software Engineering",
    "Data Science": "Data Science",
    "Information Technology": "Information Technology",
    "Mechanical Engineering": "Mechanical Engineering",
    "Electrical Engineering": "Electrical Engineering",
    "Civil Engineering": "Civil Engineering",
    "Chemical Engineering": "Chemical Engineering",
    "Biomedical Engineering": "Biomedical Engineering",
    "Aerospace Engineering": "Aerospace Engineering",
    "Industrial Engineering": "Industrial Engineering",
    "Environmental Engineering": "Environmental Engineering",
    Mathematics: "Mathematics",
    "Applied Mathematics": "Applied Mathematics",
    Statistics: "Statistics",
    Physics: "Physics",
    Chemistry: "Chemistry",
    "Biology/Life Sciences": "Biology/Life Sciences",
    Biochemistry: "Biochemistry",
    Biotechnology: "Biotechnology",
    Neuroscience: "Neuroscience",
    "Environmental Science": "Environmental Science",
    Geology: "Geology",
    "Astronomy/Astrophysics": "Astronomy/Astrophysics",
  },
  "Business & Economics": {
    "Business Administration": "Business Administration",
    Finance: "Finance",
    Accounting: "Accounting",
    Marketing: "Marketing",
    "International Business": "International Business",
    Entrepreneurship: "Entrepreneurship",
    Economics: "Economics",
    Management: "Management",
    "Supply Chain Management": "Supply Chain Management",
    "Human Resources": "Human Resources",
  },
  "Liberal Arts & Humanities": {
    "English/Literature": "English/Literature",
    "Creative Writing": "Creative Writing",
    History: "History",
    Philosophy: "Philosophy",
    "Religious Studies": "Religious Studies",
    Classics: "Classics",
    Linguistics: "Linguistics",
    "Foreign Languages": "Foreign Languages",
    "Comparative Literature": "Comparative Literature",
    "Art History": "Art History",
    Music: "Music",
    "Theatre Arts": "Theatre Arts",
    "Film Studies": "Film Studies",
  },
  "Social Sciences": {
    Psychology: "Psychology",
    Sociology: "Sociology",
    Anthropology: "Anthropology",
    "Political Science": "Political Science",
    "International Relations": "International Relations",
    "Criminal Justice": "Criminal Justice",
    "Social Work": "Social Work",
    Geography: "Geography",
    "Urban Planning": "Urban Planning",
  },
  "Health & Medicine": {
    "Pre-Medicine": "Pre-Medicine",
    Nursing: "Nursing",
    "Public Health": "Public Health",
    "Health Administration": "Health Administration",
    "Physical Therapy": "Physical Therapy",
    "Occupational Therapy": "Occupational Therapy",
    Pharmacy: "Pharmacy",
    Dentistry: "Dentistry",
    "Veterinary Science": "Veterinary Science",
    Nutrition: "Nutrition",
  },
  "Arts & Design": {
    "Fine Arts": "Fine Arts",
    "Graphic Design": "Graphic Design",
    "Industrial Design": "Industrial Design",
    Architecture: "Architecture",
    "Interior Design": "Interior Design",
    "Fashion Design": "Fashion Design",
    Photography: "Photography",
    "Digital Media Arts": "Digital Media Arts",
  },
  "Communication & Media": {
    Communications: "Communications",
    Journalism: "Journalism",
    "Public Relations": "Public Relations",
    Broadcasting: "Broadcasting",
    "Digital Media": "Digital Media",
    Advertising: "Advertising",
  },
  Education: {
    "Elementary Education": "Elementary Education",
    "Secondary Education": "Secondary Education",
    "Special Education": "Special Education",
    "Educational Psychology": "Educational Psychology",
    "Curriculum and Instruction": "Curriculum and Instruction",
  },
  "Law & Public Service": {
    "Pre-Law": "Pre-Law",
    "Public Administration": "Public Administration",
    "Public Policy": "Public Policy",
    "International Affairs": "International Affairs",
  },
  Other: {
    Agriculture: "Agriculture",
    Forestry: "Forestry",
    "Sports Management": "Sports Management",
    Recreation: "Recreation",
    "Hospitality Management": "Hospitality Management",
    "Culinary Arts": "Culinary Arts",
    Aviation: "Aviation",
  },
  "✏️ Enter a custom major": "✏️ Enter a custom major",
}

const AP_COURSES = [
  "AP Biology",
  "AP Chemistry",
  "AP Physics",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Statistics",
  "AP English Language",
  "AP English Literature",
  "AP US History",
  "AP World History",
  "AP Psychology",
  "AP Economics",
  "AP Government",
  "AP Art History",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Environmental Science",
]

const EXTRACURRICULAR_ACTIVITIES = [
  "Student Government",
  "National Honor Society",
  "Debate Team",
  "Drama Club",
  "Band/Orchestra",
  "Choir",
  "Art Club",
  "Science Olympiad",
  "Math Team",
  "Robotics",
  "Volunteer Work",
  "Community Service",
  "Sports (Football)",
  "Sports (Basketball)",
  "Sports (Soccer)",
  "Sports (Tennis)",
  "Sports (Track)",
  "Sports (Swimming)",
  "Language Club",
  "Coding Club",
  "Environmental Club",
  "Key Club",
  "Chess Club",
  "Academic Decathlon",
]

const STUDY_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "China",
  "Singapore",
  "Japan",
  "South Korea",
  "Any",
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

const A_LEVEL_GRADES = ["A*", "A", "B", "C", "D", "E", "U"]
const IB_GRADES = ["7", "6", "5", "4", "3", "2", "1"]
const ACTIVITY_TIERS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"]

export function EnhancedStudentProfileForm({ onRecommendationsGenerated }: EnhancedStudentProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: "",
    lastName: "",
    gradeLevel: "",
    countryOfResidence: "",
    stateProvince: "",
    intendedMajor: "",
    customMajor: "",

    // Step 2: Academic Profile
    gradingSystem: "",
    gpa: "",
    classRank: "",
    satScore: "",
    actScore: "",
    ibScore: "",
    ibSubjects: [] as IBSubject[],
    aLevelSubjects: [] as ALevelSubject[],
    toeflScore: "",
    ieltsScore: "",
    apCourses: [] as string[],

    // Step 3: Activities & Achievements
    extracurriculars: [] as ExtracurricularActivity[],
    volunteerHours: "",
    workExperience: "",
    leadershipRoles: "",
    awardsHonors: "",

    // Step 4: College Preferences
    preferredCountries: [] as string[],
    schoolSize: "",
    campusSetting: "",
    budgetRange: "",
    distanceFromHome: "",
    academicCalendar: "",
    housingPreference: "",
    researchOpportunities: "",
    studyAbroadPrograms: "",
    greekLifeImportant: false,
    strongAthletics: false,
    diverseStudentBody: false,
    strongAlumniNetwork: false,

    // Step 5: Background Information
    familyIncome: "",
    firstGenerationStudent: false,
    financialAidNeeded: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const handleGenerateRecommendations = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Convert form data to StudentProfile format
      const profileData: StudentProfile = {
        // Map form data to existing profile structure
        test_type: formData.gradingSystem,
        total_score: formData.ibScore || formData.gpa,
        gpa: Number.parseFloat(formData.gpa) || undefined,
        sat_score: Number.parseInt(formData.satScore) || undefined,
        act_score: Number.parseInt(formData.actScore) || undefined,
        intended_major:
          formData.intendedMajor === "✏️ Enter a custom major" ? formData.customMajor : formData.intendedMajor,
        campus_type: formData.campusSetting,
        location_preference: formData.preferredCountries.join(", "),
        financial_aid_needed: formData.financialAidNeeded,
        budget_range: formData.budgetRange,
        extracurriculars: formData.extracurriculars.map((ec) => `${ec.activity} (${ec.tier})`),
        work_experience: formData.workExperience,
        volunteer_work: formData.volunteerHours ? `${formData.volunteerHours} hours of volunteer work` : undefined,
        special_circumstances: [
          formData.firstGenerationStudent ? "First-generation college student" : "",
          formData.leadershipRoles ? `Leadership: ${formData.leadershipRoles}` : "",
          formData.awardsHonors ? `Awards: ${formData.awardsHonors}` : "",
        ]
          .filter(Boolean)
          .join("; "),
        research_interest: formData.researchOpportunities === "Very Important",
      }

      const result = await generateCollegeRecommendations(profileData)

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

  const handleArrayToggle = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const currentArray = prev[field] as string[]
      const isSelected = currentArray.includes(value)
      if (isSelected) {
        return { ...prev, [field]: currentArray.filter((item) => item !== value) }
      } else {
        return { ...prev, [field]: [...currentArray, value] }
      }
    })
  }

  const addALevelSubject = () => {
    setFormData((prev) => ({
      ...prev,
      aLevelSubjects: [...prev.aLevelSubjects, { subject: "", grade: "" }],
    }))
  }

  const removeALevelSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      aLevelSubjects: prev.aLevelSubjects.filter((_, i) => i !== index),
    }))
  }

  const updateALevelSubject = (index: number, field: keyof ALevelSubject, value: string) => {
    setFormData((prev) => ({
      ...prev,
      aLevelSubjects: prev.aLevelSubjects.map((subject, i) => (i === index ? { ...subject, [field]: value } : subject)),
    }))
  }

  const addIBSubject = () => {
    setFormData((prev) => ({
      ...prev,
      ibSubjects: [...prev.ibSubjects, { subject: "", level: "HL", grade: "" }],
    }))
  }

  const removeIBSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ibSubjects: prev.ibSubjects.filter((_, i) => i !== index),
    }))
  }

  const updateIBSubject = (index: number, field: keyof IBSubject, value: string) => {
    setFormData((prev) => ({
      ...prev,
      ibSubjects: prev.ibSubjects.map((subject, i) => (i === index ? { ...subject, [field]: value } : subject)),
    }))
  }

  const handleExtracurricularToggle = (activity: string) => {
    setFormData((prev) => {
      const isSelected = prev.extracurriculars.some((ec) => ec.activity === activity)
      if (isSelected) {
        return {
          ...prev,
          extracurriculars: prev.extracurriculars.filter((ec) => ec.activity !== activity),
        }
      } else {
        return {
          ...prev,
          extracurriculars: [...prev.extracurriculars, { activity, tier: "" }],
        }
      }
    })
  }

  const updateExtracurricularTier = (activity: string, tier: string) => {
    setFormData((prev) => ({
      ...prev,
      extracurriculars: prev.extracurriculars.map((ec) => (ec.activity === activity ? { ...ec, tier } : ec)),
    }))
  }

  const renderMajorOptions = () => {
    const options: JSX.Element[] = []

    Object.entries(INTENDED_MAJORS).forEach(([category, majors]) => {
      if (typeof majors === "string") {
        options.push(
          <SelectItem key={majors} value={majors}>
            {majors}
          </SelectItem>,
        )
      } else {
        options.push(
          <SelectItem
            key={`header-${category}`}
            value={`header-${category}`}
            disabled
            className="font-semibold cursor-default select-none opacity-70"
          >
            {category}
          </SelectItem>,
        )
        Object.entries(majors).forEach(([major, value]) => {
          options.push(
            <SelectItem key={value} value={value} className="pl-6">
              {major}
            </SelectItem>,
          )
        })
      }
    })

    return options
  }

  const TierInfoDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1 h-auto">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>The Four Tiers Explained</DialogTitle>
          <DialogDescription>Understanding extracurricular activity tiers for college applications</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-green-600">Tier 1: National/International Achievement or Leadership</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
              <li>National awards (e.g., Regeneron Science Talent Search finalist)</li>
              <li>International academic Olympiad medals</li>
              <li>Founding a nonprofit with national impact</li>
              <li>Nationally ranked athlete or artist</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-600">Tier 2: State/Regional Achievement or Leadership</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
              <li>State champion in competitions</li>
              <li>Student body president</li>
              <li>Selected for state-level orchestra or sports team</li>
              <li>Community initiative with regional recognition</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-orange-600">Tier 3: School/Local Leadership or Distinction</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
              <li>Club officer (e.g., treasurer, secretary)</li>
              <li>Captain of a school sports team</li>
              <li>Editor of the school newspaper</li>
              <li>Leading a school club or organization</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-600">Tier 4: General Participation</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
              <li>Club member</li>
              <li>Routine volunteer</li>
              <li>Participant in school or community activities without leadership roles</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <p className="text-sm text-muted-foreground">Tell us about yourself</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
            placeholder="John"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
            placeholder="Smith"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gradeLevel">Current Grade Level *</Label>
          <Select
            value={formData.gradeLevel}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, gradeLevel: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your grade level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="9th Grade">9th Grade (or equivalent)</SelectItem>
              <SelectItem value="10th Grade">10th Grade (or equivalent)</SelectItem>
              <SelectItem value="11th Grade">11th Grade (or equivalent)</SelectItem>
              <SelectItem value="12th Grade">12th Grade (or equivalent)</SelectItem>
              <SelectItem value="Pre-University">Pre-University / Foundation Year</SelectItem>
              <SelectItem value="Gap Year">Gap Year Student</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="countryOfResidence">Country of Residence *</Label>
          <Select
            value={formData.countryOfResidence}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, countryOfResidence: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stateProvince">State/Province/Region (Optional)</Label>
        <Input
          id="stateProvince"
          value={formData.stateProvince}
          onChange={(e) => setFormData((prev) => ({ ...prev, stateProvince: e.target.value }))}
          placeholder="California, Ontario, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="intendedMajor">Intended Major *</Label>
        <Select
          value={formData.intendedMajor}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, intendedMajor: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your intended major" />
          </SelectTrigger>
          <SelectContent className="max-h-60">{renderMajorOptions()}</SelectContent>
        </Select>
      </div>

      {formData.intendedMajor === "✏️ Enter a custom major" && (
        <div className="space-y-2">
          <Label htmlFor="customMajor">Custom Major</Label>
          <Input
            id="customMajor"
            value={formData.customMajor}
            onChange={(e) => setFormData((prev) => ({ ...prev, customMajor: e.target.value }))}
            placeholder="Enter your custom major"
          />
        </div>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Academic Profile</h3>
        <p className="text-sm text-muted-foreground">Tell us about your academic background</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gradingSystem">Primary Grading System *</Label>
        <Select
          value={formData.gradingSystem}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, gradingSystem: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your grading system" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US GPA & SAT/ACT">US GPA & SAT/ACT</SelectItem>
            <SelectItem value="International Baccalaureate (IB)">International Baccalaureate (IB)</SelectItem>
            <SelectItem value="A-Levels">A-Levels</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.gradingSystem === "US GPA & SAT/ACT" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gpa">GPA (4.0 scale)</Label>
              <Input
                id="gpa"
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={formData.gpa}
                onChange={(e) => setFormData((prev) => ({ ...prev, gpa: e.target.value }))}
                placeholder="3.85"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classRank">Class Rank</Label>
              <Select
                value={formData.classRank}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, classRank: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Top 5%">Top 5%</SelectItem>
                  <SelectItem value="Top 10%">Top 10%</SelectItem>
                  <SelectItem value="Top 25%">Top 25%</SelectItem>
                  <SelectItem value="Top 50%">Top 50%</SelectItem>
                  <SelectItem value="Bottom 50%">Bottom 50%</SelectItem>
                  <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="satScore">SAT Score (Optional)</Label>
              <Input
                id="satScore"
                type="number"
                min="400"
                max="1600"
                value={formData.satScore}
                onChange={(e) => setFormData((prev) => ({ ...prev, satScore: e.target.value }))}
                placeholder="1450"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actScore">ACT Score (Optional)</Label>
              <Input
                id="actScore"
                type="number"
                min="1"
                max="36"
                value={formData.actScore}
                onChange={(e) => setFormData((prev) => ({ ...prev, actScore: e.target.value }))}
                placeholder="32"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>AP Courses (Optional)</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
              {AP_COURSES.map((course) => (
                <div key={course} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ap-${course}`}
                    checked={formData.apCourses.includes(course)}
                    onCheckedChange={() => handleArrayToggle("apCourses", course)}
                  />
                  <Label htmlFor={`ap-${course}`} className="text-sm">
                    {course}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {formData.gradingSystem === "International Baccalaureate (IB)" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ibScore">IB Total Score (Predicted/Final)</Label>
            <Input
              id="ibScore"
              type="number"
              min="24"
              max="45"
              value={formData.ibScore}
              onChange={(e) => setFormData((prev) => ({ ...prev, ibScore: e.target.value }))}
              placeholder="38"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>IB Subjects</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIBSubject}>
                <Plus className="h-4 w-4 mr-1" />
                Add Subject
              </Button>
            </div>
            <div className="space-y-2">
              {formData.ibSubjects.map((subject, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select value={subject.subject} onValueChange={(value) => updateIBSubject(index, "subject", value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_SUBJECTS.map((subj) => (
                        <SelectItem key={subj} value={subj}>
                          {subj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={subject.level}
                    onValueChange={(value) => updateIBSubject(index, "level", value as "HL" | "SL")}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HL">HL</SelectItem>
                      <SelectItem value="SL">SL</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={subject.grade} onValueChange={(value) => updateIBSubject(index, "grade", value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {IB_GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeIBSubject(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {formData.gradingSystem === "A-Levels" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>A-Level Subjects</Label>
            <Button type="button" variant="outline" size="sm" onClick={addALevelSubject}>
              <Plus className="h-4 w-4 mr-1" />
              Add Subject
            </Button>
          </div>
          <div className="space-y-2">
            {formData.aLevelSubjects.map((subject, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Select value={subject.subject} onValueChange={(value) => updateALevelSubject(index, "subject", value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_SUBJECTS.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={subject.grade} onValueChange={(value) => updateALevelSubject(index, "grade", value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {A_LEVEL_GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeALevelSubject(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="toeflScore">TOEFL Score (Optional)</Label>
          <Input
            id="toeflScore"
            type="number"
            min="0"
            max="120"
            value={formData.toeflScore}
            onChange={(e) => setFormData((prev) => ({ ...prev, toeflScore: e.target.value }))}
            placeholder="100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ieltsScore">IELTS Score (Optional)</Label>
          <Input
            id="ieltsScore"
            type="number"
            min="0"
            max="9"
            step="0.5"
            value={formData.ieltsScore}
            onChange={(e) => setFormData((prev) => ({ ...prev, ieltsScore: e.target.value }))}
            placeholder="7.5"
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Activities & Achievements</h3>
        <p className="text-sm text-muted-foreground">Tell us about your extracurricular involvement</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Extracurricular Activities</Label>
          <TierInfoDialog />
        </div>
        <div className="space-y-3">
          {EXTRACURRICULAR_ACTIVITIES.map((activity) => {
            const selectedActivity = formData.extracurriculars.find((ec) => ec.activity === activity)
            const isSelected = !!selectedActivity

            return (
              <div key={activity} className="border rounded p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`activity-${activity}`}
                    checked={isSelected}
                    onCheckedChange={() => handleExtracurricularToggle(activity)}
                  />
                  <Label htmlFor={`activity-${activity}`} className="text-sm font-medium">
                    {activity}
                  </Label>
                </div>
                {isSelected && (
                  <div className="ml-6">
                    <Label className="text-xs text-muted-foreground">Select Tier:</Label>
                    <Select
                      value={selectedActivity.tier}
                      onValueChange={(value) => updateExtracurricularTier(activity, value)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TIERS.map((tier) => (
                          <SelectItem key={tier} value={tier}>
                            {tier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="volunteerHours">Volunteer Hours</Label>
          <Input
            id="volunteerHours"
            type="number"
            min="0"
            value={formData.volunteerHours}
            onChange={(e) => setFormData((prev) => ({ ...prev, volunteerHours: e.target.value }))}
            placeholder="100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workExperience">Work Experience</Label>
          <Input
            id="workExperience"
            value={formData.workExperience}
            onChange={(e) => setFormData((prev) => ({ ...prev, workExperience: e.target.value }))}
            placeholder="Part-time job, internship, etc."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leadershipRoles">Leadership Roles (one per line)</Label>
        <Textarea
          id="leadershipRoles"
          value={formData.leadershipRoles}
          onChange={(e) => setFormData((prev) => ({ ...prev, leadershipRoles: e.target.value }))}
          placeholder="Student Council President&#10;Debate Team Captain&#10;Volunteer Coordinator"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="awardsHonors">Awards & Honors (one per line)</Label>
        <Textarea
          id="awardsHonors"
          value={formData.awardsHonors}
          onChange={(e) => setFormData((prev) => ({ ...prev, awardsHonors: e.target.value }))}
          placeholder="National Merit Scholar&#10;Science Fair Winner&#10;Academic Excellence Award"
          rows={3}
        />
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">College Preferences</h3>
        <p className="text-sm text-muted-foreground">Tell us about your ideal college environment</p>
      </div>

      <div className="space-y-2">
        <Label>Preferred Countries for Study</Label>
        <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
          {STUDY_COUNTRIES.map((country) => (
            <div key={country} className="flex items-center space-x-2">
              <Checkbox
                id={`country-${country}`}
                checked={formData.preferredCountries.includes(country)}
                onCheckedChange={() => handleArrayToggle("preferredCountries", country)}
              />
              <Label htmlFor={`country-${country}`} className="text-sm">
                {country}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="schoolSize">School Size</Label>
          <Select
            value={formData.schoolSize}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, schoolSize: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select school size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="🤔 I'm not sure - Help me decide!">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  I'm not sure - Help me decide!
                </div>
              </SelectItem>
              <SelectItem value="Small (Under 5,000 students)">Small (Under 5,000 students)</SelectItem>
              <SelectItem value="Medium (5,000-15,000 students)">Medium (5,000-15,000 students)</SelectItem>
              <SelectItem value="Large (Over 15,000 students)">Large (Over 15,000 students)</SelectItem>
              <SelectItem value="No preference">No preference</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="campusSetting">Campus Setting</Label>
          <Select
            value={formData.campusSetting}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, campusSetting: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select campus setting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="🤔 I'm not sure - Help me decide!">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  I'm not sure - Help me decide!
                </div>
              </SelectItem>
              <SelectItem value="Urban">Urban</SelectItem>
              <SelectItem value="Suburban">Suburban</SelectItem>
              <SelectItem value="Rural">Rural</SelectItem>
              <SelectItem value="No preference">No preference</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="budgetRange">Budget Range (Annual, USD)</Label>
          <Select
            value={formData.budgetRange}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, budgetRange: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="🤔 I'm not sure - Help me decide!">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  I'm not sure - Help me decide!
                </div>
              </SelectItem>
              <SelectItem value="Under $30,000">Under $30,000</SelectItem>
              <SelectItem value="$30,000 - $50,000">$30,000 - $50,000</SelectItem>
              <SelectItem value="$50,000 - $70,000">$50,000 - $70,000</SelectItem>
              <SelectItem value="Over $70,000">Over $70,000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="distanceFromHome">Distance from Home</Label>
          <Select
            value={formData.distanceFromHome}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, distanceFromHome: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select distance preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="🤔 I'm not sure - Help me decide!">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  I'm not sure - Help me decide!
                </div>
              </SelectItem>
              <SelectItem value="Close to home (same country)">Close to home (same country)</SelectItem>
              <SelectItem value="Moderate distance (neighboring countries)">
                Moderate distance (neighboring countries)
              </SelectItem>
              <SelectItem value="Far from home (anywhere in world)">Far from home (anywhere in world)</SelectItem>
              <SelectItem value="No preference">No preference</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="researchOpportunities">Research Opportunities</Label>
          <Select
            value={formData.researchOpportunities}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, researchOpportunities: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="🤔 I'm not sure - Help me decide!">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  I'm not sure - Help me decide!
                </div>
              </SelectItem>
              <SelectItem value="Very Important">Very Important</SelectItem>
              <SelectItem value="Somewhat Important">Somewhat Important</SelectItem>
              <SelectItem value="Not Important">Not Important</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studyAbroadPrograms">Study Abroad Programs</Label>
          <Select
            value={formData.studyAbroadPrograms}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, studyAbroadPrograms: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="🤔 I'm not sure - Help me decide!">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  I'm not sure - Help me decide!
                </div>
              </SelectItem>
              <SelectItem value="Very Important">Very Important</SelectItem>
              <SelectItem value="Somewhat Important">Somewhat Important</SelectItem>
              <SelectItem value="Not Important">Not Important</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Additional Preferences</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="greekLife">Greek Life Important</Label>
            <Switch
              id="greekLife"
              checked={formData.greekLifeImportant}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, greekLifeImportant: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="athletics">Strong Athletics</Label>
            <Switch
              id="athletics"
              checked={formData.strongAthletics}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, strongAthletics: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="diversity">Diverse Student Body</Label>
            <Switch
              id="diversity"
              checked={formData.diverseStudentBody}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, diverseStudentBody: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="alumni">Strong Alumni Network</Label>
            <Switch
              id="alumni"
              checked={formData.strongAlumniNetwork}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, strongAlumniNetwork: checked }))}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Background Information</h3>
        <p className="text-sm text-muted-foreground">Help us understand your background</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="familyIncome">Family Income Range</Label>
        <Select
          value={formData.familyIncome}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, familyIncome: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select income range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Under $50,000">Under $50,000</SelectItem>
            <SelectItem value="$50,000 - $100,000">$50,000 - $100,000</SelectItem>
            <SelectItem value="$100,000 - $150,000">$100,000 - $150,000</SelectItem>
            <SelectItem value="Over $150,000">Over $150,000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="firstGen">First-Generation College Student</Label>
            <p className="text-sm text-muted-foreground">Neither parent has completed a 4-year college degree</p>
          </div>
          <Switch
            id="firstGen"
            checked={formData.firstGenerationStudent}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, firstGenerationStudent: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="financialAid">Financial Aid Needed</Label>
          <Switch
            id="financialAid"
            checked={formData.financialAidNeeded}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, financialAidNeeded: checked }))}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="text-center space-y-4">
          <div>
            <h4 className="text-lg font-semibold">Ready to Get Your College Recommendations?</h4>
            <p className="text-sm text-muted-foreground">
              Click the button below to generate personalized college recommendations based on your profile
            </p>
          </div>

          <Button onClick={handleGenerateRecommendations} disabled={loading} size="lg" className="w-full max-w-md">
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

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="max-w-md mx-auto">
              <GraduationCap className="h-4 w-4" />
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </div>
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
        <div className="space-y-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {currentStep < totalSteps && (
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                Previous
              </Button>
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
