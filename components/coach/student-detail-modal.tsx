"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Eye, 
  GraduationCap, 
  Target, 
  FileText, 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  BookOpen, 
  TrendingUp,
  Calendar,
  Brain,
  Users,
  Trophy,
  Heart,
  Globe,
  ChevronDown, 
  ChevronUp,
  Filter,
  Search,
  BarChart3,
  Info,
  CheckCircle,
  AlertCircle,
  Star
} from "lucide-react"

interface StudentDetailModalProps {
  studentId: string
  studentName: string
  defaultTab?: string
  children?: React.ReactNode
}

interface ALevelSubject {
  subject: string
  grade: string
}

interface IBSubject {
  subject: string
  level: string
  grade: string
}

interface ExtracurricularActivity {
  activity: string
  tier: string
  description: string
}

interface CollegePreferences {
  costImportance?: string
  academicReputation?: string
  socialLife?: string
  researchOpportunities?: string
  internshipOpportunities?: string
  studyAbroadPrograms?: string
  greekLifeImportant?: boolean
  strongAthletics?: boolean
  diverseStudentBody?: boolean
  strongAlumniNetwork?: boolean
  activeSocialLife?: string
  varietyOfClubs?: boolean
  campusEventsAndTraditions?: boolean
  residentialCommunityType?: string
  nightlifeOffCampusActivities?: boolean
  internationalStudentCommunity?: boolean
  religiousLifeImportant?: boolean
  religiousAffiliation?: string
  lgbtqFriendlyCampus?: boolean
  politicalActivism?: string
  campusSafety?: string
  weatherClimatePreference?: string[]
  studyAbroadImportant?: boolean
  undergraduateResearchImportant?: boolean
  internshipCoopImportant?: boolean
  honorsPrograms?: boolean
  acceleratedDegreePrograms?: boolean
  robustCareerServices?: boolean
  graduateEmployability?: string
  firstGenerationSupport?: boolean
  disabilityServices?: boolean
  lgbtqSupportServices?: boolean
  testOptionalPolicy?: boolean
  earlyActionDecisionOptions?: boolean
  needBlindAdmission?: boolean
  institutionalPrestige?: string
  legacyConsideration?: boolean
  demonstratedInterest?: boolean
  otherPreferences?: string
  otherSpecificPreferences?: string
}

interface DreamCollege {
  name: string
  reason?: string
  website_url?: string
}

interface StudentProfile {
  // Basic Information
  grade_level?: string
  gpa?: number
  sat_score?: number
  act_score?: number
  interests?: string[]
  preferred_majors?: string[]
  budget_range?: string
  location_preferences?: string[]
  
  // Extended Information
  country_of_residence?: string
  state_province?: string
  college_size?: string
  campus_setting?: string
  class_rank?: string
  grading_system?: string
  
  // Academic Details
  a_level_subjects?: ALevelSubject[]
  ib_subjects?: IBSubject[]
  ib_total_points?: number
  extracurricular_details?: ExtracurricularActivity[]
  
  // College Preferences
  college_preferences?: CollegePreferences
  
  // Dream Colleges
  dream_colleges?: string[] | DreamCollege[]
  preferred_countries?: string[]
}

interface CollegeApplication {
  id: string
  college_name: string
  application_status: string
  application_deadline?: string
  updated_at: string
}

interface CollegeMatch {
  id: string
  student_id: string
  college_name: string
  match_score: number
  admission_chance: number
  justification: string | null
  source_links?: string[] | null
  country?: string | null
  city?: string | null
  program_type?: string | null
  estimated_cost?: string | null
  admission_requirements?: string | null
  acceptance_rate?: number | null
  student_count?: number | null
  campus_setting?: string | null
  tuition_annual?: string | null
  match_reasons?: string[] | null
  website_url?: string | null
  fit_category: "Safety" | "Target" | "Reach"
  generated_at: string
  is_dream_college?: boolean
}

const statusColors = {
  "Considering": "bg-gray-100 text-gray-800",
  "Planning to Apply": "bg-blue-100 text-blue-800",
  "Applied": "bg-orange-100 text-orange-800",
  "Interviewing": "bg-purple-100 text-purple-800",
  "Accepted": "bg-green-100 text-green-800",
  "Rejected": "bg-red-100 text-red-800",
  "Enrolled": "bg-emerald-100 text-emerald-800"
}

