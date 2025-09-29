"use client"

import { useState, useEffect, useCallback, useMemo, useReducer } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Edit, 
  User, 
  Brain,
  Loader2,
  HelpCircle,
  Plus,
  X,
  Info,
  CheckCircle,
  Sparkles,
  Users,
  Trophy
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { generateCollegeRecommendations } from "@/app/actions/college-matching"
import { ProfileGuidanceChat } from "@/components/profile/profile-guidance-chat"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRouter, useSearchParams } from "next/navigation"

import { OptimizedTextInput } from "@/components/profile/optimized-text-input"
import React from "react"
import { FIELD_OPTIONS } from "@/lib/gemini"
import { getAllColleges } from "@/app/actions/college-list"

interface StudentProfile {
  grade_level?: string
  gpa?: number
  sat_score?: number
  act_score?: number
  interests?: string[]
  preferred_majors?: string[]
  budget_range?: string
  location_preferences?: string[]
  country_of_residence?: string
  state_province?: string
  college_size?: string
  campus_setting?: string
  grading_system?: string
  a_level_subjects?: ALevelSubject[]
  ib_subjects?: IBSubject[]
  ib_total_points?: string
  college_preferences?: {
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
    studyAbroadImportant?: boolean
    undergraduateResearchImportant?: boolean
    internshipCoopImportant?: boolean
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
  preferred_countries?: string[]
  preferred_us_states?: string[]
  family_income?: string
  first_generation_student?: boolean
  financial_aid_needed?: boolean
  extracurricular_details?: ExtracurricularActivity[]
  other_grading_system?: string
  other_grades?: string
  class_rank?: string
  dream_colleges?: string[]; // uuid[]
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
  description: string
}

type College = {
  id: string;
  name: string;
  country: string;
  domain?: string;
};

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

const POPULAR_COUNTRIES = [
  "United Kingdom",
  "Australia", 
  "United States",
  "Canada",
  "Hong Kong",
  "New Zealand",
  "Singapore"
];

// Add a new array that combines all countries in alphabetical order
const ALL_COUNTRIES_ALPHABETICAL = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", 
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea",
  "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland",
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macau", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali",
  "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar", "Romania",
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain",
  "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", 
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort();

const MAJORS = {
  "🤔 I'm not sure - Help me explore!": "🤔 I'm not sure - Help me explore!",
  "Undecided": "Undecided",
  "STEM & Engineering": {
    "Computer Science": "Computer Science",
    "Computer Engineering": "Computer Engineering",
    "Software Engineering": "Software Engineering",
    "Data Science": "Data Science",
    "Information Technology": "Information Technology",
    "Cybersecurity": "Cybersecurity",
    "Artificial Intelligence": "Artificial Intelligence",
    "Mechanical Engineering": "Mechanical Engineering",
    "Electrical Engineering": "Electrical Engineering",
    "Civil Engineering": "Civil Engineering",
    "Chemical Engineering": "Chemical Engineering",
    "Biomedical Engineering": "Biomedical Engineering",
    "Aerospace Engineering": "Aerospace Engineering",
    "Industrial Engineering": "Industrial Engineering",
    "Environmental Engineering": "Environmental Engineering",
    "Materials Science & Engineering": "Materials Science & Engineering",
    "Nuclear Engineering": "Nuclear Engineering",
    "Petroleum Engineering": "Petroleum Engineering",
    "Mathematics": "Mathematics",
    "Applied Mathematics": "Applied Mathematics",
    "Statistics": "Statistics",
    "Actuarial Science": "Actuarial Science",
    "Physics": "Physics",
    "Chemistry": "Chemistry",
    "Biology": "Biology",
    "Biochemistry": "Biochemistry",
    "Biotechnology": "Biotechnology",
    "Neuroscience": "Neuroscience",
    "Environmental Science": "Environmental Science",
    "Geology": "Geology",
    "Astronomy": "Astronomy",
    "Astrophysics": "Astrophysics",
    "Meteorology": "Meteorology",
    "Oceanography": "Oceanography",
  },
  "Business & Economics": {
    "Business Administration": "Business Administration",
    "Finance": "Finance",
    "Accounting": "Accounting",
    "Marketing": "Marketing",
    "International Business": "International Business",
    "Entrepreneurship": "Entrepreneurship",
    "Economics": "Economics",
    "Management": "Management",
    "Supply Chain Management": "Supply Chain Management",
    "Human Resources": "Human Resources",
    "Business Analytics": "Business Analytics",
    "Real Estate": "Real Estate",
    "Hospitality Management": "Hospitality Management",
    "Sports Management": "Sports Management",
    "Public Administration": "Public Administration",
  },
  "Liberal Arts & Humanities": {
    "English": "English",
    "Literature": "Literature",
    "Creative Writing": "Creative Writing",
    "History": "History",
    "Philosophy": "Philosophy",
    "Religious Studies": "Religious Studies",
    "Classics": "Classics",
    "Linguistics": "Linguistics",
    "Comparative Literature": "Comparative Literature",
    "Art History": "Art History",
    "Music": "Music",
    "Theater Arts": "Theater Arts",
    "Film Studies": "Film Studies",
    "Dance": "Dance",
    "Cultural Studies": "Cultural Studies",
    "Gender Studies": "Gender Studies",
    "African American Studies": "African American Studies",
    "Asian Studies": "Asian Studies",
    "Latin American Studies": "Latin American Studies",
    "Middle Eastern Studies": "Middle Eastern Studies",
  },
  "Social Sciences": {
    "Psychology": "Psychology",
    "Sociology": "Sociology",
    "Anthropology": "Anthropology",
    "Political Science": "Political Science",
    "International Relations": "International Relations",
    "Criminal Justice": "Criminal Justice",
    "Social Work": "Social Work",
    "Geography": "Geography",
    "Urban Planning": "Urban Planning",
    "Public Policy": "Public Policy",
    "Criminology": "Criminology",
    "Human Development": "Human Development",
    "Family Studies": "Family Studies",
    "Communication Studies": "Communication Studies",
    "Media Studies": "Media Studies",
  },
  "Health & Medicine": {
    "Pre-Medicine": "Pre-Medicine",
    "Nursing": "Nursing",
    "Public Health": "Public Health",
    "Health Administration": "Health Administration",
    "Physical Therapy": "Physical Therapy",
    "Occupational Therapy": "Occupational Therapy",
    "Pharmacy": "Pharmacy",
    "Dentistry": "Dentistry",
    "Veterinary Science": "Veterinary Science",
    "Nutrition": "Nutrition",
    "Exercise Science": "Exercise Science",
    "Kinesiology": "Kinesiology",
    "Athletic Training": "Athletic Training",
    "Respiratory Therapy": "Respiratory Therapy",
    "Radiologic Technology": "Radiologic Technology",
    "Medical Laboratory Science": "Medical Laboratory Science",
    "Health Information Management": "Health Information Management",
  },
  "Arts & Design": {
    "Fine Arts": "Fine Arts",
    "Graphic Design": "Graphic Design",
    "Industrial Design": "Industrial Design",
    "Architecture": "Architecture",
    "Interior Design": "Interior Design",
    "Fashion Design": "Fashion Design",
    "Photography": "Photography",
    "Digital Media Arts": "Digital Media Arts",
    "Animation": "Animation",
    "Game Design": "Game Design",
    "Web Design": "Web Design",
    "Illustration": "Illustration",
    "Sculpture": "Sculpture",
    "Painting": "Painting",
    "Printmaking": "Printmaking",
    "Ceramics": "Ceramics",
    "Textile Design": "Textile Design",
  },
  "Communication & Media": {
    "Communications": "Communications",
    "Journalism": "Journalism",
    "Public Relations": "Public Relations",
    "Broadcasting": "Broadcasting",
    "Digital Media": "Digital Media",
    "Advertising": "Advertising",
    "Media Production": "Media Production",
    "Film & Video Production": "Film & Video Production",
    "Radio & Television": "Radio & Television",
    "Strategic Communication": "Strategic Communication",
    "Technical Communication": "Technical Communication",
    "Speech Communication": "Speech Communication",
  },
  "Education": {
    "Elementary Education": "Elementary Education",
    "Secondary Education": "Secondary Education",
    "Special Education": "Special Education",
    "Educational Psychology": "Educational Psychology",
    "Curriculum and Instruction": "Curriculum and Instruction",
    "Early Childhood Education": "Early Childhood Education",
    "Physical Education": "Physical Education",
    "Music Education": "Music Education",
    "Art Education": "Art Education",
    "Educational Leadership": "Educational Leadership",
    "Adult Education": "Adult Education",
    "Higher Education": "Higher Education",
  },
  "Law & Public Service": {
    "Pre-Law": "Pre-Law",
    "Public Administration": "Public Administration",
    "Public Policy": "Public Policy",
    "International Affairs": "International Affairs",
    "Criminal Justice": "Criminal Justice",
    "Legal Studies": "Legal Studies",
    "Paralegal Studies": "Paralegal Studies",
    "Homeland Security": "Homeland Security",
    "Emergency Management": "Emergency Management",
    "Fire Science": "Fire Science",
    "Military Science": "Military Science",
  },
  "Agriculture & Natural Resources": {
    "Agriculture": "Agriculture",
    "Agricultural Business": "Agricultural Business",
    "Animal Science": "Animal Science",
    "Plant Science": "Plant Science",
    "Forestry": "Forestry",
    "Environmental Management": "Environmental Management",
    "Wildlife Biology": "Wildlife Biology",
    "Fisheries & Aquaculture": "Fisheries & Aquaculture",
    "Soil Science": "Soil Science",
    "Agricultural Engineering": "Agricultural Engineering",
    "Food Science": "Food Science",
    "Horticulture": "Horticulture",
  },
  "Aviation & Transportation": {
    "Aviation": "Aviation",
    "Aeronautical Science": "Aeronautical Science",
    "Aviation Management": "Aviation Management",
    "Air Traffic Control": "Air Traffic Control",
    "Transportation Management": "Transportation Management",
    "Logistics": "Logistics",
    "Maritime Studies": "Maritime Studies",
  },
  "Other": {
    "Culinary Arts": "Culinary Arts",
    "Recreation": "Recreation",
    "Tourism Management": "Tourism Management",
    "Event Management": "Event Management",
    "Library Science": "Library Science",
    "Museum Studies": "Museum Studies",
    "Archaeology": "Archaeology",
    "Conservation Biology": "Conservation Biology",
    "Marine Biology": "Marine Biology",
    "Astrobiology": "Astrobiology",
    "Forensic Science": "Forensic Science",
    "Biotechnology": "Biotechnology",
    "Nanotechnology": "Nanotechnology",
    "Robotics": "Robotics",
    "Quantum Computing": "Quantum Computing",
  },
  "✏️ Enter a custom major": "✏️ Enter a custom major"
}

const EXTRACURRICULAR_ACTIVITIES = [
  "Student Government", "Debate Team", "Model UN", "Drama/Theater", "Music (Band/Orchestra/Choir)", "Art Club", "Creative Writing",
  "Yearbook/Newspaper", "Academic Competitions", "Science Olympiad", "Math Team", "Robotics Club", "Programming/Coding Club",
  "Environmental Club", "Volunteer Work", "Community Service", "Religious Activities", "Cultural Organizations", "Language Clubs",
  "Sports Teams", "Individual Sports", "Martial Arts", "Dance", "Outdoor Activities", "Chess Club", "Gaming Club",
  "Photography", "Film Making", "Entrepreneurship", "Part-time Job", "Internship", "Research Projects", "Tutoring Others"
]

const IB_SUBJECTS = [
  "English A: Language and Literature",
  "English A: Literature",
  "English B",
  "Spanish A: Language and Literature",
  "Spanish A: Literature",
  "Spanish B",
  "French A: Language and Literature",
  "French A: Literature", 
  "French B",
  "German A: Language and Literature",
  "German A: Literature",
  "German B",
  "Mandarin A: Language and Literature",
  "Mandarin A: Literature",
  "Mandarin B",
  "Mathematics: Analysis and Approaches",
  "Mathematics: Applications and Interpretation",
  "Physics",
  "Chemistry",
  "Biology",
  "Environmental Systems and Societies",
  "Computer Science",
  "Design Technology",
  "Economics",
  "Business Management",
  "Psychology",
  "History",
  "Geography",
  "Global Politics",
  "Philosophy",
  "World Religions",
  "Visual Arts",
  "Music",
  "Theatre",
  "Film",
  "Dance",
  "Other (specify)"
]

const A_LEVEL_SUBJECTS = [
  "Mathematics",
  "Further Mathematics",
  "Physics",
  "Chemistry", 
  "Biology",
  "Computer Science",
  "Economics",
  "Business Studies",
  "Accounting",
  "English Language",
  "English Literature",
  "History",
  "Geography",
  "Government and Politics",
  "Sociology",
  "Psychology",
  "Philosophy",
  "Religious Studies",
  "Art and Design",
  "Music",
  "Drama and Theatre Studies",
  "Media Studies",
  "French",
  "German", 
  "Spanish",
  "Italian",
  "Arabic",
  "Mandarin Chinese",
  "Japanese",
  "Latin",
  "Classical Civilisation",
  "Archaeology",
  "Anthropology",
  "Criminology",
  "Law",
  "Health and Social Care",
  "Physical Education",
  "Other (specify)"
]

// Add types for formReducer
function formReducer(state: typeof initialFormData, action: { field: string; value: any }): typeof initialFormData {
  // Special handling for dreamColleges to ensure it's always an array
  if (action.field === 'dreamColleges') {
    const newDreamColleges = Array.isArray(action.value) ? action.value : [];
    return {
      ...state,
      dreamColleges: newDreamColleges
    };
  }
  
  // Default handling for other fields
  return { ...state, [action.field]: action.value };
}

const initialFormData = {
    gradeLevel: "",
    countryOfResidence: "",
    stateProvince: "",
    intendedMajors: [] as string[],
    customMajor: "",
    gradingSystem: "",
    gpa: "",
    classRank: "",
    satScore: "",
    actScore: "",
    aLevelSubjects: [] as ALevelSubject[],
    ibSubjects: [] as IBSubject[],
    ibTotalPoints: "",
    otherGradingSystem: "",
    otherGrades: "",
    extracurricularActivities: [] as ExtracurricularActivity[],
    collegeSize: "",
    campusSetting: "",
    geographicPreference: [] as string[],
    costImportance: "",
    academicReputation: "",
    socialLife: "",
    researchOpportunities: "",
    internshipOpportunities: "",
    studyAbroadPrograms: "",
    greekLifeImportant: false,
    strongAthletics: false,
    diverseStudentBody: false,
    strongAlumniNetwork: false,
    otherPreferences: "",
    activeSocialLife: "",
    varietyOfClubs: false,
    campusEventsAndTraditions: false,
    residentialCommunityType: "",
    nightlifeOffCampusActivities: false,
    internationalStudentCommunity: false,
    religiousLifeImportant: false,
    religiousAffiliation: "",
    lgbtqFriendlyCampus: false,
    politicalActivism: "",
    campusSafety: "",
    weatherClimatePreference: [] as string[],
    studyAbroadImportant: false,
    undergraduateResearchImportant: false,
    internshipCoopImportant: false,
    honorsPrograms: false,
    acceleratedDegreePrograms: false,
    robustCareerServices: false,
    graduateEmployability: "",
    firstGenerationSupport: false,
    disabilityServices: false,
    lgbtqSupportServices: false,
    testOptionalPolicy: false,
    earlyActionDecisionOptions: false,
    needBlindAdmission: false,
    institutionalPrestige: "",
    legacyConsideration: false,
    demonstratedInterest: false,
    otherSpecificPreferences: "",
    preferredCountries: [] as string[],
    preferredUSStates: [] as string[],
    familyIncome: "",
    firstGenerationStudent: false,
    financialAidNeeded: false,
    majorDropdownOpen: false,
    majorSearchTerm: "",
    dreamColleges: [] as string[], // Explicitly type as string array
    additionalPreferences: [] as string[],
};

// Add types for DreamCollegesSection props
interface DreamCollegesSectionProps {
  collegeSearch: string;
  setCollegeSearch: (s: string) => void;
  fuzzyCollegeResults: College[];
  formData: any; // Use any to avoid 'never' type issues for dynamic fields
  dispatch: React.Dispatch<{ field: string; value: any }>;
}

const DreamCollegesSection = React.memo(function DreamCollegesSection({
  collegeSearch,
  setCollegeSearch,
  fuzzyCollegeResults,
  formData,
  dispatch
}: DreamCollegesSectionProps) {
  const [searchInput, setSearchInput] = useState("");

  // Ensure dreamColleges is always an array
  const dreamColleges = Array.isArray(formData.dreamColleges) ? formData.dreamColleges : [];

  const handleAddCollege = (college: College) => {
    console.log('=== ADD COLLEGE DEBUG ===');
    console.log('College:', college);
    console.log('College name:', college.name);
    console.log('Current formData:', formData);
    console.log('Current dreamColleges:', formData.dreamColleges);

    if (!college.name) {
      console.error('College name is missing!');
      return;
    }

    // Ensure we have the current array
    const currentColleges = Array.isArray(formData.dreamColleges) ? formData.dreamColleges : [];
    console.log('Current colleges array:', currentColleges);
    
    // Only add if not already in the list
    if (!currentColleges.includes(college.name)) {
      const newDreamColleges = [...currentColleges, college.name];
      console.log('New dream colleges array:', newDreamColleges);
      dispatch({ field: 'dreamColleges', value: newDreamColleges });
      console.log('Dispatched update');
    } else {
      console.log('College already in list');
    }
    console.log('=== END ADD COLLEGE DEBUG ===');
  }

  const handleRemoveCollege = (collegeToRemove: string) => {
    // Ensure we have the current array
    const currentColleges = Array.isArray(formData.dreamColleges) ? formData.dreamColleges : [];
    
    // Create a new array without the college to remove
    const newDreamColleges = currentColleges.filter((college: string) => college !== collegeToRemove);
    
    // Update the state with the new array
    dispatch({ field: 'dreamColleges', value: newDreamColleges });
  }

  return (
    <div className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 mb-8 sm:mb-12 overflow-visible" id="dream-colleges">
      <div className="sticky top-0 z-20 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl sm:rounded-t-2xl shadow-md">
        <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide">Dream Colleges</h3>
      </div>
      <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-6 sm:pt-8">
        <Label className="text-slate-800 font-semibold text-xs sm:text-sm uppercase tracking-wide mb-2 block">ADD YOUR DREAM COLLEGES</Label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <Input
            type="text"
            placeholder="Search for a college..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full sm:w-96 border-2 rounded-lg bg-white/80 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-3 py-2 text-sm sm:text-base"
            onClick={() => setCollegeSearch(searchInput)}
            disabled={!searchInput.trim()}
          >
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-3 py-2 text-sm sm:text-base"
            onClick={() => { setSearchInput(""); setCollegeSearch(""); }}
            disabled={!searchInput && !collegeSearch}
          >
            Clear
          </Button>
        </div>
        {/* College search results */}
        {collegeSearch && (
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white/90 shadow p-2 mb-4">
            {(!fuzzyCollegeResults || fuzzyCollegeResults.length === 0) ? (
              <div className="text-slate-500 text-sm text-center py-2">No colleges found.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(fuzzyCollegeResults || []).map((college: College) => (
                  <Button
                    key={college.id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={`rounded-full px-3 py-1 text-xs font-medium shadow ${dreamColleges.includes(college.name) ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-800'}`}
                    onClick={() => handleAddCollege(college)}
                    disabled={dreamColleges.includes(college.name)}
                  >
                    {college.name}
                    {college.domain && (
                      <span className="ml-2 text-slate-400">({college.domain})</span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Selected dream colleges */}
        <div className="flex flex-wrap gap-2 mt-2">
          {dreamColleges.length > 0 ? (
            dreamColleges.map((college: string) => (
              <div key={college} className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold shadow-sm border border-blue-200">
                {college}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCollege(college)}
                  className="ml-2 text-blue-400 hover:text-blue-600 focus:outline-none p-0 h-auto"
                  aria-label={`Remove ${college}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <span className="text-slate-400 text-sm">No dream colleges selected yet.</span>
          )}
        </div>
      </div>
    </div>
  );
});

export function ProfileClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [guidanceOpen, setGuidanceOpen] = useState(false)
  const [guidanceContext, setGuidanceContext] = useState<string>("intendedMajor")
  const [guidancePrompt, setGuidancePrompt] = useState("")
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [mandatoryFieldsDialogOpen, setMandatoryFieldsDialogOpen] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [recommendationsUpToDate, setRecommendationsUpToDate] = useState(false)
  const [lastRecommendationDate, setLastRecommendationDate] = useState<string | null>(null)
  const [formData, dispatch] = useReducer(formReducer, initialFormData)
  const [activeSection, setActiveSection] = useState('personal-info')
  const [userInteracted, setUserInteracted] = useState(false)
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Controlled input value

  console.log('Preferred Countries:', formData.preferredCountries)

  // Optimized change handlers using useCallback
  const handleCustomMajorChange = useCallback((value: string) => {
    dispatch({ field: 'customMajor', value })
  }, [])

  const handleOtherPreferencesChange = useCallback((value: string) => {
    dispatch({ field: 'otherPreferences', value })
  }, [])

  const handleOtherGradingSystemChange = useCallback((value: string) => {
    dispatch({ field: 'otherGradingSystem', value })
  }, [])

  const handleOtherGradesChange = useCallback((value: string) => {
    dispatch({ field: 'otherGrades', value })
  }, [])

  useEffect(() => {
    fetchStudentProfile()
  }, [])

  // Check if recommendations are up-to-date whenever profile changes
  useEffect(() => {
    checkRecommendationsStatus()
  }, [profile])

  // Sync form data with profile data when profile is loaded
  useEffect(() => {
    if (profile) {
      // Initialize dream colleges array from profile or empty array
      const dreamColleges = Array.isArray(profile.dream_colleges) ? profile.dream_colleges : [];
      
      // Only update if the arrays are different
      if (JSON.stringify(dreamColleges) !== JSON.stringify(formData.dreamColleges)) {
        console.log('Syncing dream colleges from profile:', dreamColleges);
        dispatch({
          field: 'dreamColleges',
          value: dreamColleges
        });
      }
    }
  }, [profile])

  // Debug: Log when dream colleges change
  useEffect(() => {
    console.log('Dream colleges in form data changed:', formData.dreamColleges)
    console.log('Profile dream_colleges from DB:', profile?.dream_colleges)
  }, [formData.dreamColleges])

  // Mark recommendations as out-of-date when form data changes
  useEffect(() => {
    if (profile && recommendationsUpToDate) {
      // Only mark as out-of-date if we have a profile loaded (not during initial load)
      setRecommendationsUpToDate(false)
    }
  }, [formData])

  // Auto-trigger recommendations if URL parameter is present
  useEffect(() => {
    if (searchParams.get('generateRecommendations') === 'true') {
      // Small delay to ensure profile is loaded first
      setTimeout(() => {
        handleGenerateRecommendations()
      }, 1000)
    }
  }, [searchParams])

  // Refresh profile when user returns to the page (e.g., from college recommendations)
  // Only refresh if the page has been unfocused for more than 30 seconds to avoid excessive refreshing
  useEffect(() => {
    let lastFocusTime = Date.now()
    let isPageVisible = !document.hidden
    
    const handleFocus = () => {
      const now = Date.now()
      // Only refresh if page was unfocused for more than 30 seconds
      if (!isPageVisible && now - lastFocusTime > 30000) {
        fetchStudentProfile()
      }
      isPageVisible = true
      lastFocusTime = now
    }
    
    const handleBlur = () => {
      isPageVisible = false
      lastFocusTime = Date.now()
    }
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageVisible = false
        lastFocusTime = Date.now()
      } else {
        handleFocus()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Only search when collegeSearch changes (not on every keystroke)
  useEffect(() => {
    if (!collegeSearch || collegeSearch.trim() === "") {
      setAllColleges([]);
      return;
    }
    let active = true;
    getAllColleges(collegeSearch).then(results => {
      if (active) setAllColleges(results);
    });
    return () => { active = false; };
  }, [collegeSearch]);

  // Scroll-based highlighting
  useEffect(() => {
    const handleScroll = () => {
      if (userInteracted) return // Don't override user clicks
      
      const scrollPosition = window.scrollY + 350 // Offset for sticky header and navigation
      
      // Find which section is currently in view
      const sections = [
        { id: 'personal-info', label: 'Personal Information', icon: User },
        { id: 'academic-profile', label: 'Academic Profile', icon: GraduationCap },
        { id: 'extracurricular', label: 'Extracurricular Activities', icon: Calendar },
        { id: 'college-preferences', label: 'College Preferences', icon: GraduationCap },
        { id: 'finances', label: 'Finances', icon: DollarSign },
        { id: 'dream-colleges', label: 'Dream Colleges', icon: Trophy },
        { id: 'generate-recommendations', label: 'Generate Recommendations', icon: Brain },
      ]
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        const element = document.getElementById(section.id)
        if (element) {
          const elementTop = element.offsetTop
          const elementBottom = elementTop + element.offsetHeight
          
          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [userInteracted])

  const fuzzyCollegeResults = allColleges || []; // Now backend filtered, with safety check

  const fetchStudentProfile = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // First check if we can get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("Auth error:", userError)
        setMessage({ 
          type: "error", 
          text: `Authentication error: ${userError.message}. Please refresh the page or log in again.`
        })
        return
      }
      if (!user) {
        console.warn("No user found - user may need to log in")
        setMessage({ 
          type: "error", 
          text: "Please log in to view your profile."
        })
        return
      }

      // Then try to get the profile
      console.log("Fetching student profile for user:", user.id)
      const { data: profiles, error: profileError } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)

      console.log("Profile query result:", { profiles, profileError })
      console.log("Profile error details:", JSON.stringify(profileError, null, 2))

      if (profileError) {
        console.error("Profile fetch error:", profileError)
        console.error("Error code:", profileError.code)
        console.error("Error message:", profileError.message)
        console.error("Error details:", profileError.details)
        console.error("Error hint:", profileError.hint)
        
        // If it's just an empty object error, treat as no profile found
        if (!profileError.message && !profileError.code) {
          console.log("Empty error object - treating as no profile found")
          setProfile(null)
          return
        }
        
        console.error("Failed to fetch profile:", profileError)
        setMessage({ 
          type: "error", 
          text: `Failed to fetch profile: ${profileError.message || profileError.code || 'Unknown error'}. Please try again.`
        })
        return
      }

      // Handle case where no profile exists yet
      if (!profiles || profiles.length === 0) {
        console.log("No existing profile found - will create on save")
        setProfile(null)
        return
      }

      // If multiple profiles exist (shouldn't happen), use the most recent one
      const profileData = profiles[0]
      setProfile(profileData)

      dispatch({
        field: 'gradeLevel',
        value: profileData.grade_level || ""
      })
      dispatch({
        field: 'countryOfResidence',
        value: profileData.country_of_residence || ""
      })
      dispatch({
        field: 'stateProvince',
        value: profileData.state_province || ""
      })
      dispatch({
        field: 'intendedMajors',
        value: profileData.preferred_majors || []
      })
      dispatch({
        field: 'gradingSystem',
        value: profileData.grading_system || ""
      })
      dispatch({
        field: 'gpa',
        value: profileData.gpa?.toString() || ""
      })
      dispatch({
        field: 'classRank',
        value: profileData.class_rank || ""
      })
      dispatch({
        field: 'satScore',
        value: profileData.sat_score?.toString() || ""
      })
      dispatch({
        field: 'actScore',
        value: profileData.act_score?.toString() || ""
      })
      dispatch({
        field: 'aLevelSubjects',
        value: profileData.a_level_subjects || []
      })
      dispatch({
        field: 'ibSubjects',
        value: profileData.ib_subjects || []
      })
      dispatch({
        field: 'ibTotalPoints',
        value: profileData.ib_total_points || ""
      })
      dispatch({
        field: 'otherGradingSystem',
        value: profileData.other_grading_system || ""
      })
      dispatch({
        field: 'otherGrades',
        value: profileData.other_grades || ""
      })
      dispatch({
        field: 'extracurricularActivities',
        value: profileData.extracurricular_details || []
      })
      dispatch({
        field: 'collegeSize',
        value: profileData.college_size || ""
      })
      dispatch({
        field: 'campusSetting',
        value: profileData.campus_setting || ""
      })
      dispatch({
        field: 'geographicPreference',
        value: []
      })
      dispatch({
        field: 'costImportance',
        value: profileData.college_preferences?.costImportance || ""
      })
      dispatch({
        field: 'academicReputation',
        value: profileData.college_preferences?.academicReputation || ""
      })
      dispatch({
        field: 'socialLife',
        value: profileData.college_preferences?.socialLife || ""
      })
      dispatch({
        field: 'researchOpportunities',
        value: profileData.college_preferences?.researchOpportunities || ""
      })
      dispatch({
        field: 'internshipOpportunities',
        value: profileData.college_preferences?.internshipOpportunities || ""
      })
      dispatch({
        field: 'studyAbroadPrograms',
        value: profileData.college_preferences?.studyAbroadPrograms || ""
      })
      dispatch({
        field: 'greekLifeImportant',
        value: profileData.college_preferences?.greekLifeImportant || false
      })
      dispatch({
        field: 'strongAthletics',
        value: profileData.college_preferences?.strongAthletics || false
      })
      dispatch({
        field: 'diverseStudentBody',
        value: profileData.college_preferences?.diverseStudentBody || false
      })
      dispatch({
        field: 'strongAlumniNetwork',
        value: profileData.college_preferences?.strongAlumniNetwork || false
      })
      dispatch({
        field: 'otherPreferences',
        value: profileData.college_preferences?.otherPreferences || ""
      })
      dispatch({
        field: 'activeSocialLife',
        value: profileData.college_preferences?.activeSocialLife || ""
      })
      dispatch({
        field: 'varietyOfClubs',
        value: profileData.college_preferences?.varietyOfClubs || false
      })
      dispatch({
        field: 'campusEventsAndTraditions',
        value: profileData.college_preferences?.campusEventsAndTraditions || false
      })
      dispatch({
        field: 'residentialCommunityType',
        value: profileData.college_preferences?.residentialCommunityType || ""
      })
      dispatch({
        field: 'nightlifeOffCampusActivities',
        value: profileData.college_preferences?.nightlifeOffCampusActivities || false
      })
      dispatch({
        field: 'internationalStudentCommunity',
        value: profileData.college_preferences?.internationalStudentCommunity || false
      })
      dispatch({
        field: 'religiousLifeImportant',
        value: profileData.college_preferences?.religiousLifeImportant || false
      })
      dispatch({
        field: 'religiousAffiliation',
        value: profileData.college_preferences?.religiousAffiliation || ""
      })
      dispatch({
        field: 'lgbtqFriendlyCampus',
        value: profileData.college_preferences?.lgbtqFriendlyCampus || false
      })
      dispatch({
        field: 'politicalActivism',
        value: profileData.college_preferences?.politicalActivism || ""
      })
      dispatch({
        field: 'campusSafety',
        value: profileData.college_preferences?.campusSafety || ""
      })
      dispatch({
        field: 'weatherClimatePreference',
        value: profileData.college_preferences?.weatherClimatePreference || []
      })
      dispatch({
        field: 'studyAbroadImportant',
        value: profileData.college_preferences?.studyAbroadImportant || false
      })
      dispatch({
        field: 'undergraduateResearchImportant',
        value: profileData.college_preferences?.undergraduateResearchImportant || false
      })
      dispatch({
        field: 'internshipCoopImportant',
        value: profileData.college_preferences?.internshipCoopImportant || false
      })
      dispatch({
        field: 'honorsPrograms',
        value: profileData.college_preferences?.honorsPrograms || false
      })
      dispatch({
        field: 'acceleratedDegreePrograms',
        value: profileData.college_preferences?.acceleratedDegreePrograms || false
      })
      dispatch({
        field: 'robustCareerServices',
        value: profileData.college_preferences?.robustCareerServices || false
      })
      dispatch({
        field: 'graduateEmployability',
        value: profileData.college_preferences?.graduateEmployability || ""
      })
      dispatch({
        field: 'firstGenerationSupport',
        value: profileData.college_preferences?.firstGenerationSupport || false
      })
      dispatch({
        field: 'disabilityServices',
        value: profileData.college_preferences?.disabilityServices || false
      })
      dispatch({
        field: 'lgbtqSupportServices',
        value: profileData.college_preferences?.lgbtqSupportServices || false
      })
      dispatch({
        field: 'testOptionalPolicy',
        value: profileData.college_preferences?.testOptionalPolicy || false
      })
      dispatch({
        field: 'earlyActionDecisionOptions',
        value: profileData.college_preferences?.earlyActionDecisionOptions || false
      })
      dispatch({
        field: 'needBlindAdmission',
        value: profileData.college_preferences?.needBlindAdmission || false
      })
      dispatch({
        field: 'institutionalPrestige',
        value: profileData.college_preferences?.institutionalPrestige || ""
      })
      dispatch({
        field: 'legacyConsideration',
        value: profileData.college_preferences?.legacyConsideration || false
      })
      dispatch({
        field: 'demonstratedInterest',
        value: profileData.college_preferences?.demonstratedInterest || false
      })
      dispatch({
        field: 'otherSpecificPreferences',
        value: profileData.college_preferences?.otherSpecificPreferences || ""
      })
      dispatch({
        field: 'preferredCountries',
        value: profileData.location_preferences || profileData.preferred_countries || []
      })
      dispatch({
        field: 'preferredUSStates',
        value: profileData.preferred_us_states || []
      })
      dispatch({
        field: 'familyIncome',
        value: profileData.family_income || ""
      })
      dispatch({
        field: 'firstGenerationStudent',
        value: profileData.first_generation_student || false
      })
      dispatch({
        field: 'financialAidNeeded',
        value: profileData.financial_aid_needed || false
      })
      dispatch({
        field: 'majorDropdownOpen',
        value: false
      })
      dispatch({
        field: 'majorSearchTerm',
        value: ""
      })
      dispatch({
        field: 'dreamColleges',
        value: profileData.dream_colleges || []
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      setMessage({ 
        type: "error", 
        text: error instanceof Error 
          ? error.message 
          : "Failed to fetch profile. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  const checkRecommendationsStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get the latest college recommendations
      const { data: recommendations } = await supabase
        .from('college_matches')
        .select('generated_at')
        .eq('student_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Get the profile's last update time
      const { data: profileData } = await supabase
        .from('student_profiles')
        .select('updated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (recommendations && profileData) {
        const recommendationTime = new Date(recommendations.generated_at)
        const profileUpdateTime = new Date(profileData.updated_at)
        
        // Recommendations are up-to-date if they were generated after the last profile update
        const upToDate = recommendationTime >= profileUpdateTime
        setRecommendationsUpToDate(upToDate)
        setLastRecommendationDate(recommendations.generated_at)
      } else {
        setRecommendationsUpToDate(false)
        setLastRecommendationDate(null)
      }
    } catch (error) {
      console.error('Error checking recommendations status:', error)
      setRecommendationsUpToDate(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error("Auth error during save:", userError)
        setMessage({ 
          type: "error", 
          text: `Authentication error: ${userError.message}. Please refresh the page or log in again.`
        })
        return
      }
      if (!user) {
        console.warn("No user found during save")
        setMessage({ 
          type: "error", 
          text: "Please log in to save your profile."
        })
        return
      }

      // First check if a profile exists
      const { data: existingProfile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      // Helper function to parse numeric values
      const parseNumericField = (value: string | undefined | null) => {
        if (!value || value.trim() === "") return null;
        const parsed = Number(value);
        return isNaN(parsed) ? null : parsed;
      }

      const profileData = {
        user_id: user.id,
        grade_level: formData.gradeLevel || null,
        country_of_residence: formData.countryOfResidence || null,
        state_province: formData.stateProvince || null,
        preferred_majors: formData.intendedMajors || [],
        grading_system: formData.gradingSystem || null,
        gpa: parseNumericField(formData.gpa),
        class_rank: formData.classRank || null,
        sat_score: parseNumericField(formData.satScore),
        act_score: parseNumericField(formData.actScore),
        a_level_subjects: formData.aLevelSubjects || [],
        ib_subjects: formData.ibSubjects || [],
        ib_total_points: formData.ibTotalPoints || null,
        other_grading_system: formData.otherGradingSystem || null,
        other_grades: formData.otherGrades || null,
        extracurricular_details: formData.extracurricularActivities || [],
        college_size: formData.collegeSize || null,
        campus_setting: formData.campusSetting || null,
        location_preferences: formData.preferredCountries || [],
        college_preferences: {
          costImportance: formData.costImportance || null,
          academicReputation: formData.academicReputation || null,
          socialLife: formData.socialLife || null,
          researchOpportunities: formData.researchOpportunities || null,
          internshipOpportunities: formData.internshipOpportunities || null,
          studyAbroadPrograms: formData.studyAbroadPrograms || null,
          greekLifeImportant: formData.greekLifeImportant || false,
          strongAthletics: formData.strongAthletics || false,
          diverseStudentBody: formData.diverseStudentBody || false,
          strongAlumniNetwork: formData.strongAlumniNetwork || false,
          otherPreferences: formData.otherPreferences || null,
          // Campus Life & Social Fit
          activeSocialLife: formData.activeSocialLife || null,
          varietyOfClubs: formData.varietyOfClubs || false,
          campusEventsAndTraditions: formData.campusEventsAndTraditions || false,
          residentialCommunityType: formData.residentialCommunityType || null,
          nightlifeOffCampusActivities: formData.nightlifeOffCampusActivities || false,
          internationalStudentCommunity: formData.internationalStudentCommunity || false,
          religiousLifeImportant: formData.religiousLifeImportant || false,
          religiousAffiliation: formData.religiousAffiliation || null,
          lgbtqFriendlyCampus: formData.lgbtqFriendlyCampus || false,
          politicalActivism: formData.politicalActivism || null,
          campusSafety: formData.campusSafety || null,
          weatherClimatePreference: formData.weatherClimatePreference || [],
          // Academic & Career Opportunities
          studyAbroadImportant: formData.studyAbroadImportant || false,
          undergraduateResearchImportant: formData.undergraduateResearchImportant || false,
          internshipCoopImportant: formData.internshipCoopImportant || false,
          honorsPrograms: formData.honorsPrograms || false,
          acceleratedDegreePrograms: formData.acceleratedDegreePrograms || false,
          robustCareerServices: formData.robustCareerServices || false,
          graduateEmployability: formData.graduateEmployability || null,
          // Support & Community
          firstGenerationSupport: formData.firstGenerationSupport || false,
          disabilityServices: formData.disabilityServices || false,
          lgbtqSupportServices: formData.lgbtqSupportServices || false,
          // Application Process Preferences
          testOptionalPolicy: formData.testOptionalPolicy || false,
          earlyActionDecisionOptions: formData.earlyActionDecisionOptions || false,
          needBlindAdmission: formData.needBlindAdmission || false,
          // Academic & Institutional Reputation
          institutionalPrestige: formData.institutionalPrestige || null,
          // Other Preferences
          legacyConsideration: formData.legacyConsideration || false,
          demonstratedInterest: formData.demonstratedInterest || false,
          otherSpecificPreferences: formData.otherSpecificPreferences || null
        },
        family_income: formData.familyIncome || null,
        first_generation_student: formData.firstGenerationStudent || false,
        financial_aid_needed: formData.financialAidNeeded || false,
        preferred_countries: formData.preferredCountries || [],
        preferred_us_states: formData.preferredUSStates || [],
        updated_at: new Date().toISOString(),
        dream_colleges: formData.dreamColleges || [],
      }

      let result;
      if (existingProfile?.id) {
        // Update existing profile
        result = await supabase
          .from("student_profiles")
          .update(profileData)
          .eq("id", existingProfile.id)
          .select()
      } else {
        // Insert new profile
        result = await supabase
          .from("student_profiles")
          .insert(profileData)
          .select()
      }

      const { data: savedProfile, error: saveError } = result
      if (saveError) {
        console.error('Supabase save error:', saveError)
        setMessage({ 
          type: "error", 
          text: `Failed to save profile: ${saveError.message}. Please try again.`
        })
        return
      }

      setProfile(savedProfile?.[0] || null)
      setMessage({ type: "success", text: "Profile saved successfully!" })
      
      // Refresh the form data with the saved profile data to ensure consistency
      if (savedProfile?.[0]) {
        const savedData = savedProfile[0]
        console.log('Profile saved, restoring dream colleges:', savedData.dream_colleges)
        // Update dream colleges in form data to match what was saved
        dispatch({
          field: 'dreamColleges',
          value: savedData.dream_colleges || []
        })
      }
      
      // Dream colleges will be synced when user generates recommendations
      
      // Check if recommendations need to be updated after profile changes
      await checkRecommendationsStatus()
    } catch (error) {
      console.error("Error saving profile:", error)
      setMessage({ 
        type: "error", 
        text: error instanceof Error 
          ? `Error saving profile: ${error.message}` 
          : "Failed to save profile. Please try again."
      })
    } finally {
      setSaving(false)
    }
  }

  const checkMandatoryFields = () => {
    const mandatoryFields = [
      { field: 'gradeLevel', label: 'Current Grade Level', value: formData.gradeLevel },
      { field: 'countryOfResidence', label: 'Country of Residence', value: formData.countryOfResidence },
      { field: 'gradingSystem', label: 'Primary Grading System', value: formData.gradingSystem },
      { field: 'intendedMajors', label: 'Intended Majors', value: formData.intendedMajors.length > 0 ? formData.intendedMajors.join(", ") : "" }
    ]

    const filledFields = mandatoryFields.filter(field => field.value && field.value.trim() !== '')
    const missingFields = mandatoryFields.filter(field => !field.value || field.value.trim() === '').map(f => f.label)

    return {
      filledCount: filledFields.length,
      missingFields: missingFields
    }
  }

  const handleGenerateRecommendations = async () => {
    console.log("=== HANDLE GENERATE RECOMMENDATIONS CLICKED ===")
    console.log("recommendationsUpToDate:", recommendationsUpToDate)
    console.log("generatingRecommendations:", generatingRecommendations)
    
    // Check mandatory fields first
    const mandatoryFieldsResult = checkMandatoryFields()
    console.log("Mandatory fields check:", mandatoryFieldsResult)
    
    if (mandatoryFieldsResult.filledCount < 3) {
      console.log("Not enough mandatory fields filled")
      setMissingFields(mandatoryFieldsResult.missingFields)
      setMandatoryFieldsDialogOpen(true)
      return
    }

    console.log("Proceeding to generate recommendations...")
    // Proceed with generating recommendations
    await generateRecommendations()
  }

    const generateRecommendations = async () => {
    console.log("=== GENERATE RECOMMENDATIONS FUNCTION CALLED ===")
    setGeneratingRecommendations(true)
    try {
      // Store dream colleges before saving to ensure they're preserved
      const currentDreamColleges = [...formData.dreamColleges]
      console.log('Current dream colleges before saving:', currentDreamColleges)
      
      console.log("About to save profile...")
      await handleSaveProfile()
      console.log("Profile save completed, now preparing recommendation data...")
      
      // Ensure dream colleges are preserved in the profile data
      const profileData = {
        gradeLevel: formData.gradeLevel,
        countryOfResidence: formData.countryOfResidence,
        stateProvince: formData.stateProvince,
        intended_majors: formData.intendedMajors,
        gradingSystem: formData.gradingSystem,
        gpa: formData.gpa ? parseFloat(formData.gpa) : undefined,
        classRank: formData.classRank,
        sat_score: formData.satScore ? parseInt(formData.satScore) : undefined,
        act_score: formData.actScore ? parseInt(formData.actScore) : undefined,
        aLevelSubjects: formData.aLevelSubjects,
        ibSubjects: formData.ibSubjects,
        ibScore: formData.ibTotalPoints,
        extracurricularActivities: formData.extracurricularActivities,
        collegeSize: formData.collegeSize,
        campusSetting: formData.campusSetting,
        geographicPreference: formData.geographicPreference,
        budget_range: formData.costImportance,
        studyAbroadPrograms: formData.studyAbroadPrograms,
        researchOpportunities: formData.researchOpportunities,
        internshipOpportunities: formData.internshipOpportunities,
        greekLifeImportant: formData.greekLifeImportant,
        strongAthletics: formData.strongAthletics,
        diverseStudentBody: formData.diverseStudentBody,
        strongAlumniNetwork: formData.strongAlumniNetwork,
        // Campus Life & Social Fit
        activeSocialLife: formData.activeSocialLife,
        varietyOfClubs: formData.varietyOfClubs,
        campusEventsAndTraditions: formData.campusEventsAndTraditions,
        residentialCommunityType: formData.residentialCommunityType,
        nightlifeOffCampusActivities: formData.nightlifeOffCampusActivities,
        internationalStudentCommunity: formData.internationalStudentCommunity,
        religiousLifeImportant: formData.religiousLifeImportant,
        religiousAffiliation: formData.religiousAffiliation,
        lgbtqFriendlyCampus: formData.lgbtqFriendlyCampus,
        politicalActivism: formData.politicalActivism,
        campusSafety: formData.campusSafety,
        weatherClimatePreference: formData.weatherClimatePreference,
        // Academic & Career Opportunities
        studyAbroadImportant: formData.studyAbroadImportant,
        undergraduateResearchImportant: formData.undergraduateResearchImportant,
        internshipCoopImportant: formData.internshipCoopImportant,
        honorsPrograms: formData.honorsPrograms,
        acceleratedDegreePrograms: formData.acceleratedDegreePrograms,
        robustCareerServices: formData.robustCareerServices,
        graduateEmployability: formData.graduateEmployability,
        // Support & Community
        firstGenerationSupport: formData.firstGenerationSupport,
        disabilityServices: formData.disabilityServices,
        lgbtqSupportServices: formData.lgbtqSupportServices,
        // Application Process Preferences
        testOptionalPolicy: formData.testOptionalPolicy,
        earlyActionDecisionOptions: formData.earlyActionDecisionOptions,
        needBlindAdmission: formData.needBlindAdmission,
        // Academic & Institutional Reputation
        institutionalPrestige: formData.institutionalPrestige,
        // Other Preferences
        legacyConsideration: formData.legacyConsideration,
        demonstratedInterest: formData.demonstratedInterest,
        otherSpecificPreferences: formData.otherSpecificPreferences,
        preferred_countries: formData.preferredCountries,
        preferred_us_states: formData.preferredUSStates,
        familyIncome: formData.familyIncome,
        firstGenerationStudent: formData.firstGenerationStudent,
        financialAidNeeded: formData.financialAidNeeded,
        dreamColleges: currentDreamColleges, // Use the preserved dream colleges
      }

      // Get the current user's ID
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage({ 
          type: "error", 
          text: "Please log in to generate recommendations."
        })
        return
      }

      console.log("About to call generateCollegeRecommendations with user ID:", user.id)
      console.log("Profile data being sent:", JSON.stringify(profileData, null, 2))
      const result = await generateCollegeRecommendations(user.id, profileData)
      console.log("generateCollegeRecommendations result:", result)
      if (result.success) {
        setMessage({ type: "success", text: "College recommendations generated successfully! Redirecting..." })
        // Update the recommendations status
        setRecommendationsUpToDate(true)
        setLastRecommendationDate(new Date().toISOString())
        // Navigate to college recommendations page using router (client-side navigation)
        setTimeout(() => {
          router.push('/college-recommendations')
        }, 1500)
      } else {
        // Check if it's a service unavailable error
        if (result.error?.includes('high demand') || result.error?.includes('temporarily unavailable')) {
          setMessage({ 
            type: "error", 
            text: "🚨 The AI service is currently experiencing high demand and is temporarily unavailable. Please try again in a few minutes. We apologize for the inconvenience." 
          })
        } else {
          setMessage({ type: "error", text: result.error || "Failed to generate recommendations. Please try again." })
        }
      }
    } catch (error) {
      console.error("Error generating recommendations:", error)
      setMessage({ type: "error", text: "Failed to generate recommendations. Please try again." })
    } finally {
      setGeneratingRecommendations(false)
    }
  }

  const handleFillMissingFields = () => {
    setMandatoryFieldsDialogOpen(false)
    // Scroll to the first missing field or just scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContinueAnyway = () => {
    setMandatoryFieldsDialogOpen(false)
    generateRecommendations()
  }

  type ArrayFields = 'preferredUSStates' | 'weatherClimatePreference' | 'intendedMajors' | 'preferredCountries' | 'dreamColleges';
  
  const handleArrayToggle = (field: ArrayFields, value: string) => {
    dispatch({ field, value })
  }

  const addExtracurricularActivity = () => {
    dispatch({ field: 'extracurricularActivities', value: [...formData.extracurricularActivities, { activity: "", tier: "4", description: "" }] })
  }

  const removeExtracurricularActivity = (index: number) => {
    dispatch({ field: 'extracurricularActivities', value: formData.extracurricularActivities.filter((_, i) => i !== index) })
  }

  const updateExtracurricularActivity = (index: number, field: keyof ExtracurricularActivity, value: string) => {
    dispatch({ field: 'extracurricularActivities', value: formData.extracurricularActivities.map((activity: ExtracurricularActivity, i: number) =>
        i === index ? { ...activity, [field]: value } : activity
    ) })
  }

  // A-Level subject management functions
  const addALevelSubject = () => {
    dispatch({ field: 'aLevelSubjects', value: [...formData.aLevelSubjects, { subject: "", grade: "" }] })
  }

  const removeALevelSubject = (index: number) => {
    dispatch({ field: 'aLevelSubjects', value: formData.aLevelSubjects.filter((_, i) => i !== index) })
  }

  const updateALevelSubject = (index: number, field: keyof ALevelSubject, value: string) => {
    dispatch({ field: 'aLevelSubjects', value: formData.aLevelSubjects.map((subject: ALevelSubject, i: number) =>
        i === index ? { ...subject, [field]: value } : subject
    ) })
  }

  // IB subject management functions
  const addIBSubject = () => {
    dispatch({ field: 'ibSubjects', value: [...formData.ibSubjects, { subject: "", level: "SL", grade: "" }] })
  }

  const removeIBSubject = (index: number) => {
    dispatch({ field: 'ibSubjects', value: formData.ibSubjects.filter((_, i) => i !== index) })
  }

  const updateIBSubject = (index: number, field: keyof IBSubject, value: string) => {
    dispatch({ field: 'ibSubjects', value: formData.ibSubjects.map((subject: IBSubject, i: number) =>
        i === index ? { ...subject, [field]: value } : subject
    ) })
  }

  // Calculate total IB score
  const calculateIBTotal = () => {
    const subjectTotal = formData.ibSubjects.reduce((total: number, subject: IBSubject) => {
      const score = parseInt(subject.grade) || 0
      return total + score
    }, 0)
    return subjectTotal
  }

  const majorOptions = useMemo(() => {
    const options: React.ReactElement[] = []
    
    Object.entries(MAJORS).forEach(([category, majors]) => {
      if (typeof majors === "string") {
        options.push(
          <SelectItem key={majors} value={majors}>
            {majors}
          </SelectItem>
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
          </SelectItem>
        )
        Object.entries(majors).forEach(([major, value]) => {
          options.push(
            <SelectItem key={value} value={value} className="pl-6">
        {major}
      </SelectItem>
          )
        })
      }
    })
    
    return options
  }, [])

  const renderMajorOptions = () => majorOptions

  // Helper function to get all major values as a flat array
  const getAllMajorValues = useMemo(() => {
    const values: string[] = []
    
    Object.entries(MAJORS).forEach(([category, majors]) => {
      if (typeof majors === "string") {
        values.push(majors)
      } else {
        Object.values(majors).forEach(value => {
          values.push(value)
        })
      }
    })
    
    return values
  }, [])

  // Handle major selection/deselection
  const handleMajorToggle = (major: string) => {
    dispatch({ field: 'intendedMajors', value: formData.intendedMajors.includes(major) ? formData.intendedMajors.filter(m => m !== major) : [...formData.intendedMajors, major] })
    
    // Clear search term after selection
    dispatch({ field: 'majorSearchTerm', value: "" })
  }

  // Get display text for selected majors
  const getSelectedMajorsDisplay = () => {
    if (formData.intendedMajors.length === 0) {
      return "Select your intended majors"
    }
    if (formData.intendedMajors.length === 1) {
      return formData.intendedMajors[0]
    }
    return `${formData.intendedMajors.length} majors selected`
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.major-dropdown')) {
        dispatch({ field: 'majorDropdownOpen', value: false })
        dispatch({ field: 'majorSearchTerm', value: "" })
      }
    }

    if (formData.majorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [formData.majorDropdownOpen])

  const TierInfoDialog = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="border-0 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-800">Extracurricular Activity Tiers</DialogTitle>
          <DialogDescription className="text-slate-600">
            Understanding how colleges view your activities
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-700">Tier 1 (Extremely Rare)</h4>
            <p className="text-sm text-green-600 mt-1">
              National/international recognition, extremely selective programs
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-700">Tier 2 (Highly Uncommon)</h4>
            <p className="text-sm text-blue-600 mt-1">
              State-level recognition, leadership in competitive programs
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-700">Tier 3 (Uncommon)</h4>
            <p className="text-sm text-yellow-600 mt-1">
              Regional recognition, significant time commitment
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-700">Tier 4 (Common)</h4>
            <p className="text-sm text-slate-600 mt-1">
              School-level participation, regular involvement
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Update the function to handle country removal only for preferred countries
  const handleRemoveCountry = (index: number) => {
    dispatch({ field: 'preferredCountries', value: formData.preferredCountries.filter((_, i) => i !== index) })
      // Only clear US states if the removed country is United States
    if (formData.preferredCountries[index] === "United States" && 
        !formData.preferredCountries.some((c, i) => c === "United States" && i !== index)) {
      dispatch({ field: 'preferredUSStates', value: [] })
    }
  }

  // Update the function to handle country change
  const handleCountryChange = (value: string, index: number) => {
    dispatch({ field: 'preferredCountries', value: formData.preferredCountries.map((c, i) => i === index ? value : c) })
      // Only clear US states if no other United States selection exists
    if (formData.preferredCountries[index] === "United States" && value !== "United States" && 
        !formData.preferredCountries.some((c, i) => c === "United States" && i !== index)) {
      dispatch({ field: 'preferredUSStates', value: [] })
      }
  }

  // Add a function to add new country
  const handleAddCountry = () => {
    dispatch({ field: 'preferredCountries', value: [...formData.preferredCountries, ""] })
  }

  // Helper function to get selected additional preferences as an array
  const getSelectedAdditionalPreferences = useMemo((): string[] => {
    const selected: string[] = [];
    
    // Campus Life & Social Fit
    if (formData.greekLifeImportant) selected.push("Greek Life Important");
    if (formData.strongAthletics) selected.push("Strong Athletics Program");
    if (formData.activeSocialLife) selected.push(`Active Social Life: ${formData.activeSocialLife}`);
    if (formData.varietyOfClubs) selected.push("Variety of Clubs/Organizations");
    if (formData.campusEventsAndTraditions) selected.push("Campus Events & Traditions");
    if (formData.residentialCommunityType) selected.push(`Residential Community Type: ${formData.residentialCommunityType}`);
    if (formData.nightlifeOffCampusActivities) selected.push("Nightlife/Off-Campus Activities");
    if (formData.internationalStudentCommunity) selected.push("International Student Community");
    if (formData.religiousLifeImportant) selected.push("Religious/Spiritual Life");
    if (formData.religiousAffiliation) selected.push(`Religious Affiliation: ${formData.religiousAffiliation}`);
    if (formData.lgbtqFriendlyCampus) selected.push("LGBTQ+ Friendly Campus");
    if (formData.politicalActivism) selected.push(`Political Activism: ${formData.politicalActivism}`);
    if (formData.campusSafety) selected.push(`Campus Safety: ${formData.campusSafety}`);
    if (formData.weatherClimatePreference && formData.weatherClimatePreference.length > 0) {
      selected.push(`Weather/Climate Preferences: ${formData.weatherClimatePreference.join(", ")}`);
    }
    
    // Academic & Career Opportunities
    if (formData.studyAbroadPrograms === "Important" || formData.studyAbroadImportant) selected.push("Study Abroad Programs");
    if (formData.researchOpportunities === "Important" || formData.undergraduateResearchImportant) selected.push("Undergraduate Research");
    if (formData.internshipOpportunities === "Important" || formData.internshipCoopImportant) selected.push("Internship/Co-op Opportunities");
    if (formData.honorsPrograms) selected.push("Honors Programs");
    if (formData.acceleratedDegreePrograms) selected.push("Accelerated Degree Programs");
    if (formData.robustCareerServices) selected.push("Robust Career Services");
    if (formData.graduateEmployability) selected.push(`Graduate Employability: ${formData.graduateEmployability}`);
    
    // Support & Community
    if (formData.diverseStudentBody) selected.push("Diverse Student Body");
    if (formData.strongAlumniNetwork) selected.push("Strong Alumni Network");
    if (formData.firstGenerationSupport) selected.push("First-Generation Student Support");
    if (formData.disabilityServices) selected.push("Disability Services");
    if (formData.lgbtqSupportServices) selected.push("LGBTQ+ Support Services");
    
    // Application Process & Reputation
    if (formData.testOptionalPolicy) selected.push("Test-Optional Policy");
    if (formData.earlyActionDecisionOptions) selected.push("Early Action/Decision Options");
    if (formData.needBlindAdmission) selected.push("Need-Blind Admission");
    if (formData.institutionalPrestige) selected.push(`Institutional Prestige: ${formData.institutionalPrestige}`);
    if (formData.legacyConsideration) selected.push("Legacy Consideration");
    if (formData.demonstratedInterest) selected.push("Demonstrated Interest");
    
    return selected;
  }, [
    formData.greekLifeImportant,
    formData.strongAthletics,
    formData.activeSocialLife,
    formData.varietyOfClubs,
    formData.campusEventsAndTraditions,
    formData.residentialCommunityType,
    formData.nightlifeOffCampusActivities,
    formData.internationalStudentCommunity,
    formData.religiousLifeImportant,
    formData.religiousAffiliation,
    formData.lgbtqFriendlyCampus,
    formData.politicalActivism,
    formData.campusSafety,
    formData.weatherClimatePreference,
    formData.studyAbroadPrograms,
    formData.studyAbroadImportant,
    formData.researchOpportunities,
    formData.undergraduateResearchImportant,
    formData.internshipOpportunities,
    formData.internshipCoopImportant,
    formData.honorsPrograms,
    formData.acceleratedDegreePrograms,
    formData.robustCareerServices,
    formData.graduateEmployability,
    formData.diverseStudentBody,
    formData.strongAlumniNetwork,
    formData.firstGenerationSupport,
    formData.disabilityServices,
    formData.lgbtqSupportServices,
    formData.testOptionalPolicy,
    formData.earlyActionDecisionOptions,
    formData.needBlindAdmission,
    formData.institutionalPrestige,
    formData.legacyConsideration,
    formData.demonstratedInterest
  ]);

  const getGuidanceCurrentValue = (fieldName: string): string | string[] | boolean | null => {
    switch (fieldName) {
      case 'additionalPreferences':
        return getSelectedAdditionalPreferences;
      case 'aLevelSubjects':
      case 'ibSubjects':
      case 'extracurricularActivities':
        return null; // These are complex types not directly handled by the chat value.
      default:
        const value = formData[fieldName as keyof typeof formData];
        if (typeof value === 'string' || typeof value === 'boolean' || Array.isArray(value)) {
          return value as string | string[] | boolean;
        }
        return null;
    }
  };

  const renderGuidanceButton = (fieldName: string, customPrompt?: string, tooltipText?: string, showLabel: boolean = false) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? "sm" : "icon"}
          className={`flex-shrink-0 relative group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 self-start mt-0.5 guidance-glow guidance-bounce ${
            showLabel 
              ? "h-10 px-4 text-white font-medium rounded-lg" 
              : "h-8 w-8 min-w-8 rounded-full"
          }`}
          onClick={() => {
            setGuidanceOpen(true);
            setGuidanceContext(fieldName);
            if (customPrompt) {
              setGuidancePrompt(customPrompt);
            }
          }}
        >
          {/* Question mark with highlight pulse */}
          <span className="text-white text-lg font-bold mx-auto highlight-pulse">?</span>
          {showLabel && <span className="ml-2 text-sm font-medium">Get Guidance</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText || "Click for guidance on this field"}</p>
      </TooltipContent>
    </Tooltip>
  );

  const isStringField = (field: keyof typeof formData): boolean => {
    return [
      "gradeLevel",
      "countryOfResidence",
      "stateProvince",
      "intendedMajors",
      "customMajor",
      "gradingSystem",
      "gpa",
      "classRank",
      "satScore",
      "actScore",
      "ibTotalPoints",
      "otherGradingSystem",
      "otherGrades",
      "collegeSize",
      "campusSetting",
      "costImportance",
      "academicReputation",
      "socialLife",
      "researchOpportunities",
      "internshipOpportunities",
      "studyAbroadPrograms",
      "familyIncome",
      "otherPreferences"
    ].includes(field)
  }

  const handleFieldChange = (field: keyof typeof formData, value: string | boolean) => {
    dispatch({ field, value })
    
    // Clear the field from missing fields if it's being filled
    if (value && typeof value === 'string' && value.trim() !== '') {
      const fieldLabelMap = {
        gradeLevel: 'Current Grade Level',
        countryOfResidence: 'Country of Residence',
        gradingSystem: 'Primary Grading System',
        intendedMajors: 'Intended Majors'
      };
      
      const fieldLabel = fieldLabelMap[field as keyof typeof fieldLabelMap];
      if (fieldLabel && missingFields.includes(fieldLabel)) {
        dispatch({ field: 'missingFields', value: missingFields.filter(f => f !== fieldLabel) })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const sections = [
    { id: 'personal-info', label: 'Personal Information', icon: User },
    { id: 'academic-profile', label: 'Academic Profile', icon: GraduationCap },
    { id: 'extracurricular', label: 'Extracurricular Activities', icon: Calendar },
    { id: 'college-preferences', label: 'College Preferences', icon: GraduationCap },
    { id: 'finances', label: 'Finances', icon: DollarSign },
    { id: 'dream-colleges', label: 'Dream Colleges', icon: Trophy },
    { id: 'generate-recommendations', label: 'Generate Recommendations', icon: Brain },
  ]

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    setUserInteracted(true)
    const element = document.getElementById(sectionId)
    if (element) {
      const elementPosition = element.offsetTop
      const offsetPosition = elementPosition - 300 // Account for sticky header and navigation
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    
    // Reset user interaction flag after scroll animation completes
    setTimeout(() => {
      setUserInteracted(false)
    }, 1000)
  }



  // Helper to build a dynamic list of fields and options for the general guidance prompt
  function buildProfileFieldsOptionsString() {
    const fields = [
      { label: 'Grade Level', key: 'gradeLevel', options: FIELD_OPTIONS.gradeLevel ? Object.keys(FIELD_OPTIONS.gradeLevel) : [] },
      { label: 'Intended Majors', key: 'intendedMajors', options: (() => {
        // Flatten MAJORS object
        const majors: string[] = [];
        Object.entries(MAJORS).forEach(([cat, val]) => {
          if (typeof val === 'string') majors.push(val);
          else majors.push(...Object.keys(val));
        });
        return majors;
      })() },
      { label: 'College Size', key: 'collegeSize', options: FIELD_OPTIONS.collegeSize ? Object.keys(FIELD_OPTIONS.collegeSize) : [] },
      { label: 'Campus Setting', key: 'campusSetting', options: FIELD_OPTIONS.campusSetting ? Object.keys(FIELD_OPTIONS.campusSetting) : [] },
      { label: 'Country of Residence', key: 'countryOfResidence', options: [] },
      { label: 'Geographic Preferences', key: 'geographicPreference', options: FIELD_OPTIONS.geographicPreference || [] },
      { label: 'Cost Importance', key: 'costImportance', options: FIELD_OPTIONS.costImportance ? Object.keys(FIELD_OPTIONS.costImportance) : [] },
      { label: 'Academic Reputation', key: 'academicReputation', options: FIELD_OPTIONS.academicReputation ? Object.keys(FIELD_OPTIONS.academicReputation) : [] },
      { label: 'Financial Aid Needed', key: 'financialAidNeeded', options: FIELD_OPTIONS.financialAidNeeded ? Object.keys(FIELD_OPTIONS.financialAidNeeded) : [] },
      { label: 'Additional Preferences', key: 'additionalPreferences', options: FIELD_OPTIONS.additionalPreferences || [] },
      // Add more fields as needed
    ];
    return fields.map(f => `- ${f.label}${f.options.length ? ': [' + f.options.join(', ') + ']' : ''}`).join('\n');
  }

  // Standard region mapping utility
  const COUNTRY_TO_REGION: Record<string, string> = {
    // Americas
    "United States": "Americas", "Canada": "Americas", "Brazil": "Americas", "Mexico": "Americas", "Argentina": "Americas", "Chile": "Americas", "Colombia": "Americas", "Peru": "Americas", "Ecuador": "Americas", "Uruguay": "Americas", "Venezuela": "Americas", "Bolivia": "Americas", "Paraguay": "Americas", "Guatemala": "Americas", "Costa Rica": "Americas", "Panama": "Americas", "Cuba": "Americas", "Jamaica": "Americas", "Trinidad and Tobago": "Americas", "Barbados": "Americas", "Bahamas": "Americas", "Dominican Republic": "Americas", "Puerto Rico": "Americas",
    // Europe
    "United Kingdom": "Europe", "Germany": "Europe", "France": "Europe", "Italy": "Europe", "Spain": "Europe", "Netherlands": "Europe", "Switzerland": "Europe", "Sweden": "Europe", "Belgium": "Europe", "Denmark": "Europe", "Finland": "Europe", "Norway": "Europe", "Ireland": "Europe", "Austria": "Europe", "Poland": "Europe", "Portugal": "Europe", "Czech Republic": "Europe", "Hungary": "Europe", "Greece": "Europe", "Russia": "Europe", "Ukraine": "Europe", "Romania": "Europe", "Bulgaria": "Europe", "Serbia": "Europe", "Croatia": "Europe", "Slovakia": "Europe", "Slovenia": "Europe", "Estonia": "Europe", "Latvia": "Europe", "Lithuania": "Europe", "Luxembourg": "Europe", "Iceland": "Europe", "Turkey": "Europe",
    // Asia
    "China": "Asia", "Japan": "Asia", "South Korea": "Asia", "India": "Asia", "Singapore": "Asia", "Hong Kong": "Asia", "Taiwan": "Asia", "Malaysia": "Asia", "Thailand": "Asia", "Indonesia": "Asia", "Philippines": "Asia", "Vietnam": "Asia", "Pakistan": "Asia", "Bangladesh": "Asia", "Sri Lanka": "Asia", "Nepal": "Asia", "Kazakhstan": "Asia", "Uzbekistan": "Asia", "Kyrgyzstan": "Asia", "Mongolia": "Asia", "Cambodia": "Asia", "Laos": "Asia", "Myanmar": "Asia", "Brunei": "Asia", "Macau": "Asia",
    // Africa
    "South Africa": "Africa", "Egypt": "Africa", "Nigeria": "Africa", "Kenya": "Africa", "Ghana": "Africa", "Morocco": "Africa", "Ethiopia": "Africa", "Uganda": "Africa", "Tanzania": "Africa", "Algeria": "Africa", "Tunisia": "Africa", "Zimbabwe": "Africa", "Botswana": "Africa", "Namibia": "Africa", "Senegal": "Africa", "Ivory Coast": "Africa", "Cameroon": "Africa", "Zambia": "Africa", "Mozambique": "Africa", "Rwanda": "Africa", "Sudan": "Africa", "Libya": "Africa", "Angola": "Africa", "Malawi": "Africa", "Burkina Faso": "Africa", "Mali": "Africa", "Niger": "Africa", "Benin": "Africa", "Madagascar": "Africa", "Mauritius": "Africa", "Seychelles": "Africa", "Gabon": "Africa", "Congo": "Africa", "Democratic Republic of the Congo": "Africa", "Togo": "Africa", "Guinea": "Africa", "Chad": "Africa", "Somalia": "Africa", "Sierra Leone": "Africa", "Gambia": "Africa", "Lesotho": "Africa", "Swaziland": "Africa", "Central African Republic": "Africa", "Liberia": "Africa", "Djibouti": "Africa", "Eritrea": "Africa", "Equatorial Guinea": "Africa", "Comoros": "Africa", "Sao Tome and Principe": "Africa", "Cape Verde": "Africa",
    // Oceania
    "Australia": "Oceania", "New Zealand": "Oceania", "Fiji": "Oceania", "Papua New Guinea": "Oceania", "Samoa": "Oceania", "Tonga": "Oceania", "Vanuatu": "Oceania", "Solomon Islands": "Oceania", "Micronesia": "Oceania", "Palau": "Oceania", "Kiribati": "Oceania", "Tuvalu": "Oceania", "Marshall Islands": "Oceania", "Nauru": "Oceania",
    // Middle East
    "Israel": "Middle East", "Saudi Arabia": "Middle East", "United Arab Emirates": "Middle East", "Qatar": "Middle East", "Kuwait": "Middle East", "Oman": "Middle East", "Bahrain": "Middle East", "Jordan": "Middle East", "Lebanon": "Middle East", "Iran": "Middle East", "Iraq": "Middle East", "Syria": "Middle East", "Yemen": "Middle East"
  };

  function getRegion(country: string): string {
    return COUNTRY_TO_REGION[country] || 'Other';
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 sm:space-y-8">
        <div className="max-w-none mx-auto space-y-6 sm:space-y-8">
          {/* Header Section - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">My Profile</h2>
              <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
                Complete your academic profile to get personalized college recommendations
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Save Profile</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Guidance Assistant Banner - Responsive */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg guidance-banner-pulse">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start lg:items-center gap-3 sm:gap-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 sm:p-3 rounded-full shadow-lg flex-shrink-0">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Virtual Coach Profile Guidance</h3>
                  <p className="text-slate-600 text-sm sm:text-base">
                    Need help with any field? Click the <span className="font-semibold text-blue-600">"Get Guidance"</span> buttons throughout the form for personalized advice from our virtual coach.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setGuidanceOpen(true);
                  setGuidanceContext("general");
                  const fieldsOptions = buildProfileFieldsOptionsString();
                  setGuidancePrompt(
                    `I'm filling out the My Profile section for my college application. Please give me concise, actionable tips for each of the following fields, focusing only on these fields and their options. If I've already filled out any fields, give advice in context; otherwise, provide general guidance for that field.\n\nThe fields and their options are:\n${fieldsOptions}\n\nOnly give advice for these fields and only suggest from the options listed.`
                  );
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm sm:text-base w-full lg:w-auto"
              >
                <Brain className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Start General Guidance</span>
                <span className="sm:hidden">Get Guidance</span>
              </Button>
            </div>
          </div>

          {message && (
            <Alert 
              variant={message.type === "error" ? "destructive" : "default"}
              className={message.type === "success" ? "border-green-200 bg-green-50" : ""}
            >
              {message.type === "success" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertDescription />}
              <AlertDescription className={message.type === "success" ? "text-green-800" : ""}>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Elegant Sticky Navigation Menu */}
          <div className="sticky top-[120px] sm:top-[140px] lg:top-[200px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg mb-6 sm:mb-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
              {/* Desktop Navigation - Horizontal Scrollable */}
              <div className="hidden md:flex items-center justify-center gap-4 lg:gap-6">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant="ghost"
                    onClick={() => scrollToSection(section.id)}
                    className={`relative flex items-center justify-center h-16 px-4 py-3 rounded-xl font-medium transition-all duration-300 w-32 max-w-32 group ${
                      activeSection === section.id
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg scale-105'
                        : 'bg-slate-50 hover:bg-gradient-to-br hover:from-slate-700 hover:to-slate-800 hover:text-white border border-slate-200 hover:border-slate-700 text-slate-700 shadow-sm hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    <span className="text-sm text-center font-medium leading-tight px-2 whitespace-normal break-words" style={{ wordBreak: 'break-word' }}>{section.label}</span>
                    {activeSection === section.id && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full"></div>
                    )}
                  </Button>
                ))}
              </div>

              {/* Mobile Navigation - Horizontal Scrollable */}
              <div className="md:hidden">
                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant="ghost"
                      onClick={() => scrollToSection(section.id)}
                      className={`relative flex items-center justify-center h-14 px-3 py-2 rounded-lg font-medium transition-all duration-300 w-28 max-w-28 flex-shrink-0 group ${
                        activeSection === section.id
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg scale-105'
                          : 'bg-slate-50 hover:bg-gradient-to-br hover:from-slate-700 hover:to-slate-800 hover:text-white border border-slate-200 hover:border-slate-700 text-slate-700 shadow-sm hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      <span className="text-xs text-center font-medium leading-tight px-1 whitespace-normal break-words" style={{ wordBreak: 'break-word' }}>{section.label}</span>
                      {activeSection === section.id && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tablet Navigation - Grid Layout */}
              <div className="hidden sm:block md:hidden">
                <div className="grid grid-cols-3 gap-4">
                  {sections.map((section) => (
                    <Button
                      key={section.id}
                      variant="ghost"
                      onClick={() => scrollToSection(section.id)}
                      className={`relative flex flex-col items-center gap-2 h-18 px-3 py-3 rounded-lg font-medium transition-all duration-300 group ${
                        activeSection === section.id
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg scale-105'
                          : 'bg-slate-50 hover:bg-gradient-to-br hover:from-slate-700 hover:to-slate-800 hover:text-white border border-slate-200 hover:border-slate-700 text-slate-700 shadow-sm hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      <span className="text-xs text-center font-medium leading-tight px-1 whitespace-normal break-words" style={{ wordBreak: 'break-word' }}>{section.label}</span>
                      {activeSection === section.id && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
              {/* Step 1: Personal Information - Responsive */}
              <div className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 mb-8 sm:mb-12 overflow-visible" id="personal-info">
                <div className="sticky top-0 z-20 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl sm:rounded-t-2xl shadow-md">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide">Personal Information</h3>
                </div>
                <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-6 sm:pt-8">
                  <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                    <div className="space-y-3 sm:space-y-4">
                      <Label htmlFor="gradeLevel" className="text-slate-800 font-semibold text-xs sm:text-sm uppercase tracking-wide">Current Grade Level *</Label>
                      <Select
                        value={formData.gradeLevel}
                        onValueChange={(value) => {
                          dispatch({ field: 'gradeLevel', value })
                          if (value && missingFields.includes('Current Grade Level')) {
                            dispatch({ field: 'missingFields', value: missingFields.filter(f => f !== 'Current Grade Level') })
                          }
                        }}
                      >
                        <SelectTrigger className={`h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base ${missingFields.includes('Current Grade Level') ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}>
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
                      {missingFields.includes('Current Grade Level') && (
                        <p className="text-xs sm:text-sm text-red-500 bg-red-50 p-2 sm:p-3 rounded-lg border border-red-200">This field is required for better recommendations</p>
                      )}
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <Label htmlFor="countryOfResidence" className="text-slate-800 font-semibold text-xs sm:text-sm uppercase tracking-wide">Country of Residence *</Label>
                      <Select
                        value={formData.countryOfResidence}
                        onValueChange={(value) => {
                          dispatch({ field: 'countryOfResidence', value })
                          if (value && missingFields.includes('Country of Residence')) {
                            dispatch({ field: 'missingFields', value: missingFields.filter(f => f !== 'Country of Residence') })
                          }
                        }}
                      >
                        <SelectTrigger className={`h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base ${missingFields.includes('Country of Residence') ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_COUNTRIES_ALPHABETICAL.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {missingFields.includes('Country of Residence') && (
                        <p className="text-xs sm:text-sm text-red-500 bg-red-50 p-2 sm:p-3 rounded-lg border border-red-200">This field is required for better recommendations</p>
                      )}
                    </div>
                  {formData.countryOfResidence === "United States" && (
                    <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6 md:col-span-2">
                      <Label htmlFor="stateProvince" className="text-slate-800 font-semibold text-xs sm:text-sm uppercase tracking-wide">State *</Label>
                      <Select
                        value={formData.stateProvince}
                        onValueChange={(value) => dispatch({ field: 'stateProvince', value })}
                      >
                        <SelectTrigger className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base">
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  </div>
                </div>
              </div>

              <Separator className="border-slate-200" />

              {/* Step 2: Academic Profile - Responsive */}
              <div className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 mb-8 sm:mb-12 overflow-visible" id="academic-profile">
                <div className="sticky top-0 z-20 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl sm:rounded-t-2xl shadow-md">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide">Academic Profile</h3>
                </div>
                <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-6 sm:pt-8">
                  <div className="space-y-6 sm:space-y-8">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <Label htmlFor="gradingSystem" className="text-slate-800 font-semibold text-xs sm:text-sm uppercase tracking-wide">Primary Grading System *</Label>
                      {renderGuidanceButton("gradingSystem", "I'm not sure which grading system to select. Can you help me understand the differences between US GPA, IB, A-Levels, and other systems?", "Need help choosing your grading system?", true)}
                    </div>
                    <Select
                      value={formData.gradingSystem}
                        onValueChange={(value) => dispatch({ field: 'gradingSystem', value })}
                      >
                        <SelectTrigger className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base">
                        <SelectValue placeholder="Select your grading system" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US GPA">US GPA</SelectItem>
                        <SelectItem value="International Baccalaureate (IB)">International Baccalaureate (IB)</SelectItem>
                        <SelectItem value="A-Levels">A-Levels</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Primary Grading System Specific Fields */}
                  {formData.gradingSystem === 'US GPA' && (
                        <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label htmlFor="gpa" className="text-slate-700 font-medium text-sm sm:text-base">GPA</Label>
                          <Input id="gpa" type="number" step="0.01" min="0" max="5" value={formData.gpa} onChange={e => dispatch({ field: 'gpa', value: e.target.value })} placeholder="e.g. 3.85" className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base" />
                        </div>
                        <div>
                          <Label htmlFor="classRank" className="text-slate-700 font-medium text-sm sm:text-base">Class Rank</Label>
                          <Input id="classRank" type="text" value={formData.classRank} onChange={e => dispatch({ field: 'classRank', value: e.target.value })} placeholder="e.g. Top 10% or 5/200" className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base" />
                        </div>
                        </div>
                    )}
                    {formData.gradingSystem === 'International Baccalaureate (IB)' && (
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label htmlFor="ibTotalPoints" className="text-slate-700 font-medium text-sm sm:text-base">IB Total Points</Label>
                          <Input id="ibTotalPoints" type="number" min="0" max="45" value={formData.ibTotalPoints} onChange={e => dispatch({ field: 'ibTotalPoints', value: e.target.value })} placeholder="e.g. 42" className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base" />
                        </div>
                        <div>
                          <Label className="text-slate-700 font-medium text-sm sm:text-base">IB Subjects</Label>
                          {formData.ibSubjects.map((subject, idx) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-2 items-center">
                              <Select
                                value={subject.subject}
                                onValueChange={val => dispatch({ field: 'ibSubjects', value: formData.ibSubjects.map((s, i) => i === idx ? { ...s, subject: val } : s) })}
                              >
                                <SelectTrigger className="w-full h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm text-sm sm:text-base">
                                  <SelectValue placeholder="Subject" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                  {IB_SUBJECTS.map((subj) => (
                                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={subject.level}
                                onValueChange={val => dispatch({ field: 'ibSubjects', value: formData.ibSubjects.map((s, i) => i === idx ? { ...s, level: val as 'HL' | 'SL' } : s) })}
                              >
                                <SelectTrigger className="w-full h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm text-sm sm:text-base">
                                  <SelectValue placeholder="Level" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="HL">HL</SelectItem>
                                  <SelectItem value="SL">SL</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input className="w-full h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm text-sm sm:text-base" placeholder="Grade" value={subject.grade} onChange={e => dispatch({ field: 'ibSubjects', value: formData.ibSubjects.map((s, i) => i === idx ? { ...s, grade: e.target.value } : s) })} />
                              <Button type="button" size="icon" variant="ghost" onClick={() => dispatch({ field: 'ibSubjects', value: formData.ibSubjects.filter((_, i) => i !== idx) })} className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"><X className="w-4 h-4" /></Button>
                            </div>
                          ))}
                          <Button type="button" size="sm" variant="outline" onClick={addIBSubject} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-3 sm:px-4 py-2 mt-2 text-sm sm:text-base">Add IB Subject</Button>
                            </div>
                            </div>
                    )}
                    {formData.gradingSystem === 'A-Levels' && (
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label className="text-slate-700 font-medium text-sm sm:text-base">A-Level Subjects</Label>
                          {formData.aLevelSubjects.map((subject, idx) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto] gap-2 mb-2 items-center">
                              <Select
                                value={subject.subject}
                                onValueChange={val => dispatch({ field: 'aLevelSubjects', value: formData.aLevelSubjects.map((s, i) => i === idx ? { ...s, subject: val } : s) })}
                              >
                                <SelectTrigger className="w-full h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm text-sm sm:text-base">
                                  <SelectValue placeholder="Subject" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60 overflow-y-auto">
                                  {A_LEVEL_SUBJECTS.map((subj) => (
                                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input className="w-full h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm text-sm sm:text-base" placeholder="Grade" value={subject.grade} onChange={e => dispatch({ field: 'aLevelSubjects', value: formData.aLevelSubjects.map((s, i) => i === idx ? { ...s, grade: e.target.value } : s) })} />
                              <Button type="button" size="icon" variant="ghost" onClick={() => dispatch({ field: 'aLevelSubjects', value: formData.aLevelSubjects.filter((_, i) => i !== idx) })} className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"><X className="w-4 h-4" /></Button>
                            </div>
                          ))}
                          <Button type="button" size="sm" variant="outline" onClick={addALevelSubject} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-3 sm:px-4 py-2 mt-2 text-sm sm:text-base">Add A-Level Subject</Button>
                            </div>
                            </div>
                    )}
                    {formData.gradingSystem === 'Other' && (
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label htmlFor="otherGradingSystem" className="text-slate-700 font-medium text-sm sm:text-base">Other Grading System</Label>
                          <Input id="otherGradingSystem" type="text" value={formData.otherGradingSystem} onChange={e => dispatch({ field: 'otherGradingSystem', value: e.target.value })} placeholder="Describe your grading system" className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base" />
                      </div>
                        <div>
                          <Label htmlFor="otherGrades" className="text-slate-700 font-medium text-sm sm:text-base">Grades / Scores</Label>
                          <Input id="otherGrades" type="text" value={formData.otherGrades} onChange={e => dispatch({ field: 'otherGrades', value: e.target.value })} placeholder="e.g. 92/100, 18/20, etc." className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base" />
                        </div>
                      </div>
                    )}

                    {/* Standardized Test Scores - Always Available */}
                    <div className="space-y-3 sm:space-y-4">
                      <Label className="text-slate-800 font-semibold text-xs sm:text-sm uppercase tracking-wide">Standardized Test Scores</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="satScore" className="text-slate-700 font-medium text-sm sm:text-base">SAT Score (Optional)</Label>
                          <Input id="satScore" type="number" min="400" max="1600" value={formData.satScore} onChange={e => dispatch({ field: 'satScore', value: e.target.value })} placeholder="e.g. 1450" className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base" />
                        </div>
                        <div>
                          <Label htmlFor="actScore" className="text-slate-700 font-medium text-sm sm:text-base">ACT Score (Optional)</Label>
                          <Input id="actScore" type="number" min="1" max="36" value={formData.actScore} onChange={e => dispatch({ field: 'actScore', value: e.target.value })} placeholder="e.g. 32" className="h-10 sm:h-12 border-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm sm:text-base" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="border-slate-200" />

              {/* Step 3: Extracurricular Activities - Responsive */}
              <div className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 mb-8 sm:mb-12 overflow-visible" id="extracurricular">
                <div className="sticky top-0 z-20 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl sm:rounded-t-2xl shadow-md">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide">Extracurricular Activities</h3>
                  <div className="ml-auto"><TierInfoDialog /></div>
                </div>
                <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-6 sm:pt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 mb-4 sm:mb-6">
                    <Label className="text-slate-800 font-semibold text-xs sm:text-sm uppercase tracking-wide">Your Extracurricular Activities</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExtracurricularActivity}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>
                  
                  {formData.extracurricularActivities.map((activity, index) => (
                    <div key={index} className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-[2fr_1fr_3fr_auto] items-start p-4 sm:p-6 border-2 border-slate-200 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="space-y-2">
                        <Label htmlFor={`activity-${index}`} className="text-sm sm:text-base">Activity</Label>
                        <Select
                          value={activity.activity}
                          onValueChange={(value) => updateExtracurricularActivity(index, "activity", value)}
                        >
                          <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
                            <SelectValue placeholder="Select activity" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {EXTRACURRICULAR_ACTIVITIES.map((act) => (
                              <SelectItem key={act} value={act}>
                                {act}
                              </SelectItem>
                            ))}
                            <SelectItem value="Other">Other (specify in description)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`tier-${index}`} className="text-sm sm:text-base">Tier</Label>
                        <Select
                          value={activity.tier}
                          onValueChange={(value) => updateExtracurricularActivity(index, "tier", value)}
                        >
                          <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Tier 1 - National/International</SelectItem>
                            <SelectItem value="2">Tier 2 - State Level</SelectItem>
                            <SelectItem value="3">Tier 3 - Regional</SelectItem>
                            <SelectItem value="4">Tier 4 - School Level</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`} className="text-sm sm:text-base">Description (Optional)</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={activity.description}
                          onChange={(e) => updateExtracurricularActivity(index, "description", e.target.value)}
                          placeholder="Add context, achievements, leadership roles, etc."
                          rows={2}
                          className="text-sm sm:text-base"
                        />
                      </div>

                      <div className="flex items-start justify-end pt-6 sm:pt-8">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExtracurricularActivity(index)}
                          className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {formData.extracurricularActivities.length === 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                      Add your extracurricular activities to showcase your involvement and achievements.
                    </p>
                  )}
                </div>
              </div>

              <Separator className="border-slate-200" />

              {/* Step 4: College Preferences - Responsive */}
              <div className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 mb-8 sm:mb-12 overflow-visible" id="college-preferences">
                <div className="sticky top-0 z-20 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl sm:rounded-t-2xl shadow-md">
                  <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-200" />
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide">College Preferences</h3>
                </div>
                <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-6 sm:pt-8">
                  <div className="grid grid-cols-1 gap-y-6 sm:gap-y-8">
                    {/* Intended Majors */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <Label htmlFor="intendedMajors" className="text-slate-700 font-medium text-sm sm:text-base">Intended Majors *</Label>
                        {renderGuidanceButton("intendedMajors", undefined, "Need help choosing your intended majors? Click for guidance!", true)}
                    </div>
                      <div className="relative major-dropdown">
                        <button
                          type="button"
                          onClick={() => dispatch({ field: 'majorDropdownOpen', value: !formData.majorDropdownOpen })}
                          className={`w-full h-10 sm:h-11 px-3 py-2 text-left border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                            missingFields.includes('Intended Majors') ? 'border-red-500 ring-red-500' : 'border-slate-300'
                          }`}
                        >
                          <span className={formData.intendedMajors.length === 0 ? 'text-slate-500' : 'text-slate-900'}>
                            {getSelectedMajorsDisplay()}
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </button>
                        {formData.intendedMajors.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {formData.intendedMajors.map((major) => (
                              <span
                                key={major}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {major}
                                <button
                                  type="button"
                                  onClick={() => handleMajorToggle(major)}
                                  className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {formData.majorDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 flex flex-col">
                            <div className="p-2 border-b border-slate-200 bg-white sticky top-0 z-10">
                              <input
                                type="text"
                                placeholder="Search majors..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.majorSearchTerm || ""}
                                onChange={(e) => dispatch({ field: 'majorSearchTerm', value: e.target.value })}
                              />
                  </div>
                            <div className="flex-1 overflow-y-auto py-1">
                              {Object.entries(MAJORS).map(([category, majors]) => {
                                if (typeof majors === "string") {
                                  const major = majors;
                                  const isVisible = !formData.majorSearchTerm || major.toLowerCase().includes(formData.majorSearchTerm.toLowerCase());
                                  if (!isVisible) return null;
                                  return (
                                    <button key={major} type="button" onClick={() => handleMajorToggle(major)} className={`w-full text-left px-4 py-2 hover:bg-slate-100 ${formData.intendedMajors.includes(major) ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>
                                      <div className="flex items-center">
                                        {formData.intendedMajors.includes(major) && (<svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>)}
                                        <span className={formData.intendedMajors.includes(major) ? 'ml-2' : 'ml-6'}>{major}</span>
                                      </div>
                                    </button>
                                  );
                                } else {
                                  const visibleMajors = Object.entries(majors).filter(([major, value]) => 
                                    !formData.majorSearchTerm || 
                                    major.toLowerCase().includes(formData.majorSearchTerm.toLowerCase()) ||
                                    value.toLowerCase().includes(formData.majorSearchTerm.toLowerCase())
                                  )
                                  
                                  if (visibleMajors.length === 0) return null;
                                  return (
                                    <div key={category}>
                                      <div className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50">{category}</div>
                                      {visibleMajors.map(([major, value]) => (
                                        <button key={value} type="button" onClick={() => handleMajorToggle(value)} className={`w-full text-left px-4 py-2 hover:bg-slate-100 pl-8 ${formData.intendedMajors.includes(value) ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>
                                          <div className="flex items-center">
                                            {formData.intendedMajors.includes(value) && (<svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>)}
                                            <span className={formData.intendedMajors.includes(value) ? 'ml-2' : 'ml-6'}>{major}</span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      {missingFields.includes('Intended Majors') && (<p className="text-sm text-red-500">This field is required</p>)}
                      {formData.intendedMajors.length === 0 && (
                        <OptimizedTextInput id="customMajor" label="Custom Major" value={formData.customMajor} onDebouncedChange={handleCustomMajorChange} placeholder="Enter your intended major" required />
                      )}
                    </div>

                    {/* Preferred College Size */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="collegeSize" className="text-slate-700 font-medium">Preferred College Size</Label>
                        {renderGuidanceButton("collegeSize", "I don't know what size college would be right for me.", "Click for help on college size.", true)}
                    </div>
                      <Select value={formData.collegeSize} onValueChange={(value) => handleFieldChange("collegeSize", value)}>
                        <SelectTrigger><SelectValue placeholder="Select preferred size" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Small">Small (fewer than 2,000 students)</SelectItem>
                          <SelectItem value="Medium">Medium (2,000 to 15,000 students)</SelectItem>
                          <SelectItem value="Large">Large (more than 15,000 students)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                    {/* Campus Setting */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="campusSetting" className="text-slate-700 font-medium">Campus Setting</Label>
                        {renderGuidanceButton("campusSetting", undefined, "Need help with campus settings?", true)}
                    </div>
                      <Select value={formData.campusSetting} onValueChange={(value) => handleFieldChange("campusSetting", value)}>
                        <SelectTrigger><SelectValue placeholder="Select preferred setting" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urban">Urban</SelectItem>
                        <SelectItem value="Suburban">Suburban</SelectItem>
                        <SelectItem value="Rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                    {/* Geographic Preferences */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Label className="text-slate-700 font-medium">Geographic Preferences (Countries)</Label>
                        {renderGuidanceButton(
                          "geographicPreference",
                          `My country of residence is ${formData.countryOfResidence}. I'm trying to decide which countries to study in. What factors should I consider, keeping my home country in mind? For example, what are some good options close to home, or what are the pros and cons of studying further away?`,
                          "Get help choosing countries to study in",
                          true
                        )}
                      </div>

                      <div className="space-y-3">
                          {formData.preferredCountries.map((country, index) => (
  <div key={index} className="flex items-center gap-2 mb-2">
    <Select value={country} onValueChange={(value) => handleCountryChange(value, index)}>
      <SelectTrigger className="w-full">
        <span className="flex-1 text-left">
          {country || "Select a country"}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Popular</SelectLabel>
          {POPULAR_COUNTRIES.filter(c => !formData.preferredCountries.includes(c) || c === country).map((c) => (
            <SelectItem key={`popular-${c}`} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>All Countries</SelectLabel>
          {ALL_COUNTRIES_ALPHABETICAL.filter(c =>
            (!formData.preferredCountries.includes(c) || c === country)
          ).map((c) => (
            <SelectItem key={`all-${c}`} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => handleRemoveCountry(index)}
      className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
))}
                        {formData.preferredCountries.length < 10 && (
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleAddCountry}>
                            <Plus className="mr-2 h-4 w-4" /> Add Another Country
                          </Button>
                        )}
                      </div>
                  {formData.preferredCountries.includes("United States") && (
                    <div className="mt-4 space-y-3">
                      <div className="font-medium text-slate-700">Select US States</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {US_STATES.map((state) => (
                          <div key={state} className="flex items-center space-x-2">
                                <Checkbox id={state} checked={formData.preferredUSStates.includes(state)} onCheckedChange={() => handleArrayToggle("preferredUSStates", state)} />
                                <label htmlFor={state} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{state}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </div>

                  {/* Cost Importance */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Label className="text-slate-700 font-medium">Cost Importance</Label>
                        {renderGuidanceButton("costImportance", "How important should cost be in my decision?", "Click for help on cost.", true)}
                    </div>
                      <Select value={formData.costImportance} onValueChange={(value) => handleFieldChange("costImportance", value)}>
                        <SelectTrigger className={`h-11 ${missingFields.includes('Cost Importance') ? 'border-red-500' : 'border-slate-300'}`}><SelectValue placeholder="Select importance of cost..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Very Important">Very Important</SelectItem>
                        <SelectItem value="Important">Important</SelectItem>
                        <SelectItem value="Somewhat Important">Somewhat Important</SelectItem>
                        <SelectItem value="Not Important">Not Important</SelectItem>
                      </SelectContent>
                    </Select>
                      {missingFields.includes('Cost Importance') && (<p className="text-sm text-red-500">This field is required</p>)}
                  </div>
                  </div>
                </div>
                    </div>
                    
              <Separator className="border-slate-200" />

              {/* Additional Preferences - Elegant Redesign */}
              <div className="relative rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 mb-12 overflow-visible">
                <div className="sticky top-0 z-20 flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-2xl shadow-md">
                  <Sparkles className="h-6 w-6 text-blue-200" />
                  <h3 className="text-2xl font-bold tracking-wide">Additional Preferences</h3>
                </div>
                
                {/* Guidance Button - Moved under header */}
                <div className="px-8 pt-4 pb-2">
                  <div className="flex justify-center">
                    {renderGuidanceButton("additionalPreferences", "I'd like to explore what additional preferences I should consider when choosing colleges. Can you help me think through campus life & social fit, academic & career opportunities, support & community, and application process factors that would make me feel engaged and supported in my college journey?", "Not sure about additional preferences? Click for help!", true)}
                  </div>
                </div>
                
                {/* Summary chip bar */}
                <div className="flex flex-wrap gap-2 px-8 pt-4 pb-2">
                  {getSelectedAdditionalPreferences.length > 0 ? (
                    getSelectedAdditionalPreferences.map((pref, idx) => (
                      <span key={idx} className="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold shadow-sm border border-blue-200">
                        {pref}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-sm">No preferences selected yet.</span>
                  )}
                </div>
                <div className="px-8 pb-8 pt-2">
                    <Accordion type="multiple" defaultValue={["campus-life"]} className="w-full">
                      {/* Campus Life & Social Fit */}
                      <AccordionItem value="campus-life">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-blue-500" />
                            <span className="font-medium text-slate-700">Campus Life & Social Fit</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="greekLifeImportant"
                                  checked={formData.greekLifeImportant}
                                  onCheckedChange={(checked) => dispatch({ field: 'greekLifeImportant', value: checked })}
                                />
                                <Label htmlFor="greekLifeImportant">Greek Life</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="strongAthletics"
                                  checked={formData.strongAthletics}
                                  onCheckedChange={(checked) => dispatch({ field: 'strongAthletics', value: checked })}
                                />
                                <Label htmlFor="strongAthletics">Strong Athletics Program</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="diverseStudentBody"
                                  checked={formData.diverseStudentBody}
                                  onCheckedChange={(checked) => dispatch({ field: 'diverseStudentBody', value: checked })}
                                />
                                <Label htmlFor="diverseStudentBody">Student Diversity</Label>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="activeSocialLife">Active Social Life</Label>
                                <Select
                                  value={formData.activeSocialLife}
                                  onValueChange={(value) => dispatch({ field: 'activeSocialLife', value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select importance..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Very Important">Very Important</SelectItem>
                                    <SelectItem value="Somewhat Important">Somewhat Important</SelectItem>
                                    <SelectItem value="Not Important">Not Important</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="varietyOfClubs"
                                  checked={formData.varietyOfClubs}
                                  onCheckedChange={(checked) => dispatch({ field: 'varietyOfClubs', value: checked })}
                                />
                                <Label htmlFor="varietyOfClubs">Variety of Clubs/Organizations</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="campusEventsAndTraditions"
                                  checked={formData.campusEventsAndTraditions}
                                  onCheckedChange={(checked) => dispatch({ field: 'campusEventsAndTraditions', value: checked })}
                                />
                                <Label htmlFor="campusEventsAndTraditions">Campus Events & Traditions</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="lgbtqFriendlyCampus"
                                  checked={formData.lgbtqFriendlyCampus}
                                  onCheckedChange={(checked) => dispatch({ field: 'lgbtqFriendlyCampus', value: checked })}
                                />
                                <Label htmlFor="lgbtqFriendlyCampus">LGBTQ+ Friendly Campus</Label>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="residentialCommunityType">Residential Community Type</Label>
                                <Select
                                  value={formData.residentialCommunityType}
                                  onValueChange={(value) => dispatch({ field: 'residentialCommunityType', value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Residential Campus">Residential Campus</SelectItem>
                                    <SelectItem value="Commuter Campus">Commuter Campus</SelectItem>
                                    <SelectItem value="No Preference">No Preference</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="nightlifeOffCampusActivities"
                                  checked={formData.nightlifeOffCampusActivities}
                                  onCheckedChange={(checked) => dispatch({ field: 'nightlifeOffCampusActivities', value: checked })}
                                />
                                <Label htmlFor="nightlifeOffCampusActivities">Nightlife/Off-Campus Activities</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="internationalStudentCommunity"
                                  checked={formData.internationalStudentCommunity}
                                  onCheckedChange={(checked) => dispatch({ field: 'internationalStudentCommunity', value: checked })}
                                />
                                <Label htmlFor="internationalStudentCommunity">International Student Community</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="religiousLifeImportant"
                                  checked={formData.religiousLifeImportant}
                                  onCheckedChange={(checked) => dispatch({ field: 'religiousLifeImportant', value: checked })}
                                />
                                <Label htmlFor="religiousLifeImportant">Religious/Spiritual Life</Label>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="religiousAffiliation">Religious Affiliation</Label>
                                <Select
                                  value={formData.religiousAffiliation}
                                  onValueChange={(value) => dispatch({ field: 'religiousAffiliation', value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select affiliation..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Secular">Secular</SelectItem>
                                    <SelectItem value="Christian">Christian</SelectItem>
                                    <SelectItem value="Jewish">Jewish</SelectItem>
                                    <SelectItem value="Muslim">Muslim</SelectItem>
                                    <SelectItem value="Hindu">Hindu</SelectItem>
                                    <SelectItem value="Buddhist">Buddhist</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                    <SelectItem value="No Preference">No Preference</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="politicalActivism">Political Activism</Label>
                                <Select
                                  value={formData.politicalActivism}
                                  onValueChange={(value) => dispatch({ field: 'politicalActivism', value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Very Active">Very Active</SelectItem>
                                    <SelectItem value="Somewhat Active">Somewhat Active</SelectItem>
                                    <SelectItem value="Not Important">Not Important</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="campusSafety">Campus Safety</Label>
                                <Select
                                  value={formData.campusSafety}
                                  onValueChange={(value) => dispatch({ field: 'campusSafety', value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select importance..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Very Important">Very Important</SelectItem>
                                    <SelectItem value="Somewhat Important">Somewhat Important</SelectItem>
                                    <SelectItem value="Not Important">Not Important</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Weather/Climate Preference</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {["Warm", "Temperate", "Cold", "Four Seasons"].map((climate) => (
                                    <div key={climate} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`climate-${climate}`}
                                        checked={formData.weatherClimatePreference.includes(climate)}
                                        onCheckedChange={() => handleArrayToggle("weatherClimatePreference", climate)}
                                      />
                                      <Label htmlFor={`climate-${climate}`} className="text-sm">{climate}</Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Academic & Career Opportunities */}
                      <AccordionItem value="academic-career">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                          <GraduationCap className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-slate-700">Academic & Career Opportunities</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="studyAbroadImportant"
                                  checked={formData.studyAbroadImportant}
                                  onCheckedChange={(checked) => dispatch({ field: 'studyAbroadImportant', value: checked })}
                                />
                                <Label htmlFor="studyAbroadImportant">Study Abroad Opportunities</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="undergraduateResearchImportant"
                                  checked={formData.undergraduateResearchImportant}
                                  onCheckedChange={(checked) => dispatch({ field: 'undergraduateResearchImportant', value: checked })}
                                />
                                <Label htmlFor="undergraduateResearchImportant">Undergraduate Research</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="internshipCoopImportant"
                                  checked={formData.internshipCoopImportant}
                                  onCheckedChange={(checked) => dispatch({ field: 'internshipCoopImportant', value: checked })}
                                />
                                <Label htmlFor="internshipCoopImportant">Internship/Co-op Opportunities</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="honorsPrograms"
                                  checked={formData.honorsPrograms}
                                  onCheckedChange={(checked) => dispatch({ field: 'honorsPrograms', value: checked })}
                                />
                                <Label htmlFor="honorsPrograms">Honors Program Availability</Label>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="acceleratedDegreePrograms"
                                  checked={formData.acceleratedDegreePrograms}
                                  onCheckedChange={(checked) => dispatch({ field: 'acceleratedDegreePrograms', value: checked })}
                                />
                                <Label htmlFor="acceleratedDegreePrograms">Accelerated Degree Programs</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="robustCareerServices"
                                  checked={formData.robustCareerServices}
                                  onCheckedChange={(checked) => dispatch({ field: 'robustCareerServices', value: checked })}
                                />
                                <Label htmlFor="robustCareerServices">Robust Career Services</Label>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="graduateEmployability">Graduate Employability</Label>
                                <Select
                                  value={formData.graduateEmployability}
                                  onValueChange={(value) => dispatch({ field: 'graduateEmployability', value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select importance..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Very Important">Very Important</SelectItem>
                                    <SelectItem value="Somewhat Important">Somewhat Important</SelectItem>
                                    <SelectItem value="Not Important">Not Important</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Support & Community */}
                      <AccordionItem value="support-community">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-purple-500" />
                            <span className="font-medium text-slate-700">Support & Community</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="strongAlumniNetwork"
                                  checked={formData.strongAlumniNetwork}
                                  onCheckedChange={(checked) => dispatch({ field: 'strongAlumniNetwork', value: checked })}
                                />
                                <Label htmlFor="strongAlumniNetwork">Strong Alumni Network</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="firstGenerationSupport"
                                  checked={formData.firstGenerationSupport}
                                  onCheckedChange={(checked) => dispatch({ field: 'firstGenerationSupport', value: checked })}
                                />
                                <Label htmlFor="firstGenerationSupport">First-Generation Student Support</Label>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="disabilityServices"
                                  checked={formData.disabilityServices}
                                  onCheckedChange={(checked) => dispatch({ field: 'disabilityServices', value: checked })}
                                />
                                <Label htmlFor="disabilityServices">Disability Services</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="lgbtqSupportServices"
                                  checked={formData.lgbtqSupportServices}
                                  onCheckedChange={(checked) => dispatch({ field: 'lgbtqSupportServices', value: checked })}
                                />
                                <Label htmlFor="lgbtqSupportServices">LGBTQ+ Support Services</Label>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Application Process & Reputation */}
                      <AccordionItem value="application-reputation">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="font-medium text-slate-700">Application Process & Reputation</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="testOptionalPolicy"
                                  checked={formData.testOptionalPolicy}
                                  onCheckedChange={(checked) => dispatch({ field: 'testOptionalPolicy', value: checked })}
                                />
                                <Label htmlFor="testOptionalPolicy">Test-Optional Policy</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="earlyActionDecisionOptions"
                                  checked={formData.earlyActionDecisionOptions}
                                  onCheckedChange={(checked) => dispatch({ field: 'earlyActionDecisionOptions', value: checked })}
                                />
                                <Label htmlFor="earlyActionDecisionOptions">Early Action/Decision Options</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="needBlindAdmission"
                                  checked={formData.needBlindAdmission}
                                  onCheckedChange={(checked) => dispatch({ field: 'needBlindAdmission', value: checked })}
                                />
                                <Label htmlFor="needBlindAdmission">Need-Blind Admission</Label>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="institutionalPrestige">Institutional Prestige</Label>
                                <Select
                                  value={formData.institutionalPrestige}
                                  onValueChange={(value) => dispatch({ field: 'institutionalPrestige', value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select importance..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Very Important">Very Important</SelectItem>
                                    <SelectItem value="Somewhat Important">Somewhat Important</SelectItem>
                                    <SelectItem value="Not Important">Not Important</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="legacyConsideration"
                                  checked={formData.legacyConsideration}
                                  onCheckedChange={(checked) => dispatch({ field: 'legacyConsideration', value: checked })}
                                />
                                <Label htmlFor="legacyConsideration">Legacy Consideration</Label>
                              </div>

                              <div className="flex items-center space-x-3">
                                <Switch
                                  id="demonstratedInterest"
                                  checked={formData.demonstratedInterest}
                                  onCheckedChange={(checked) => dispatch({ field: 'demonstratedInterest', value: checked })}
                                />
                                <Label htmlFor="demonstratedInterest">Demonstrated Interest</Label>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  {/* Other Specific Preferences */}
                  <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-inner">
                      <OptimizedTextInput
                        id="otherSpecificPreferences"
                        label="Other Specific Preferences"
                        value={formData.otherSpecificPreferences}
                        onDebouncedChange={(value) => dispatch({ field: 'otherSpecificPreferences', value })}
                        placeholder="Any other specific preferences or requirements..."
                        type="textarea"
                      />
                    </div>
                  </div>
              </div>

              <Separator className="border-slate-200" />

              {/* Step 5: Finances - Elegant Redesign */}
              <div className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 mb-8 sm:mb-12 overflow-visible" id="finances">
                <div className="sticky top-0 z-20 flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-2xl shadow-md">
                  <DollarSign className="h-6 w-6 text-blue-200" />
                  <h3 className="text-2xl font-bold tracking-wide">Finances</h3>
                    </div>
                <div className="px-8 pb-8 pt-8">
                  <div className="space-y-3">
                    <Label htmlFor="familyIncome" className="text-slate-700 font-medium">Family Income Range</Label>
                    <Select
                      value={formData.familyIncome}
                      onValueChange={(value) => dispatch({ field: 'familyIncome', value })}
                    >
                      <SelectTrigger className={`h-11 ${missingFields.includes('Family Income') ? 'border-red-500 ring-red-500' : 'border-slate-300'}`}>
                        <SelectValue placeholder="Select income range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Under $50,000">Under $50,000</SelectItem>
                        <SelectItem value="$50,000 - $100,000">$50,000 - $100,000</SelectItem>
                        <SelectItem value="$100,000 - $150,000">$100,000 - $150,000</SelectItem>
                        <SelectItem value="Over $150,000">Over $150,000</SelectItem>
                      </SelectContent>
                    </Select>
                    {missingFields.includes('Family Income') && (
                      <p className="text-sm text-red-500">This field is required for better recommendations</p>
                    )}
                  </div>

                  <div className="space-y-6 mt-8">
                    <div className="flex items-start gap-6">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="firstGen" className="text-slate-700 font-medium">First-Generation College Student</Label>
                        <p className="text-sm text-slate-500 leading-relaxed">Neither parent has completed a 4-year college degree</p>
                      </div>
                      <div className="flex-shrink-0 pt-1">
                        <Switch
                          id="firstGen"
                          checked={formData.firstGenerationStudent}
                          onCheckedChange={(checked) => dispatch({ field: 'firstGenerationStudent', value: checked })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Label className="text-slate-700 font-medium">Financial Aid Needed</Label>
                        {renderGuidanceButton("financialAidNeeded", "I'm not sure if my family will need financial aid for college. Can you help me understand how financial aid works and whether we should apply for it?", "Need help understanding financial aid options? Click for guidance!", true)}
                      </div>
                      <Select
                        value={formData.financialAidNeeded ? "Yes" : "No"}
                        onValueChange={(value) => {
                          dispatch({ field: 'financialAidNeeded', value: value === "Yes" })
                        }}
                      >
                        <SelectTrigger className={`h-11 ${missingFields.includes('Financial Aid Needed') ? 'border-red-500 ring-red-500' : 'border-slate-300'}`}>
                          <SelectValue placeholder="Will you need financial aid?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      {missingFields.includes('Financial Aid Needed') && (
                        <p className="text-sm text-red-500">This field is required for better recommendations</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 6: Dream Colleges - Responsive */}
              <DreamCollegesSection collegeSearch={collegeSearch} setCollegeSearch={setCollegeSearch} fuzzyCollegeResults={fuzzyCollegeResults} formData={formData} dispatch={dispatch} />

              {/* Generate Recommendations Section */}
              <Card id="generate-recommendations" className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Brain className="h-6 w-6" />
                    </div>
                    Generate College Recommendations
                  </CardTitle>
                  <CardDescription className="text-slate-200 text-base">
                    Ready to get personalized college recommendations based on your profile?
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8 bg-gradient-to-b from-slate-50 to-white">
                  {recommendationsUpToDate && lastRecommendationDate && (
                    <div className="text-sm text-muted-foreground mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      ✅ Your recommendations are up-to-date! 
                      <br />
                      Last generated: {new Date(lastRecommendationDate).toLocaleDateString()} at {new Date(lastRecommendationDate).toLocaleTimeString()}
                    </div>
                  )}
                  <div className="flex flex-col items-center space-y-4">
                    {/* Service Status Indicator */}
                    <div className="text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>AI Service: Online</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleGenerateRecommendations} 
                      disabled={generatingRecommendations || recommendationsUpToDate} 
                      size="lg" 
                      className={`px-12 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl ${
                        recommendationsUpToDate 
                          ? 'border-2 border-green-600 text-green-700 bg-white hover:bg-green-50' 
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0'
                      }`}
                    >
                    {generatingRecommendations ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Recommendations...
                      </>
                    ) : recommendationsUpToDate ? (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Recommendations Up-to-Date
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Get College Recommendations
                      </>
                    )}
                    </Button>
                  </div>
                  {recommendationsUpToDate && (
                    <p className="text-xs text-muted-foreground">
                      Make changes to your profile to generate new recommendations
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

          {/* Mandatory Fields Dialog */}
          <Dialog open={mandatoryFieldsDialogOpen} onOpenChange={setMandatoryFieldsDialogOpen}>
            <DialogContent className="sm:max-w-md border-0 shadow-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl text-slate-800">
                  <Brain className="h-6 w-6 text-blue-600" />
                  Get More Relevant Recommendations
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  You will get more relevant and accurate college recommendations if you fill out more of the required fields in your My Profile page.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">Missing Fields:</h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    {missingFields.map((field, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={handleFillMissingFields} className="flex-1 sm:flex-none border-slate-300">
                    Fill Out Missing Fields
                  </Button>
                  <Button onClick={handleContinueAnyway} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700">
                    Continue Anyway
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <ProfileGuidanceChat
            open={guidanceOpen}
            onOpenChange={setGuidanceOpen}
            fieldName={guidanceContext}
            initialPrompt={guidancePrompt}
            currentValue={getGuidanceCurrentValue(guidanceContext)}
            countryOfResidence={formData.countryOfResidence}
            onSuggestion={(suggestion) => {
              if (isStringField(guidanceContext as keyof typeof formData)) {
                handleFieldChange(guidanceContext as keyof typeof formData, suggestion)
              }
            }}
            onMultiSuggestion={(suggestion, shouldAdd) => {
              if (guidanceContext === "geographicPreference") {
                dispatch({ field: 'preferredCountries', value: formData.preferredCountries.includes(suggestion) ? formData.preferredCountries.filter(item => item !== suggestion) : [...formData.preferredCountries, suggestion] })
              } else if (guidanceContext === "additionalPreferences") {
                dispatch({ field: 'additionalPreferences', value: formData.additionalPreferences.includes(suggestion) ? formData.additionalPreferences.filter((item: string) => item !== suggestion) : [...formData.additionalPreferences, suggestion] })
              }
            }}
          />
        </div>
      </div>
    </TooltipProvider>
  )
} 