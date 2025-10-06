"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getStudentCollegeMatches, deleteCollegeMatches, type CollegeMatch } from "@/lib/college-matching-client"
import { addCollegeToList, getMyCollegeList } from "@/app/actions/college-list"
import { createClient } from "@/lib/supabase/client"
import { CollegeRecommendationsGuidanceChat } from "./college-recommendations-guidance-chat"
import { CollegeFiltersHorizontal } from "./college-filters-horizontal"
import {
  Brain,
  ExternalLink,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  Users,
  GraduationCap,
  Target,
  TrendingUp,
  Shield,
  Info,
  AlertCircle,
  ChevronDown,
  CheckCircle,
  Star,
  BarChart3,
  X,
  HelpCircle,
  SortAsc,
  SortDesc,
  ChevronUp,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useIsMobile } from "@/hooks/use-mobile"

interface CollegeMatchesViewProps {
  refreshTrigger?: number
}

interface StudentProfile {
  country_of_residence?: string
  preferred_countries?: string[]
  preferred_us_states?: string[]
  grade_level?: string
  gpa?: number
  sat_score?: number
  act_score?: number
  grading_system?: string
  preferred_majors?: string[]
  college_size?: string
  campus_setting?: string
  family_income?: string
  first_generation_student?: boolean
  financial_aid_needed?: boolean
  college_preferences?: {
    geographicPreference?: string[]
    collegeSize?: string
    campusSetting?: string
    intendedMajor?: string
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
    studyAbroadImportant?: boolean
    undergraduateResearchImportant?: boolean
    internshipCoopImportant?: boolean
    otherPreferences?: string
    // Campus Life & Social Fit
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
    // Academic & Career Opportunities
    honorsPrograms?: boolean
    acceleratedDegreePrograms?: boolean
    robustCareerServices?: boolean
    graduateEmployability?: string
    // Support & Community
    firstGenerationSupport?: boolean
    disabilityServices?: boolean
    lgbtqSupportServices?: boolean
    // Application Process Preferences
    testOptionalPolicy?: boolean
    earlyActionDecisionOptions?: boolean
    needBlindAdmission?: boolean
    // Academic & Institutional Reputation
    institutionalPrestige?: string
    // Other Preferences
    legacyConsideration?: boolean
    demonstratedInterest?: boolean
    otherSpecificPreferences?: string
  }
  location_preferences?: string[]
  intended_major?: string
  // Additional preferences fields
  greekLifeImportant?: boolean
  strongAthletics?: boolean
  diverseStudentBody?: boolean
  strongAlumniNetwork?: boolean
  studyAbroadImportant?: boolean
  undergraduateResearchImportant?: boolean
  internshipCoopImportant?: boolean
  // Campus Life & Social Fit
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
  // Academic & Career Opportunities
  honorsPrograms?: boolean
  acceleratedDegreePrograms?: boolean
  robustCareerServices?: boolean
  graduateEmployability?: string
  // Support & Community
  firstGenerationSupport?: boolean
  disabilityServices?: boolean
  lgbtqSupportServices?: boolean
  // Application Process Preferences
  testOptionalPolicy?: boolean
  earlyActionDecisionOptions?: boolean
  needBlindAdmission?: boolean
  // Academic & Institutional Reputation
  institutionalPrestige?: string
  // Other Preferences
  legacyConsideration?: boolean
  demonstratedInterest?: boolean
  otherSpecificPreferences?: string
  // Alternative field names for compatibility
  familyIncome?: string
  firstGenerationStudent?: boolean
  financialAidNeeded?: boolean
}