const statusOrder = [
  "Considering",
  "Planning to Apply", 
  "Applied",
  "Interviewing",
  "Accepted",
  "Rejected",
  "Enrolled"
]

export function StudentDetailModal({ studentId, studentName, defaultTab = "overview", children }: StudentDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [applications, setApplications] = useState<CollegeApplication[]>([])
  const [matches, setMatches] = useState<CollegeMatch[]>([])
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set())
  const [matchDetails, setMatchDetails] = useState<Record<string, any>>({})
  const [matchFilters, setMatchFilters] = useState({
    sortBy: "match_score",
    showDreamColleges: true,
    showAIRecommendations: true,
    fitCategories: [] as string[],
    countries: [] as string[],
    searchTerm: ""
  })

  // Update active tab when defaultTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [defaultTab, isOpen])

  const loadStudentData = async () => {
    if (!isOpen) return
    
    setLoading(true)
    try {
      // Load student profile
      const profileResponse = await fetch(`/api/coach/students/${studentId}/profile`)
      const profileData = await profileResponse.json()
      
      if (profileData.success) {
        setProfile(profileData.profile)
      }

      // Load student applications
      const appsResponse = await fetch(`/api/coach/students/${studentId}/applications`)
      const appsData = await appsResponse.json()
      
      if (appsData.success) {
        setApplications(appsData.applications || [])
      }

      // Load student matches
      const matchesResponse = await fetch(`/api/coach/students/${studentId}/matches`)
      const matchesData = await matchesResponse.json()
      
      if (matchesData.success) {
        setMatches(matchesData.matches || [])
      }

    } catch (error) {
      console.error("Error loading student data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudentData()
  }, [isOpen, studentId])

  const getStageStats = () => {
    const stats: Record<string, number> = {}
    
    // Initialize all statuses with 0
    statusOrder.forEach(status => {
      stats[status] = 0
    })

    // Count applications by status
    applications.forEach(app => {
      if (app.application_status && stats.hasOwnProperty(app.application_status)) {
        stats[app.application_status]++
      }
    })

    return stats
  }

  const getApplicationsByStatus = () => {
    const grouped: Record<string, CollegeApplication[]> = {}
    
    // Initialize all statuses with empty arrays
    statusOrder.forEach(status => {
      grouped[status] = []
    })

    // Group applications by status
    applications.forEach(app => {
      if (app.application_status && grouped.hasOwnProperty(app.application_status)) {
        grouped[app.application_status].push(app)
      }
    })

    return grouped
  }

  const getPreferencesHighlights = (preferences: CollegePreferences) => {
    const highlights = []
    
    if (preferences.academicReputation) highlights.push(`Academic Reputation: ${preferences.academicReputation}`)
    if (preferences.costImportance) highlights.push(`Cost: ${preferences.costImportance}`)
    if (preferences.socialLife) highlights.push(`Social Life: ${preferences.socialLife}`)
    if (preferences.campusSafety) highlights.push(`Campus Safety: ${preferences.campusSafety}`)
    if (preferences.institutionalPrestige) highlights.push(`Prestige: ${preferences.institutionalPrestige}`)
    
    // Add boolean preferences that are true
    if (preferences.diverseStudentBody) highlights.push("Diverse Student Body")
    if (preferences.strongAthletics) highlights.push("Strong Athletics")
    if (preferences.studyAbroadImportant) highlights.push("Study Abroad Programs")
    if (preferences.undergraduateResearchImportant) highlights.push("Research Opportunities")
    if (preferences.robustCareerServices) highlights.push("Career Services")
    
    return highlights.slice(0, 8) // Show top 8 highlights
  }

  const loadMatchDetails = async (matchId: string) => {
    if (matchDetails[matchId]) return // Already loaded
    
    try {
      // Simulate detailed match analysis (in a real implementation, this might call a specific API)
      const match = matches.find(m => m.id === matchId)
      if (!match) return
      
      const details = {
        admissionFactors: {
          academicProfile: match.admission_chance >= 0.8 ? "Strong" : match.admission_chance >= 0.5 ? "Competitive" : "Challenging",
          competitiveness: match.fit_category,
          acceptanceRate: match.acceptance_rate ? Math.round(match.acceptance_rate * 100) : null
        },
        detailedAnalysis: generateDetailedAnalysis(match, profile),
        profileContext: getStudentProfileSummary(profile)
      }
      
      setMatchDetails(prev => ({ ...prev, [matchId]: details }))
    } catch (error) {
      console.error("Error loading match details:", error)
    }
  }

  const generateDetailedAnalysis = (match: CollegeMatch, studentProfile: StudentProfile | null) => {
    if (!studentProfile) return null
    
    const analysis = {
      locationFit: [] as string[],
      academicFit: [] as string[],
      campusLifeFit: [] as string[],
      opportunitiesFit: [] as string[],
      supportFit: [] as string[],
      applicationFit: [] as string[],
      backgroundFit: [] as string[]
    }
    
    // Location fit analysis
    if (match.country && studentProfile.preferred_countries?.some(country => 
      country.toLowerCase().includes(match.country!.toLowerCase()))) {
      analysis.locationFit.push(`Located in ${match.country}, matching your geographic preference`)
    }
    
    // Academic fit analysis
    if (studentProfile.campus_setting && match.campus_setting && 
        studentProfile.campus_setting.toLowerCase() === match.campus_setting.toLowerCase()) {
      analysis.academicFit.push(`${match.campus_setting} campus setting matches your preference`)
    }
    
    if (studentProfile.preferred_majors && match.program_type) {
      analysis.academicFit.push(`Strong ${match.program_type} programs align with your interests`)
    }
    
    // Campus life analysis based on preferences
    if (studentProfile.college_preferences?.strongAthletics && 
        match.match_reasons?.some(r => r.toLowerCase().includes('athletic'))) {
      analysis.campusLifeFit.push("Strong athletic programs available")
    }
    
    if (studentProfile.college_preferences?.diverseStudentBody) {
      analysis.campusLifeFit.push("Diverse student community")
    }
    
    // Academic opportunities
    if (studentProfile.college_preferences?.undergraduateResearchImportant) {
      analysis.opportunitiesFit.push("Research opportunities for undergraduates")
    }
    
    if (studentProfile.college_preferences?.internshipCoopImportant) {
      analysis.opportunitiesFit.push("Strong internship and co-op programs")
    }
    
    // Support services
    if (studentProfile.college_preferences?.firstGenerationSupport) {
      analysis.supportFit.push("First-generation student support services")
    }
    
    return analysis
  }

  const getStudentProfileSummary = (studentProfile: StudentProfile | null) => {
    if (!studentProfile) return null
    
    return {
      academic: {
        gradeLevel: studentProfile.grade_level,
        gpa: studentProfile.gpa,
        satScore: studentProfile.sat_score,
        actScore: studentProfile.act_score,
        gradingSystem: studentProfile.grading_system
      },
      preferences: {
        preferredMajors: studentProfile.preferred_majors,
        collegeSize: studentProfile.college_size,
        campusSetting: studentProfile.campus_setting,
        budgetRange: studentProfile.budget_range,
        preferredCountries: studentProfile.preferred_countries
      }
    }
  }

  const toggleMatchExpansion = async (matchId: string) => {
    const newExpandedMatches = new Set(expandedMatches)
    
    if (expandedMatches.has(matchId)) {
      newExpandedMatches.delete(matchId)
    } else {
      newExpandedMatches.add(matchId)
      await loadMatchDetails(matchId) // Load details when expanding
    }
    
    setExpandedMatches(newExpandedMatches)
  }

  const getFilteredAndSortedMatches = () => {
    let filtered = matches.filter(match => {
      // Filter by type
      if (!matchFilters.showDreamColleges && match.is_dream_college) return false
      if (!matchFilters.showAIRecommendations && !match.is_dream_college) return false
      
      // Filter by fit categories
      if (matchFilters.fitCategories.length > 0 && 
          !matchFilters.fitCategories.includes(match.fit_category)) return false
      
      // Filter by countries
      if (matchFilters.countries.length > 0 && match.country &&
          !matchFilters.countries.includes(match.country)) return false
      
      // Filter by search term
      if (matchFilters.searchTerm && 
          !match.college_name.toLowerCase().includes(matchFilters.searchTerm.toLowerCase())) return false
      
      return true
    })
    
    // Sort matches
    filtered.sort((a, b) => {
      switch (matchFilters.sortBy) {
        case "match_score":
          return b.match_score - a.match_score
        case "admission_chance":
          return b.admission_chance - a.admission_chance
        case "college_name":
          return a.college_name.localeCompare(b.college_name)
        case "fit_category":
          const categoryOrder = { "Safety": 1, "Target": 2, "Reach": 3 }
          return categoryOrder[a.fit_category] - categoryOrder[b.fit_category]
        default:
          return b.match_score - a.match_score
      }
    })
    
    return filtered
  }

  const stats = getStageStats()
  const applicationsByStatus = getApplicationsByStatus()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ? (
          <div>{children}</div>
        ) : (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-hidden bg-slate-50 p-0">
        <DialogHeader className="bg-slate-800 text-white px-4 sm:px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="truncate">{studentName} - Student Profile</span>
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-sm sm:text-base">
            <span className="hidden sm:inline">Comprehensive view of student profile and college application progress</span>
            <span className="sm:hidden">Student profile and application progress</span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] px-4 sm:px-6 py-4">
          {loading ? (
            <div className="text-center py-8">Loading student data...</div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-6 h-auto">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Student Profile</span>
                  <span className="sm:hidden">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">College Preferences</span>
                  <span className="sm:hidden">Preferences</span>
                </TabsTrigger>
                <TabsTrigger value="matches" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">College Recommendations</span>
                  <span className="sm:hidden">Matches</span>
                </TabsTrigger>
                <TabsTrigger value="applications" className="text-xs sm:text-sm px-2 py-2">
                  <span className="hidden sm:inline">Applications ({applications.length})</span>
                  <span className="sm:hidden">Apps ({applications.length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Application Stage Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats["Considering"]}</div>
                        <p className="text-xs text-slate-600">Considering</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats["Applied"]}</div>
                        <p className="text-xs text-slate-600">Applied</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats["Accepted"]}</div>
                        <p className="text-xs text-slate-600">Accepted</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{stats["Enrolled"]}</div>
                        <p className="text-xs text-slate-600">Enrolled</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Profile Summary */}
                {profile && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-slate-100 border-b">
                      <CardTitle className="text-slate-800 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <p className="text-sm font-medium text-slate-700">Grade Level</p>
                          <p className="text-lg font-semibold">{profile.grade_level || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">GPA</p>
                          <p className="text-lg font-semibold">{profile.gpa || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">SAT Score</p>
                          <p className="text-lg font-semibold">{profile.sat_score || "Not taken"}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">ACT Score</p>
                          <p className="text-lg font-semibold">{profile.act_score || "Not taken"}</p>
                        </div>
                      </div>
                      
                      {profile.preferred_majors && profile.preferred_majors.length > 0 && (
                        <div className="mt-6">
                          <p className="text-sm font-medium text-slate-700 mb-2">Preferred Majors</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.preferred_majors.map((major, index) => (
                              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                                {major}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                {profile ? (
                  <div className="space-y-6">
                    {/* Personal Information */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-slate-100 border-b">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="font-medium text-slate-700">Country of Residence</p>
                            <p className="text-slate-900">{profile.country_of_residence || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">State/Province</p>
                            <p className="text-slate-900">{profile.state_province || "Not specified"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-slate-100 border-b">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Academic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div>
                            <p className="font-medium text-slate-700">Grade Level</p>
                            <p className="text-slate-900">{profile.grade_level || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">Grading System</p>
                            <p className="text-slate-900">{profile.grading_system || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">Class Rank</p>
                            <p className="text-slate-900">{profile.class_rank || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">GPA</p>
                            <p className="text-slate-900">{profile.gpa || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">SAT Score</p>
                            <p className="text-slate-900">{profile.sat_score || "Not taken"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">ACT Score</p>
                            <p className="text-slate-900">{profile.act_score || "Not taken"}</p>
                          </div>
                        </div>

                        {/* IB Information */}
                        {profile.grading_system === "International Baccalaureate (IB)" && (
                          <div className="mt-6">
                            <Separator className="mb-4" />
                            <h4 className="font-semibold text-slate-700 mb-4">International Baccalaureate</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="font-medium text-slate-700">Total IB Points</p>
                                <p className="text-slate-900">{profile.ib_total_points || "Not specified"}</p>
                              </div>
                              <div>
                                <p className="font-medium text-slate-700 mb-2">IB Subjects</p>
                                {profile.ib_subjects && profile.ib_subjects.length > 0 ? (
                                  <div className="space-y-1">
                                    {profile.ib_subjects.map((subject, index) => (
                                      <div key={index} className="text-sm">
                                        <span className="font-medium">{subject.subject}</span> ({subject.level}) - Grade {subject.grade}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-900">Not specified</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* A-Level Information */}
                        {(profile.grading_system === "A-Levels" || profile.a_level_subjects && profile.a_level_subjects.length > 0) && (
                          <div className="mt-6">
                            <Separator className="mb-4" />
                            <h4 className="font-semibold text-slate-700 mb-4">A-Level Subjects</h4>
                            {profile.a_level_subjects && profile.a_level_subjects.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.a_level_subjects.map((subject, index) => (
                                  <div key={index} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="font-medium">{subject.subject}</span>
                                    <span className="text-slate-600">{subject.grade}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-900">Not specified</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Extracurricular Activities */}
                    {profile.extracurricular_details && profile.extracurricular_details.length > 0 && (
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-slate-100 border-b">
                          <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            Extracurricular Activities
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {profile.extracurricular_details.map((activity, index) => (
                              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-slate-800">{activity.activity}</h4>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    Tier {activity.tier}
                                  </Badge>
                                </div>
                                <p className="text-slate-600">{activity.description}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Interests */}
                    {profile.interests && profile.interests.length > 0 && (
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-slate-100 border-b">
                          <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Interests
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex flex-wrap gap-2">
                            {profile.interests.map((interest, index) => (
                              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Dream Colleges */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-slate-100 border-b">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Dream Colleges
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {profile.dream_colleges && profile.dream_colleges.length > 0 ? (
                          <div className="space-y-4">
                            {profile.dream_colleges.map((college, index) => (
                              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                                <h4 className="font-medium text-slate-800 mb-2">
                                  {typeof college === 'string' ? college : (college as DreamCollege).name || 'Unnamed College'}
                                </h4>
                                {typeof college === 'object' && (college as DreamCollege).reason && (
                                  <p className="text-slate-600 mb-2">{(college as DreamCollege).reason}</p>
                                )}
                                {typeof college === 'object' && (college as DreamCollege).website_url && (
                                  <a 
                                    href={(college as DreamCollege).website_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Visit Website →
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-600">Not specified</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600">
                    No profile data available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                {profile ? (
                  <div className="space-y-6">
                    {/* College Search Preferences */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="bg-slate-100 border-b">
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Location & Size Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div>
                            <p className="font-medium text-slate-700">College Size</p>
                            <p className="text-slate-900">{profile.college_size || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">Campus Setting</p>
                            <p className="text-slate-900">{profile.campus_setting || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-slate-700">Budget Range</p>
                            <p className="text-slate-900">{profile.budget_range || "Not specified"}</p>
                          </div>
                        </div>
                        
                        {profile.location_preferences && profile.location_preferences.length > 0 && (
                          <div className="mt-6">
                            <p className="font-medium text-slate-700 mb-2">Location Preferences</p>
                            <div className="flex flex-wrap gap-2">
                              {profile.location_preferences.map((location, index) => (
                                <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                                  {location}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {profile.preferred_countries && profile.preferred_countries.length > 0 && (
                          <div className="mt-6">
                            <p className="font-medium text-slate-700 mb-2">Preferred Countries</p>
                            <div className="flex flex-wrap gap-2">
                              {profile.preferred_countries.map((country, index) => (
                                <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700">
                                  {country}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Academic Preferences */}
                    {profile.preferred_majors && profile.preferred_majors.length > 0 && (
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-slate-100 border-b">
                          <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Academic Preferences
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div>
                            <p className="font-medium text-slate-700 mb-2">Preferred Majors</p>
                            <div className="flex flex-wrap gap-2">
                              {profile.preferred_majors.map((major, index) => (
                                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                                  {major}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Detailed College Preferences */}
                    {profile.college_preferences && Object.keys(profile.college_preferences).length > 0 && (
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-slate-100 border-b">
                          <CardTitle className="text-slate-800 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            College Preference Highlights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getPreferencesHighlights(profile.college_preferences).map((highlight, index) => (
                              <div key={index} className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-slate-800">{highlight}</p>
                              </div>
                            ))}
                          </div>
                          
                          {profile.college_preferences.otherPreferences && (
                            <div className="mt-6">
                              <p className="font-medium text-slate-700 mb-2">Additional Preferences</p>
                              <p className="text-slate-600 p-3 bg-slate-50 rounded-lg">
                                {profile.college_preferences.otherPreferences}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600">
                    No preference data available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="matches" className="space-y-4">
                <Card className="border-0 shadow-lg w-full overflow-hidden">
                  <CardHeader className="bg-slate-800 text-white border-b">
                    <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                      <Target className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">College Recommendations</span>
                    </CardTitle>
                    <CardDescription className="text-slate-300 text-sm sm:text-base">
                      <span className="hidden sm:inline">Comprehensive view of AI-generated recommendations and student's dream colleges with detailed analysis</span>
                      <span className="sm:hidden">AI recommendations and dream colleges with detailed analysis</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 overflow-hidden">
                    {matches.length > 0 ? (
                      <div className="space-y-6">
                        {/* Student Profile Context */}
                        {profile && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-600" />
                              Student Profile Context
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-slate-700">Academic:</span>
                                <div className="text-slate-600">
                                  {profile.grade_level && `Grade ${profile.grade_level}`}
                                  {profile.gpa && ` • GPA: ${profile.gpa}`}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Test Scores:</span>
                                <div className="text-slate-600">
                                  {profile.sat_score && `SAT: ${profile.sat_score}`}
                                  {profile.act_score && ` • ACT: ${profile.act_score}`}
                                  {!profile.sat_score && !profile.act_score && "Not specified"}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Preferences:</span>
                                <div className="text-slate-600">
                                  {profile.college_size || "Not specified"}
                                  {profile.campus_setting && ` • ${profile.campus_setting}`}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-slate-700">Majors:</span>
                                <div className="text-slate-600">
                                  {profile.preferred_majors?.slice(0, 2).join(", ") || "Not specified"}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Filters and Controls */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Filter className="h-4 w-4 text-slate-600" />
                              <span className="font-medium text-slate-700">Filters:</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {/* Search */}
                              <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <Input
                                  placeholder="Search colleges..."
                                  value={matchFilters.searchTerm}
                                  onChange={(e) => setMatchFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                  className="pl-10 w-full"
                                />
                              </div>

                              {/* Sort By */}
                              <Select
                                value={matchFilters.sortBy}
                                onValueChange={(value) => setMatchFilters(prev => ({ ...prev, sortBy: value }))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="match_score">Match Score</SelectItem>
                                  <SelectItem value="admission_chance">Admission Chance</SelectItem>
                                  <SelectItem value="college_name">College Name</SelectItem>
                                  <SelectItem value="fit_category">Fit Category</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Type Filters */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="dreamColleges"
                                  checked={matchFilters.showDreamColleges}
                                  onCheckedChange={(checked) => setMatchFilters(prev => ({ 
                                    ...prev, 
                                    showDreamColleges: checked as boolean 
                                  }))}
                                />
                                <Label htmlFor="dreamColleges" className="text-sm">Dream Colleges</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="aiRecommendations"
                                  checked={matchFilters.showAIRecommendations}
                                  onCheckedChange={(checked) => setMatchFilters(prev => ({ 
                                    ...prev, 
                                    showAIRecommendations: checked as boolean 
                                  }))}
                                />
                                <Label htmlFor="aiRecommendations" className="text-sm">AI Recommendations</Label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Colleges List */}
                        <div className="space-y-4">
                          {getFilteredAndSortedMatches().map((match) => (
                            <Card key={match.id} className="border border-slate-200 shadow-sm w-full overflow-hidden">
                              <CardContent className="p-0 overflow-hidden">
                                {/* College Header */}
                                <div className="p-3 sm:p-4 border-b border-slate-100">
                                  <div className="space-y-3">
                                    {/* College Name and Badges */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                      <h4 className="text-lg font-semibold text-slate-800 truncate flex-1">{match.college_name}</h4>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {match.is_dream_college && (
                                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                            <Heart className="h-3 w-3 mr-1" />
                                            <span className="hidden sm:inline">Dream College</span>
                                            <span className="sm:hidden">Dream</span>
                                          </Badge>
                                        )}
                                        {match.fit_category && (
                                          <Badge variant="outline" className={`text-xs ${
                                            match.fit_category === 'Safety' ? 'bg-green-50 text-green-700 border-green-200' :
                                            match.fit_category === 'Target' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-orange-50 text-orange-700 border-orange-200'
                                          }`}>
                                            {match.fit_category}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                      <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        <span className="text-slate-600">
                                          <span className="hidden sm:inline">Match: </span><span className="font-medium">{Math.round(match.match_score * 100)}%</span>
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        <span className="text-slate-600">
                                          <span className="hidden sm:inline">Admission: </span><span className="font-medium">{Math.round(match.admission_chance * 100)}%</span>
                                        </span>
                                      </div>
                                      {match.city && match.country && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                          <span className="text-slate-600 truncate">{match.city}, {match.country}</span>
                                        </div>
                                      )}
                                      {match.estimated_cost && (
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                          <span className="text-slate-600">{match.estimated_cost}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Expand Button */}
                                    <div className="flex justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleMatchExpansion(match.id)}
                                        className="flex items-center gap-2 hover:bg-slate-50 w-full sm:w-auto"
                                      >
                                        {expandedMatches.has(match.id) ? (
                                          <>
                                            <ChevronUp className="h-4 w-4" />
                                            <span className="hidden sm:inline">Show Less</span>
                                            <span className="sm:hidden">Show Less</span>
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-4 w-4" />
                                            <span className="hidden sm:inline">See Details</span>
                                            <span className="sm:hidden">See Details</span>
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedMatches.has(match.id) && (
                                  <div className="p-4 bg-slate-50 border-t border-slate-200">
                                    <div className="space-y-6">
                                      {/* Admission Chance Breakdown */}
                                      {matchDetails[match.id] && (
                                        <div className="bg-white border border-slate-200 rounded-lg p-4">
                                          <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-purple-600" />
                                            {Math.round(match.admission_chance * 100)}% Admission Chance Analysis
                                          </h5>
                                          <div className="grid gap-3 md:grid-cols-3">
                                            <div className="bg-blue-50 rounded-lg p-3">
                                              <div className="flex items-center gap-2 mb-2">
                                                <GraduationCap className="h-4 w-4 text-blue-600" />
                                                <span className="font-medium text-slate-800 text-sm">Academic Profile</span>
                                              </div>
                                              <p className="text-xs text-slate-700">
                                                {matchDetails[match.id].admissionFactors.academicProfile} academic standing
                                                {matchDetails[match.id].admissionFactors.acceptanceRate && 
                                                  ` vs ${matchDetails[match.id].admissionFactors.acceptanceRate}% acceptance rate`}
                                              </p>
                                            </div>
                                            <div className="bg-amber-50 rounded-lg p-3">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Target className="h-4 w-4 text-amber-600" />
                                                <span className="font-medium text-slate-800 text-sm">Competitiveness</span>
                                              </div>
                                              <p className="text-xs text-slate-700">
                                                {match.fit_category} school for your profile level
                                              </p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3">
                                              <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="font-medium text-slate-800 text-sm">Fit Assessment</span>
                                              </div>
                                              <p className="text-xs text-slate-700">
                                                Strong alignment with your preferences and goals
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Cost Information */}
                                      {(match.estimated_cost || match.tuition_annual) && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                          <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-green-700" />
                                            <span className="font-medium text-green-800">
                                              Annual Cost: {match.estimated_cost || match.tuition_annual}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Match Justification */}
                                      {match.justification && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                          <h5 className="font-semibold text-slate-800 mb-3">Why This is a Great Match:</h5>
                                          <p className="text-sm text-slate-700 leading-relaxed">{match.justification}</p>
                                        </div>
                                      )}

                                      {/* Detailed Analysis */}
                                      {matchDetails[match.id]?.detailedAnalysis && (
                                        <div className="space-y-3">
                                          <h5 className="font-semibold text-slate-800">Detailed Fit Analysis:</h5>
                                          <div className="grid gap-2">
                                            {Object.entries(matchDetails[match.id].detailedAnalysis).map(([category, items]) => {
                                              if (!items || items.length === 0) return null
                                              
                                              const categoryConfig = {
                                                locationFit: { title: "📍 Location Fit", color: "bg-green-50 border-green-200" },
                                                academicFit: { title: "🎓 Academic Fit", color: "bg-blue-50 border-blue-200" },
                                                campusLifeFit: { title: "🏛️ Campus Life", color: "bg-purple-50 border-purple-200" },
                                                opportunitiesFit: { title: "💼 Academic Opportunities", color: "bg-orange-50 border-orange-200" },
                                                supportFit: { title: "🤝 Support & Community", color: "bg-pink-50 border-pink-200" },
                                                applicationFit: { title: "📝 Application Process", color: "bg-teal-50 border-teal-200" },
                                                backgroundFit: { title: "💰 Background Fit", color: "bg-yellow-50 border-yellow-200" }
                                              }
                                              
                                              const config = categoryConfig[category] || { title: category, color: "bg-gray-50 border-gray-200" }
                                              
                                              return (
                                                <div key={category} className={`p-3 rounded-lg border ${config.color}`}>
                                                  <h6 className="font-medium text-slate-800 text-sm mb-2">{config.title}</h6>
                                                  <div className="space-y-1">
                                                    {items.map((item, index) => (
                                                      <div key={index} className="flex items-start gap-2">
                                                        <CheckCircle className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                                                        <span className="text-xs text-slate-700">{item}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Match Reasons */}
                                      {match.match_reasons && match.match_reasons.length > 0 && (
                                        <div className="border-t border-slate-200 pt-4">
                                          <h5 className="font-medium text-slate-800 text-sm mb-2">Coaching for College Recommendation Engine Match Reasons:</h5>
                                          <div className="flex flex-wrap gap-2">
                                            {match.match_reasons.map((reason, index) => (
                                              <Badge key={index} variant="outline" className="text-xs bg-white border-blue-200 text-blue-800">
                                                {reason}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Admission Requirements */}
                                      {match.admission_requirements && (
                                        <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                                          <h5 className="font-medium text-slate-800 text-sm mb-2">Admission Requirements:</h5>
                                          <p className="text-sm text-slate-700">{match.admission_requirements}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Summary Stats */}
                        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-slate-800">{matches.filter(m => m.is_dream_college).length}</div>
                              <div className="text-slate-600">Dream Colleges</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-slate-800">{matches.filter(m => !m.is_dream_college).length}</div>
                              <div className="text-slate-600">AI Recommendations</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-slate-800">{getFilteredAndSortedMatches().length}</div>
                              <div className="text-slate-600">Currently Showing</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-slate-800">
                                {Math.round(matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length * 100) || 0}%
                              </div>
                              <div className="text-slate-600">Avg Match Score</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-600">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                        <h3 className="text-lg font-semibold mb-2 text-slate-800">No College Recommendations Found</h3>
                        <p className="text-slate-600">
                          This student hasn't generated any college recommendations yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="applications" className="space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-slate-100 border-b">
                    <CardTitle className="text-slate-800 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      College Applications by Status
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Total: {applications.length} colleges
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Accordion type="multiple" defaultValue={statusOrder} className="w-full space-y-2">
                      {statusOrder.map((status) => {
                        const statusApps = applicationsByStatus[status]
                        const count = statusApps.length
                        
                        return (
                          <AccordionItem key={status} value={status} className="border border-slate-200 rounded-lg">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 rounded-t-lg">
                              <div className="flex items-center justify-between w-full mr-4">
                                <div className="flex items-center gap-3">
                                  <Badge className={statusColors[status]}>
                                    {status}
                                  </Badge>
                                  <span className="font-medium text-slate-800">
                                    {status} ({count})
                                  </span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              {count > 0 ? (
                                <div className="space-y-3">
                                  {statusApps.map((app) => (
                                    <div key={app.id} className="p-3 bg-slate-50 rounded-lg border">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <h4 className="font-medium text-slate-800">{app.college_name}</h4>
                                          {app.application_deadline && (
                                            <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                              <Clock className="h-3 w-3" />
                                              Deadline: {new Date(app.application_deadline).toLocaleDateString()}
                                            </p>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs text-slate-500">
                                            Updated {new Date(app.updated_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-center py-4">
                                  No colleges in this status
                                </p>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