export function CollegeMatchesView({ refreshTrigger }: CollegeMatchesViewProps) {
  const [matches, setMatches] = useState<CollegeMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [showMethodologyDialog, setShowMethodologyDialog] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [addedColleges, setAddedColleges] = useState<Set<string>>(new Set())
  const [showGuidanceChat, setShowGuidanceChat] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<any>({
    sortBy: "matchScore",
    admissionChanceRange: [0, 100],
    matchScoreRange: [0, 100],
    fitCategories: [],
    countries: [],
    campusSettings: [],
    collegeSizes: [],
    institutionTypes: [],
    acceptanceRateRange: [0, 100],
    annualCostRange: [0, 100000],
    hasFinancialAid: null,
    showDreamColleges: false,
  })
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(!isMobile);

  const loadStudentProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()
        
        setStudentProfile(profile)
      }
    } catch (error) {
      console.error("Failed to load student profile:", error)
    }
  }

  const loadMatches = async () => {
    try {
      const result = await getStudentCollegeMatches()
      if (result.success && result.matches) {
        setMatches(result.matches)
        
        // Debug logging
        const dreamCount = result.matches.filter(match => match.is_dream_college).length
        const aiCount = result.matches.filter(match => !match.is_dream_college).length
        console.log(`📊 Loaded matches: ${dreamCount} dream colleges, ${aiCount} AI recommendations`)
        
        // Reset dream colleges filter when new data is loaded to show all recommendations
        setFilters((prev: any) => ({
          ...prev,
          showDreamColleges: false
        }))
        
        // Check which colleges are already in the user's list
        checkExistingColleges(result.matches)
      }
    } catch (error) {
      console.error("Failed to load matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingColleges = async (matches: CollegeMatch[]) => {
    try {
      const result = await getMyCollegeList().catch((err: any) => {
        console.error("getMyCollegeList failed:", err)
        return null as any
      })
      
      if (result && result.success && result.data) {
        const existingNames = new Set((result.data as any[]).map((c: any) => String(c.college_name || '').toLowerCase()))
        const alreadyAdded = matches
          .filter(match => existingNames.has(match.college_name.toLowerCase()))
          .map(match => match.id)
        
        setAddedColleges(new Set(alreadyAdded))
      }
    } catch (error) {
      console.error("Failed to check existing colleges:", error)
    }
  }

  const handleAddToList = async (match: CollegeMatch) => {
    setAdding(match.id)
    setMessage(null)
    
    console.log("Adding college to list:", match.college_name)
    console.log("Match data:", match)
    
    try {
      const collegeData = {
        college_name: match.college_name,
        college_location: match.city && match.country ? `${match.city}, ${match.country}` : match.country || "Unknown",
        college_type: match.program_type || "University",
        tuition_range: match.estimated_cost || "Not specified",
        source: "Recommended",
        notes: `Match Score: ${Math.round(match.match_score * 100)}% | Admission Chance: ${Math.round(match.admission_chance * 100)}% | ${match.justification}`,
        priority: match.fit_category === "Safety" ? 3 : match.fit_category === "Target" ? 2 : 1,
        application_status: "Considering" as const,
      }
      
      console.log("College data being sent:", collegeData)
      
      const result = await addCollegeToList(collegeData)
      
      console.log("Add to list result:", result)

      if (result.success) {
        setMessage({ type: "success", text: `✅ ${match.college_name} has been added to your college list!` })
        setAddedColleges(prev => new Set([...prev, match.id]))
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        console.error("Add to list failed:", result.error)
        setMessage({ type: "error", text: result.error || "Failed to add college to list" })
      }
    } catch (error) {
      console.error("Failed to add to list:", error)
      setMessage({ type: "error", text: "An unexpected error occurred while adding to list" })
    } finally {
      setAdding(null)
    }
  }

  const handleDeleteMatches = async () => {
    setDeleting(true)
    try {
      const result = await deleteCollegeMatches()
      if (result.success) {
        setMatches([])
      }
    } catch (error) {
      console.error("Failed to delete matches:", error)
    } finally {
      setDeleting(false)
    }
  }

  const toggleCardExpansion = (matchId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(matchId)) {
        newSet.delete(matchId)
      } else {
        newSet.add(matchId)
      }
      return newSet
    })
  }

  useEffect(() => {
    loadMatches()
    loadStudentProfile()
  }, [refreshTrigger])

  const getMatchColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800"
    if (score >= 0.6) return "bg-blue-100 text-blue-800"
    if (score >= 0.4) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Safety":
        return "bg-green-100 text-green-800 border-green-300"
      case "Target":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "Reach":
        return "bg-amber-100 text-amber-800 border-amber-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Safety":
        return <Shield className="h-4 w-4" />
      case "Target":
        return <Target className="h-4 w-4" />
      case "Reach":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <GraduationCap className="h-4 w-4" />
    }
  }

  const safetySchools = matches.filter((m) => m.fit_category === "Safety")
  const targetSchools = matches.filter((m) => m.fit_category === "Target")
  const reachSchools = matches.filter((m) => m.fit_category === "Reach")

  const getAvgAdmissionChance = (schools: CollegeMatch[]) => {
    if (schools.length === 0) return 0
    return schools.reduce((sum, school) => sum + school.admission_chance, 0) / schools.length
  }

  const filteredMatches = () => {
    let filtered = matches

    // Debug logging
    console.log(`🔍 Filtering ${matches.length} total matches`)
    console.log(`🔍 Active tab: ${activeTab}`)
    console.log(`🔍 Show dream colleges filter: ${filters.showDreamColleges}`)

    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(match => match.fit_category === activeTab)
      console.log(`🔍 After tab filter: ${filtered.length} matches`)
    }

    // Apply admission chance filter
    filtered = filtered.filter(match => {
      const chance = Math.round(match.admission_chance * 100)
      return chance >= filters.admissionChanceRange[0] && chance <= filters.admissionChanceRange[1]
    })

    // Apply match score filter
    filtered = filtered.filter(match => {
      const score = Math.round(match.match_score * 100)
      return score >= filters.matchScoreRange[0] && score <= filters.matchScoreRange[1]
    })

    // Apply fit categories filter
    if (filters.fitCategories.length > 0) {
      filtered = filtered.filter(match => filters.fitCategories.includes(match.fit_category))
    }

    // Apply countries filter
    if (filters.countries.length > 0) {
      filtered = filtered.filter(match => match.country && filters.countries.includes(match.country))
    }

    // Apply campus settings filter
    if (filters.campusSettings.length > 0) {
      filtered = filtered.filter(match => match.campus_setting && filters.campusSettings.includes(match.campus_setting))
    }

    // Apply college sizes filter
    if (filters.collegeSizes.length > 0) {
      filtered = filtered.filter(match => {
        if (!match.student_count) return false
        const size = match.student_count < 2000 ? "Small" : match.student_count < 15000 ? "Medium" : "Large"
        return filters.collegeSizes.includes(size)
      })
    }

    // Apply institution types filter
    if (filters.institutionTypes.length > 0) {
      filtered = filtered.filter(match => match.program_type && filters.institutionTypes.includes(match.program_type))
    }

    // Apply acceptance rate filter
    filtered = filtered.filter(match => {
      if (!match.acceptance_rate) return true
      const rate = Math.round(match.acceptance_rate * 100)
      return rate >= filters.acceptanceRateRange[0] && rate <= filters.acceptanceRateRange[1]
    })

    // Apply annual cost filter
    filtered = filtered.filter(match => {
      if (!match.estimated_cost && !match.tuition_annual) return true
      const costStr = match.estimated_cost || match.tuition_annual || "0"
      const cost = parseInt(costStr.replace(/[^0-9]/g, "")) || 0
      return cost >= filters.annualCostRange[0] && cost <= filters.annualCostRange[1]
    })

    // Apply financial aid filter
    if (filters.hasFinancialAid !== null) {
      // This is a simplified filter - in a real app you'd have actual financial aid data
      filtered = filtered.filter(match => {
        // For now, assume most universities have some form of financial aid
        return filters.hasFinancialAid === true
      })
    }

    // Apply dream college filter
    if (filters.showDreamColleges) {
      filtered = filtered.filter(match => match.is_dream_college === true)
      console.log(`🔍 After dream colleges filter: ${filtered.length} matches`)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "matchScore":
          return b.match_score - a.match_score
        case "admissionChance":
          return b.admission_chance - a.admission_chance
        case "admissionChanceLow":
          return a.admission_chance - b.admission_chance
        case "collegeName":
          return a.college_name.localeCompare(b.college_name)
        case "acceptanceRate":
          if (!a.acceptance_rate || !b.acceptance_rate) return 0
          return a.acceptance_rate - b.acceptance_rate
        case "studentCount":
          if (!a.student_count || !b.student_count) return 0
          return b.student_count - a.student_count
        case "annualCost":
          const costA = parseInt((a.estimated_cost || a.tuition_annual || "0").replace(/[^0-9]/g, "")) || 0
          const costB = parseInt((b.estimated_cost || b.tuition_annual || "0").replace(/[^0-9]/g, "")) || 0
          return costA - costB
        default:
          return 0
      }
    })

    console.log(`🔍 Final filtered results: ${filtered.length} matches`)
    return filtered
  }

  const generateProfileSummary = () => {
    if (!studentProfile) return null
    
    const summary = {
      academic: [] as string[],
      preferences: [] as string[],
      background: [] as string[]
    }
    
    // Academic Information
    if (studentProfile.grade_level) summary.academic.push(`Grade Level: ${studentProfile.grade_level}`)
    if (studentProfile.gpa) summary.academic.push(`GPA: ${studentProfile.gpa}`)
    if (studentProfile.sat_score) summary.academic.push(`SAT Score: ${studentProfile.sat_score}`)
    if (studentProfile.act_score) summary.academic.push(`ACT Score: ${studentProfile.act_score}`)
    if (studentProfile.grading_system) summary.academic.push(`Grading System: ${studentProfile.grading_system}`)
    if (studentProfile.preferred_majors && studentProfile.preferred_majors.length > 0) summary.academic.push(`Intended Major: ${studentProfile.preferred_majors.join(", ")}`)
    
    // College Preferences
    if (studentProfile.college_preferences?.costImportance) summary.preferences.push(`Cost Importance: ${studentProfile.college_preferences.costImportance}`)
    if (studentProfile.college_size) summary.preferences.push(`College Size: ${studentProfile.college_size}`)
    if (studentProfile.campus_setting) summary.preferences.push(`Campus Setting: ${studentProfile.campus_setting}`)
    if (studentProfile.college_preferences?.academicReputation) summary.preferences.push(`Academic Reputation: ${studentProfile.college_preferences.academicReputation}`)
    if (studentProfile.college_preferences?.socialLife) summary.preferences.push(`Social Life: ${studentProfile.college_preferences.socialLife}`)
    
    // Location Preferences
    const locationPrefs = studentProfile.preferred_countries || studentProfile.location_preferences || []
    if (locationPrefs.length > 0) summary.preferences.push(`Preferred Countries: ${locationPrefs.join(", ")}`)
    if (studentProfile.preferred_us_states && studentProfile.preferred_us_states.length > 0) summary.preferences.push(`Preferred US States: ${studentProfile.preferred_us_states.join(", ")}`)
    
    // Campus Life & Social Fit Preferences
    if (studentProfile.college_preferences?.greekLifeImportant) summary.preferences.push("Greek Life: Important")
    if (studentProfile.college_preferences?.strongAthletics) summary.preferences.push("Strong Athletics: Important")
    if (studentProfile.college_preferences?.activeSocialLife) summary.preferences.push(`Active Social Life: ${studentProfile.college_preferences.activeSocialLife}`)
    if (studentProfile.college_preferences?.varietyOfClubs) summary.preferences.push("Variety of Clubs: Important")
    if (studentProfile.college_preferences?.campusEventsAndTraditions) summary.preferences.push("Campus Events & Traditions: Important")
    if (studentProfile.college_preferences?.residentialCommunityType) summary.preferences.push(`Residential Community Type: ${studentProfile.college_preferences.residentialCommunityType}`)
    if (studentProfile.college_preferences?.nightlifeOffCampusActivities) summary.preferences.push("Nightlife/Off-Campus Activities: Important")
    if (studentProfile.college_preferences?.internationalStudentCommunity) summary.preferences.push("International Student Community: Important")
    if (studentProfile.college_preferences?.religiousLifeImportant) summary.preferences.push("Religious Life: Important")
    if (studentProfile.college_preferences?.religiousAffiliation) summary.preferences.push(`Religious Affiliation: ${studentProfile.college_preferences.religiousAffiliation}`)
    if (studentProfile.college_preferences?.lgbtqFriendlyCampus) summary.preferences.push("LGBTQ+ Friendly Campus: Important")
    if (studentProfile.college_preferences?.politicalActivism) summary.preferences.push(`Political Activism: ${studentProfile.college_preferences.politicalActivism}`)
    if (studentProfile.college_preferences?.campusSafety) summary.preferences.push(`Campus Safety: ${studentProfile.college_preferences.campusSafety}`)
    if (studentProfile.college_preferences?.weatherClimatePreference && studentProfile.college_preferences.weatherClimatePreference.length > 0) summary.preferences.push(`Weather/Climate Preference: ${studentProfile.college_preferences.weatherClimatePreference.join(", ")}`)
    
    // Academic & Career Opportunities
    if (studentProfile.college_preferences?.studyAbroadPrograms || studentProfile.college_preferences?.studyAbroadImportant) summary.preferences.push("Study Abroad: Important")
    if (studentProfile.college_preferences?.researchOpportunities || studentProfile.college_preferences?.undergraduateResearchImportant) summary.preferences.push("Undergraduate Research: Important")
    if (studentProfile.college_preferences?.internshipOpportunities || studentProfile.college_preferences?.internshipCoopImportant) summary.preferences.push("Internship/Co-op: Important")
    if (studentProfile.college_preferences?.honorsPrograms) summary.preferences.push("Honors Programs: Important")
    if (studentProfile.college_preferences?.acceleratedDegreePrograms) summary.preferences.push("Accelerated Degree Programs: Important")
    if (studentProfile.college_preferences?.robustCareerServices) summary.preferences.push("Robust Career Services: Important")
    if (studentProfile.college_preferences?.graduateEmployability) summary.preferences.push(`Graduate Employability: ${studentProfile.college_preferences.graduateEmployability}`)
    
    // Support & Community
    if (studentProfile.college_preferences?.diverseStudentBody) summary.preferences.push("Diverse Student Body: Important")
    if (studentProfile.college_preferences?.strongAlumniNetwork) summary.preferences.push("Strong Alumni Network: Important")
    if (studentProfile.college_preferences?.firstGenerationSupport) summary.preferences.push("First-Generation Support: Important")
    if (studentProfile.college_preferences?.disabilityServices) summary.preferences.push("Disability Services: Important")
    if (studentProfile.college_preferences?.lgbtqSupportServices) summary.preferences.push("LGBTQ+ Support Services: Important")
    
    // Application Process Preferences
    if (studentProfile.college_preferences?.testOptionalPolicy) summary.preferences.push("Test-Optional Policy: Important")
    if (studentProfile.college_preferences?.earlyActionDecisionOptions) summary.preferences.push("Early Action/Decision Options: Important")
    if (studentProfile.college_preferences?.needBlindAdmission) summary.preferences.push("Need-Blind Admission: Important")
    
    // Academic & Institutional Reputation
    if (studentProfile.college_preferences?.institutionalPrestige) summary.preferences.push(`Institutional Prestige: ${studentProfile.college_preferences.institutionalPrestige}`)
    
    // Other Preferences
    if (studentProfile.college_preferences?.legacyConsideration) summary.preferences.push("Legacy Consideration: Important")
    if (studentProfile.college_preferences?.demonstratedInterest) summary.preferences.push("Demonstrated Interest: Important")
    if (studentProfile.college_preferences?.otherPreferences) summary.preferences.push(`Other Preferences: ${studentProfile.college_preferences.otherPreferences}`)
    if (studentProfile.college_preferences?.otherSpecificPreferences) summary.preferences.push(`Other Specific Preferences: ${studentProfile.college_preferences.otherSpecificPreferences}`)
    
    // Background Information
    if (studentProfile.country_of_residence) summary.background.push(`Country of Residence: ${studentProfile.country_of_residence}`)
    if (studentProfile.family_income || studentProfile.familyIncome) summary.background.push(`Family Income: ${studentProfile.family_income || studentProfile.familyIncome}`)
    if (studentProfile.first_generation_student || studentProfile.firstGenerationStudent) summary.background.push("First-Generation College Student")
    if (studentProfile.financial_aid_needed || studentProfile.financialAidNeeded) summary.background.push("Financial Aid Needed")
    
    return summary
  }

  const generateDetailedMatchAnalysis = (match: CollegeMatch) => {
    if (!studentProfile) return null
    
    const analysis = {
      locationFit: [] as string[],
      academicFit: [] as string[],
      campusLifeFit: [] as string[],
      academicOpportunitiesFit: [] as string[],
      supportFit: [] as string[],
      applicationFit: [] as string[],
      backgroundFit: [] as string[]
    }
    
    // Location Preferences Match
    const locationPrefs = studentProfile.preferred_countries || studentProfile.location_preferences || []
    if (locationPrefs.length > 0 && match.country) {
      if (locationPrefs.some(pref => pref.toLowerCase().includes(match.country!.toLowerCase()) || match.country!.toLowerCase().includes(pref.toLowerCase()))) {
        analysis.locationFit.push(`Located in ${match.country}, matching your geographic preference`)
      }
    }
    
    if (studentProfile.preferred_us_states && studentProfile.preferred_us_states.length > 0 && match.country?.toLowerCase() === 'united states') {
      analysis.locationFit.push(`US location aligns with your state preferences`)
    }
    
    // Academic Fit Match
    if (studentProfile.college_size && match.student_count) {
      const sizeMatch = checkSizeMatch(studentProfile.college_size, match.student_count)
      if (sizeMatch) {
        analysis.academicFit.push(`${sizeMatch} school size (${match.student_count.toLocaleString()} students) matches your "${studentProfile.college_size}" preference`)
      }
    }
    
    if (studentProfile.campus_setting && match.campus_setting) {
      if (studentProfile.campus_setting.toLowerCase() === match.campus_setting.toLowerCase()) {
        analysis.academicFit.push(`${match.campus_setting} campus setting matches your preference`)
      }
    }
    
    // Campus Life & Social Fit Match
    if (studentProfile.college_preferences?.greekLifeImportant && match.match_reasons?.some(r => r.toLowerCase().includes('greek'))) {
      analysis.campusLifeFit.push("Greek life opportunities available")
    }
    
    if (studentProfile.college_preferences?.strongAthletics && match.match_reasons?.some(r => r.toLowerCase().includes('athletic') || r.toLowerCase().includes('sport'))) {
      analysis.campusLifeFit.push("Strong athletic programs available")
    }
    
    if (studentProfile.college_preferences?.activeSocialLife && match.match_reasons?.some(r => r.toLowerCase().includes('social') || r.toLowerCase().includes('campus life'))) {
      analysis.campusLifeFit.push("Active social life and campus activities")
    }
    
    if (studentProfile.college_preferences?.varietyOfClubs && match.match_reasons?.some(r => r.toLowerCase().includes('club') || r.toLowerCase().includes('organization'))) {
      analysis.campusLifeFit.push("Wide variety of clubs and organizations")
    }
    
    if (studentProfile.college_preferences?.internationalStudentCommunity && match.match_reasons?.some(r => r.toLowerCase().includes('international') || r.toLowerCase().includes('diverse'))) {
      analysis.campusLifeFit.push("Strong international student community")
    }
    
    if (studentProfile.college_preferences?.diverseStudentBody && match.match_reasons?.some(r => r.toLowerCase().includes('diverse') || r.toLowerCase().includes('multicultural'))) {
      analysis.campusLifeFit.push("Diverse and multicultural student body")
    }
    
    // Academic & Career Opportunities Match
    if (studentProfile.college_preferences?.studyAbroadPrograms && match.match_reasons?.some(r => r.toLowerCase().includes('study abroad') || r.toLowerCase().includes('international program'))) {
      analysis.academicOpportunitiesFit.push("Study abroad programs available")
    }
    
    if ((studentProfile.college_preferences?.researchOpportunities || studentProfile.college_preferences?.undergraduateResearchImportant) && match.match_reasons?.some(r => r.toLowerCase().includes('research'))) {
      analysis.academicOpportunitiesFit.push("Undergraduate research opportunities")
    }
    
    if ((studentProfile.college_preferences?.internshipOpportunities || studentProfile.college_preferences?.internshipCoopImportant) && match.match_reasons?.some(r => r.toLowerCase().includes('internship') || r.toLowerCase().includes('co-op') || r.toLowerCase().includes('career'))) {
      analysis.academicOpportunitiesFit.push("Internship and co-op opportunities")
    }
    
    if (studentProfile.college_preferences?.honorsPrograms && match.match_reasons?.some(r => r.toLowerCase().includes('honors'))) {
      analysis.academicOpportunitiesFit.push("Honors program available")
    }
    
    if (studentProfile.college_preferences?.robustCareerServices && match.match_reasons?.some(r => r.toLowerCase().includes('career') || r.toLowerCase().includes('employment'))) {
      analysis.academicOpportunitiesFit.push("Strong career services and support")
    }
    
    // Support & Community Match
    if (studentProfile.college_preferences?.strongAlumniNetwork && match.match_reasons?.some(r => r.toLowerCase().includes('alumni') || r.toLowerCase().includes('network'))) {
      analysis.supportFit.push("Strong alumni network for career support")
    }
    
    if (studentProfile.college_preferences?.firstGenerationSupport && (studentProfile.first_generation_student || studentProfile.firstGenerationStudent)) {
      analysis.supportFit.push("First-generation student support programs")
    }
    
    if (studentProfile.college_preferences?.lgbtqFriendlyCampus && match.match_reasons?.some(r => r.toLowerCase().includes('lgbtq') || r.toLowerCase().includes('inclusive'))) {
      analysis.supportFit.push("LGBTQ+ friendly and inclusive campus")
    }
    
    if (studentProfile.college_preferences?.disabilityServices && match.match_reasons?.some(r => r.toLowerCase().includes('disability') || r.toLowerCase().includes('accessibility'))) {
      analysis.supportFit.push("Comprehensive disability services")
    }
    
    // Application Process Match
    if (studentProfile.college_preferences?.testOptionalPolicy && match.match_reasons?.some(r => r.toLowerCase().includes('test-optional') || r.toLowerCase().includes('test optional'))) {
      analysis.applicationFit.push("Test-optional admission policy")
    }
    
    if (studentProfile.college_preferences?.needBlindAdmission && match.match_reasons?.some(r => r.toLowerCase().includes('need-blind') || r.toLowerCase().includes('financial aid'))) {
      analysis.applicationFit.push("Need-blind admission policy")
    }
    
    // Background Fit Match
    if (studentProfile.financial_aid_needed || studentProfile.financialAidNeeded) {
      if (match.match_reasons?.some(r => r.toLowerCase().includes('financial aid') || r.toLowerCase().includes('affordable') || r.toLowerCase().includes('scholarship'))) {
        analysis.backgroundFit.push("Strong financial aid opportunities")
      }
    }
    
    if (match.fit_category === "Safety" && analysis.academicFit.length === 0) {
      analysis.academicFit.push("Your academic profile exceeds typical requirements")
    }
    
    if (match.fit_category === "Target" && analysis.academicFit.length === 0) {
      analysis.academicFit.push("Your academic profile aligns well with admission standards")
    }
    
    if (match.fit_category === "Reach" && analysis.academicFit.length === 0) {
      analysis.academicFit.push("Your academic profile meets minimum requirements")
    }
    
    return analysis
  }

  const checkSizeMatch = (preference: string, studentCount: number): string | null => {
    const pref = preference.toLowerCase()
    if (pref.includes('small') && studentCount < 5000) return "Small"
    if (pref.includes('medium') && studentCount >= 5000 && studentCount <= 15000) return "Medium"
    if (pref.includes('large') && studentCount > 15000) return "Large"
    return null
  }

  const getAvailableFilterOptions = () => {
    const countries = [...new Set(matches.map(m => m.country).filter((c): c is string => Boolean(c)))].sort()
    const campusSettings = [...new Set(matches.map(m => m.campus_setting).filter((c): c is string => Boolean(c)))].sort()
    const institutionTypes = [...new Set(matches.map(m => m.program_type).filter((c): c is string => Boolean(c)))].sort()
    
    const collegeSizes = matches
      .filter(m => m.student_count)
      .map(m => {
        if (m.student_count! < 2000) return "Small"
        if (m.student_count! < 15000) return "Medium"
        return "Large"
      })
    const uniqueSizes = [...new Set(collegeSizes)].sort()

    return {
      countries,
      campusSettings,
      collegeSizes: uniqueSizes,
      institutionTypes,
    }
  }

  const generateSummaryInsights = () => {
    if (!studentProfile) return null
    
    // Handle case when no matches found but preferences exist
    if (matches.length === 0) {
      const preferredCountries = studentProfile.preferred_countries || 
                                studentProfile.location_preferences || 
                                studentProfile.college_preferences?.geographicPreference || []
      
      if (preferredCountries.length > 0) {
        return {
          insights: [],
          unmetPreferences: [{
            type: "Geographic",
            requested: preferredCountries,
            reason: "No universities were found matching your academic profile in these countries. Consider expanding your geographic preferences or adjusting your academic requirements."
          }]
        }
      }
      return null
    }

    const insights = []
    const unmetPreferences = []

    // Get all preference locations
    const preferredCountries = studentProfile.preferred_countries || 
                              studentProfile.location_preferences || 
                              studentProfile.college_preferences?.geographicPreference || []
    
    // Helper function to normalize country names for comparison
    const normalizeCountryName = (country: string | null | undefined) => {
      if (!country) return ''
      const normalized = country.toLowerCase().trim()
      // Handle common country name variations
      const countryMappings: { [key: string]: string } = {
        'usa': 'united states',
        'us': 'united states',
        'united states of america': 'united states',
        'u.s.': 'united states',
        'u.s.a': 'united states',
        'uk': 'united kingdom',
        'britain': 'united kingdom',
        'great britain': 'united kingdom',
        'england': 'united kingdom'
      }
      return countryMappings[normalized] || normalized
    }
    
    // Analyze geographic preferences
    if (preferredCountries.length > 0) {
      const recommendedCountries = [...new Set(matches.map(m => m.country).filter(Boolean))]
      const normalizedRecommendedCountries = recommendedCountries.map(normalizeCountryName)
      
      const unmetCountries = preferredCountries.filter(preferredCountry => {
        const normalizedPreferred = normalizeCountryName(preferredCountry)
        return !normalizedRecommendedCountries.some(recCountry => 
          recCountry === normalizedPreferred || 
          recCountry.includes(normalizedPreferred) ||
          normalizedPreferred.includes(recCountry)
        )
      })
      
      // Only show unmet preferences if there are actually unmet countries
      if (unmetCountries.length > 0) {
        unmetPreferences.push({
          type: "Geographic",
          requested: unmetCountries,
          reason: "These countries may have limited universities matching your academic profile, or the universities there might not align with your other preferences like intended major or academic requirements."
        })
      }

      if (recommendedCountries.length > 0) {
        insights.push(`Found ${matches.length} universities across ${recommendedCountries.length} countries: ${recommendedCountries.join(", ")}.`)
      }
    }

    // Analyze college size preferences
    const preferredSize = studentProfile.college_preferences?.collegeSize
    if (preferredSize && preferredSize !== "No Preference") {
      const matchingSizeCount = matches.filter(m => {
        const studentCount = m.student_count || 0
        if (preferredSize.includes("Small") && studentCount < 5000) return true
        if (preferredSize.includes("Medium") && studentCount >= 5000 && studentCount <= 15000) return true
        if (preferredSize.includes("Large") && studentCount > 15000) return true
        return false
      }).length
      
      if (matchingSizeCount < matches.length / 2) {
        unmetPreferences.push({
          type: "College Size",
          requested: [preferredSize],
          reason: "Your academic profile and geographic preferences may limit options in your preferred college size range."
        })
      }
    }

    // Analyze intended major
    const intendedMajor = studentProfile.intended_major || studentProfile.college_preferences?.intendedMajor
    if (intendedMajor && intendedMajor !== "Undecided") {
      insights.push(`All recommendations include strong programs in ${intendedMajor}.`)
    }

    // Analyze admission chances distribution
    const avgAdmissionChance = matches.reduce((sum, m) => sum + m.admission_chance, 0) / matches.length
    if (avgAdmissionChance > 0.7) {
      insights.push(`Strong overall admission prospects with ${Math.round(avgAdmissionChance * 100)}% average admission chance.`)
    } else if (avgAdmissionChance > 0.5) {
      insights.push(`Balanced admission prospects with ${Math.round(avgAdmissionChance * 100)}% average admission chance.`)
    } else {
      insights.push(`Competitive list with ${Math.round(avgAdmissionChance * 100)}% average admission chance - consider adding more safety schools.`)
    }

    // Analyze campus settings
    const campusSettings = [...new Set(matches.map(m => m.campus_setting).filter(Boolean))]
    if (campusSettings.length > 1) {
      insights.push(`Diverse campus environments included: ${campusSettings.join(", ")}.`)
    }

    return { insights, unmetPreferences }
  }

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-[200px] rounded-lg">
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-8">
            <div className="text-center text-slate-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Loading your college recommendations...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Success/Error Message */}
            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"} className={`${message.type === "success" ? "border-green-200 bg-green-50" : ""} mb-6`}>
                <div className="flex items-center justify-between">
                  <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>{message.text}</AlertDescription>
                  <button
                    onClick={() => setMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Alert>
            )}

            {/* Summary Panel */}
            {studentProfile && generateSummaryInsights() && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-blue-100 rounded-2xl shadow-lg border border-slate-100 p-0 overflow-hidden">
                  <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Info className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-xl tracking-tight">Recommendation Summary</h3>
                    </div>
                    {matches.length > 0 && (
                      <Button
                        variant="default"
                        size="lg"
                        onClick={() => { console.log('Get Guidance clicked'); setShowGuidanceChat(true) }}
                        className="flex-shrink-0 flex items-center gap-2 rounded-full px-6 py-2 font-semibold shadow-md bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-500 focus:ring-2 focus:ring-blue-300 transition-all"
                      >
                        <span className="text-white text-lg font-bold highlight-pulse">?</span>
                        <span className="ml-2 text-sm font-medium">Get Guidance</span>
                      </Button>
                    )}
                  </div>
                  <div className="px-6 pb-6 pt-2">
                    {(() => {
                      const summaryData = generateSummaryInsights()
                      if (!summaryData) return null
                      return (
                        <div className="space-y-6">
                          {/* Key Insights */}
                          {summaryData.insights.length > 0 && (
                            <div className="bg-white/80 rounded-xl p-5 shadow-sm border border-slate-100">
                              <h4 className="font-semibold text-slate-800 mb-2 text-base flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Key Insights</h4>
                              <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                                {summaryData.insights.map((insight, index) => (
                                  <li key={index}>{insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Student Profile Summary */}
                          {(() => {
                            const profileSummary = generateProfileSummary()
                            if (!profileSummary) return null
                            return (
                              <div className="bg-gradient-to-r from-slate-100 via-blue-50 to-slate-200 rounded-xl p-5 shadow-sm border border-slate-100 mt-6">
                                <Accordion type="single" collapsible className="w-full">
                                  <AccordionItem value="profile-summary" className="border-none">
                                    <AccordionTrigger className="hover:no-underline py-2 px-0">
                                      <div className="flex items-center gap-2 text-base font-semibold text-slate-700">
                                        <Users className="h-5 w-5 text-blue-500" />
                                        <span>Profile Summary Used by Recommendation Engine</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-3">
                                      <div className="space-y-6">
                                        {profileSummary.academic.length > 0 && (
                                          <div>
                                            <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-600" /> Academic Profile</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {profileSummary.academic.map((item, index) => (
                                                <div key={index} className="text-sm text-slate-700 bg-white rounded px-3 py-1 border border-slate-200">
                                                  {item}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {profileSummary.preferences.length > 0 && (
                                          <div>
                                            <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> College Preferences</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {profileSummary.preferences.map((item, index) => (
                                                <div key={index} className="text-sm text-slate-700 bg-white rounded px-3 py-1 border border-slate-200">
                                                  {item}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {profileSummary.background.length > 0 && (
                                          <div>
                                            <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-green-600" /> Background Information</h5>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {profileSummary.background.map((item, index) => (
                                                <div key={index} className="text-sm text-slate-700 bg-white rounded px-3 py-1 border border-slate-200">
                                                  {item}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            )
                          })()}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Filter/Sort Section (horizontal, elegant menu) */}
            <div className="w-full mb-6">
              <CollegeFiltersHorizontal
                filters={filters}
                onFiltersChange={setFilters}
                availableCountries={getAvailableFilterOptions().countries}
                availableCampusSettings={getAvailableFilterOptions().campusSettings}
                availableCollegeSizes={getAvailableFilterOptions().collegeSizes}
                availableInstitutionTypes={getAvailableFilterOptions().institutionTypes}
                totalColleges={matches.length}
                filteredCount={filteredMatches().length}
              />
            </div>

            {/* Recommendations List */}
            {matches.length === 0 ? (
              <Alert className="border-blue-200 bg-blue-50">
                <Brain className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800">
                No recommendations yet. Use the profile form above to generate personalized college matches.
              </AlertDescription>
              </Alert>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsContent value={activeTab} className="mt-0">
                  <div className="space-y-6">
                    {filteredMatches().map((match) => (
                      <Card key={match.id} className="border-0 shadow-md bg-white overflow-hidden">
                        <div className="bg-slate-700 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="font-bold text-lg sm:text-xl text-white">
                                  {match.website_url ? (
                                    <a 
                                      href={match.website_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-300 hover:text-blue-200 hover:underline flex items-center gap-2"
                                    >
                                      {match.college_name}
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  ) : (
                                    match.college_name
                                  )}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getCategoryColor(match.fit_category)} border`}>
                                    {getCategoryIcon(match.fit_category)}
                                    <span className="ml-1">{match.fit_category}</span>
                                  </Badge>
                                  {match.is_dream_college && (
                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                                      <Star className="h-3 w-3 mr-1" />
                                      Dream
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-300 mb-3">
                                {match.city && match.country && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {match.city}, {match.country}
                                  </span>
                                )}
                                {match.program_type && (
                                  <Badge variant="secondary" className="bg-slate-600 text-slate-200 border-slate-500">
                                    {match.program_type}
                                  </Badge>
                                )}
                                {match.campus_setting && (
                                  <span className="text-xs">{match.campus_setting} Campus</span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:ml-4">
                              <Button 
                                size="sm" 
                                onClick={() => handleAddToList(match)} 
                                disabled={adding === match.id || addedColleges.has(match.id)}
                                className={addedColleges.has(match.id) ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                              >
                                {adding === match.id ? (
                                  "Adding..."
                                ) : addedColleges.has(match.id) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Added to List
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add to List
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-4 sm:p-6">
                          {/* Compact Stats View */}
                          <div className="flex flex-col sm:flex-row justify-between items-stretch mb-6 p-4 bg-gradient-to-r from-blue-50 via-slate-50 to-blue-100 rounded-2xl shadow-lg gap-0 hover:shadow-xl transition-shadow duration-200">
                            <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-3xl font-extrabold text-blue-700 drop-shadow-sm">{Math.round(match.admission_chance * 100)}%</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Admission Chance</div>
                            </div>
                            <div className="hidden sm:block w-px bg-slate-200 mx-1 my-2 rounded-full" />
                            <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-3xl font-extrabold text-green-700 drop-shadow-sm">{Math.round(match.match_score * 100)}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Match Score</div>
                            </div>
                            <div className="hidden sm:block w-px bg-slate-200 mx-1 my-2 rounded-full" />
                            <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-5 w-5 text-amber-500" />
                                <span className="text-3xl font-extrabold text-amber-600 drop-shadow-sm">{match.acceptance_rate ? Math.round(match.acceptance_rate * 100) + '%' : '--'}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Acceptance Rate</div>
                            </div>
                            <div className="hidden sm:block w-px bg-slate-200 mx-1 my-2 rounded-full" />
                            <div className="flex-1 flex flex-col items-center justify-center px-2 py-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="h-5 w-5 text-slate-500" />
                                <span className="text-3xl font-extrabold text-slate-700 drop-shadow-sm">{match.student_count ? match.student_count.toLocaleString() : '--'}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Students</div>
                            </div>
                          </div>

                          {/* Expandable Content */}
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCards.has(match.id) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="space-y-6">

                          {/* Admission Chance Breakdown */}
                          <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 cursor-pointer hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 transition-colors"
                              onClick={() => {
                                const element = document.getElementById(`breakdown-${match.id}`)
                                if (element) {
                                  element.style.display = element.style.display === 'none' ? 'block' : 'none'
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-purple-100 rounded-full">
                                    <BarChart3 className="h-4 w-4 text-purple-600" />
                                  </div>
                                  <h4 className="font-semibold text-slate-800">
                                    {Math.round(match.admission_chance * 100)}% Admission Chance - How We Calculated This
                                  </h4>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-600" />
                              </div>
                            </div>
                            
                            <div id={`breakdown-${match.id}`} style={{ display: 'none' }} className="p-4 bg-white border-t border-slate-200">
                              <div className="space-y-4">
                                <p className="text-sm text-slate-700">
                                  Based on your profile analysis, here are the key factors that influenced this {Math.round(match.admission_chance * 100)}% admission probability:
                                </p>
                                
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                  {/* Academic Strength Assessment */}
                                  <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                        <GraduationCap className="h-3 w-3 text-blue-600" />
                                      </div>
                                      <span className="font-medium text-slate-800 text-sm">Academic Profile</span>
                                    </div>
                                    <div className="text-xs text-slate-700 space-y-1">
                                      {match.admission_chance >= 0.8 ? (
                                        <>
                                          <div className="flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                            <span>Your academic credentials exceed typical requirements</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                            <span>Strong match with admitted student profiles</span>
                                          </div>
                                        </>
                                      ) : match.admission_chance >= 0.5 ? (
                                        <>
                                          <div className="flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-blue-600" />
                                            <span>Your credentials align well with standards</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3 text-blue-600" />
                                            <span>Competitive within the applicant pool</span>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3 text-amber-600" />
                                            <span>Meets minimum requirements</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3 text-amber-600" />
                                            <span>Holistic factors will be key</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Competitiveness Assessment */}
                                  <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                                        <TrendingUp className="h-3 w-3 text-amber-600" />
                                      </div>
                                      <span className="font-medium text-slate-800 text-sm">Market Competition</span>
                                    </div>
                                    <div className="text-xs text-slate-700 space-y-1">
                                      {match.acceptance_rate && (
                                        <div>University acceptance rate: {Math.round(match.acceptance_rate * 100)}%</div>
                                      )}
                                      <div>
                                        {match.fit_category === "Safety" && "Less competitive for your profile"}
                                        {match.fit_category === "Target" && "Moderately competitive match"}
                                        {match.fit_category === "Reach" && "Highly competitive option"}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Geographic & Preference Factors */}
                                  <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                        <MapPin className="h-3 w-3 text-green-600" />
                                      </div>
                                      <span className="font-medium text-slate-800 text-sm">Fit Factors</span>
                                    </div>
                                    <div className="text-xs text-slate-700 space-y-1">
                                      {match.city && match.country && (
                                        <div>Located in {match.city}, {match.country}</div>
                                      )}
                                      <div>Aligns with your major and preferences</div>
                                      {match.campus_setting && (
                                        <div>{match.campus_setting} campus environment</div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Holistic Considerations */}
                                  <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Star className="h-3 w-3 text-purple-600" />
                                      </div>
                                      <span className="font-medium text-slate-800 text-sm">Additional Factors</span>
                                    </div>
                                    <div className="text-xs text-slate-700 space-y-1">
                                      <div>Extracurricular profile consideration</div>
                                      <div>Unique background factors</div>
                                      <div>Institutional priorities & diversity</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div className="text-xs text-blue-800">
                                      <span className="font-medium">Important Note:</span> This calculation considers quantifiable factors, but admission decisions also depend on application essays, recommendations, interviews, and institutional needs that can significantly impact outcomes.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Cost Information */}
                          {(match.estimated_cost || match.tuition_annual) && (
                            <div className="flex items-center gap-4 mb-4 p-3 bg-green-50 rounded-lg">
                              <span className="flex items-center gap-2 text-green-700 font-medium">
                                <DollarSign className="h-4 w-4" />
                                Annual Cost: {match.estimated_cost || match.tuition_annual}
                              </span>
                            </div>
                          )}

                          {/* Why This is a Great Match */}
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-slate-800 mb-3">Why This is a Great Match:</h4>
                            <p className="text-sm text-slate-700 mb-4 leading-relaxed">{match.justification}</p>

                            {(() => {
                              const detailedAnalysis = generateDetailedMatchAnalysis(match)
                              if (!detailedAnalysis) return null
                              
                              const sections = [
                                { title: "📍 Location Fit", items: detailedAnalysis.locationFit, color: "bg-green-50 border-green-200" },
                                { title: "🎓 Academic Fit", items: detailedAnalysis.academicFit, color: "bg-blue-50 border-blue-200" },
                                { title: "🏛️ Campus Life", items: detailedAnalysis.campusLifeFit, color: "bg-purple-50 border-purple-200" },
                                { title: "💼 Academic Opportunities", items: detailedAnalysis.academicOpportunitiesFit, color: "bg-orange-50 border-orange-200" },
                                { title: "🤝 Support & Community", items: detailedAnalysis.supportFit, color: "bg-pink-50 border-pink-200" },
                                { title: "📝 Application Process", items: detailedAnalysis.applicationFit, color: "bg-teal-50 border-teal-200" },
                                { title: "💰 Background Fit", items: detailedAnalysis.backgroundFit, color: "bg-yellow-50 border-yellow-200" }
                              ]
                              
                              const hasDetailedItems = sections.some(section => section.items.length > 0)
                              
                              return (
                                <div className="space-y-3">
                                  {hasDetailedItems && (
                                    <div className="grid gap-2">
                                      {sections.map((section, sectionIndex) => (
                                        section.items.length > 0 && (
                                          <div key={sectionIndex} className={`p-3 rounded-lg border ${section.color}`}>
                                            <h5 className="font-medium text-slate-800 text-sm mb-2">{section.title}</h5>
                                            <div className="space-y-1">
                                              {section.items.map((item, itemIndex) => (
                                                <div key={itemIndex} className="flex items-start gap-2">
                                                  <span className="text-green-600 text-xs mt-1">✓</span>
                                                  <span className="text-xs text-slate-700">{item}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  )}
                                  
                                  {match.match_reasons && match.match_reasons.length > 0 && (
                                    <div className="pt-3 border-t border-blue-200">
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
                                </div>
                              )
                            })()}
                          </div>

                          {/* Admission Requirements */}
                          {match.admission_requirements && (
                            <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg mb-4">
                              <span className="font-medium text-slate-800">Admission Requirements:</span>
                              <span className="ml-2">{match.admission_requirements}</span>
                            </div>
                          )}

                          {/* Source Links */}
                          {match.source_links && match.source_links.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-4">
                              {match.source_links.map((link, index) => (
                                <a
                                  key={index}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  View Details
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="text-xs text-slate-500 border-t pt-3">
                            Generated on {new Date(match.generated_at || Date.now()).toLocaleDateString()} at{" "}
                            {new Date(match.generated_at || Date.now()).toLocaleTimeString()}
                          </div>
                            </div>
                          </div>

                          {/* Expand/Collapse Button */}
                          <div className="flex justify-center mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCardExpansion(match.id)}
                              className="flex items-center gap-2 hover:bg-slate-50 transition-colors"
                            >
                              {expandedCards.has(match.id) ? (
                                <>
                                  <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 transition-transform" />
                                  See More Details
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* College Recommendations Guidance Chat */}
      <CollegeRecommendationsGuidanceChat
        open={showGuidanceChat}
        onOpenChange={setShowGuidanceChat}
        collegeMatches={matches}
        studentProfile={studentProfile}
      />
    </div>
  )
}
