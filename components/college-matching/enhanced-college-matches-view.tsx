"use client"

import { useState, useEffect } from "react"
import { CollegeMatchesView } from "./college-matches-view"
import { RecommendationsGenerator } from "./recommendations-generator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Sparkles, BarChart3 } from "lucide-react"

interface EnhancedCollegeMatchesViewProps {
  refreshTrigger?: number
}

interface StudentProfile {
  user_id?: string
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
  firstGenerationStudent?: boolean
  financialAidNeeded?: boolean
}

export function EnhancedCollegeMatchesView({ refreshTrigger }: EnhancedCollegeMatchesViewProps) {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [matchesRefreshTrigger, setMatchesRefreshTrigger] = useState(0)
  const [hasRecommendations, setHasRecommendations] = useState(false)

  // Load student profile
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
        
        if (profile) {
          setStudentProfile({
            ...profile,
            user_id: user.id
          })
        }
      }
    } catch (error) {
      console.error("Failed to load student profile:", error)
    }
  }

  // Check if user has existing recommendations
  const checkExistingRecommendations = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: matches } = await supabase
          .from("college_matches")
          .select("id")
          .eq("student_id", user.id)
          .limit(1)
        
        setHasRecommendations(!!matches && matches.length > 0)
      }
    } catch (error) {
      console.error("Failed to check existing recommendations:", error)
    }
  }

  // Handle successful recommendations generation
  const handleRecommendationsGenerated = (matches: any[]) => {
    setHasRecommendations(true)
    setMatchesRefreshTrigger(prev => prev + 1)
  }

  useEffect(() => {
    loadStudentProfile()
    checkExistingRecommendations()
  }, [])

  useEffect(() => {
    if (refreshTrigger) {
      setMatchesRefreshTrigger(prev => prev + 1)
      checkExistingRecommendations()
    }
  }, [refreshTrigger])

  if (!studentProfile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-slate-600">Loading your profile...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Main Content Tabs */}
      <Tabs defaultValue={hasRecommendations ? "recommendations" : "generate"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Generate Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>My Recommendations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>College Recommendation Engine</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">
                Our advanced college recommendation engine analyzes your academic profile, preferences, and goals to find colleges that are the best fit for you. 
                Get personalized recommendations in just 1-2 minutes.
              </p>
              
              <RecommendationsGenerator
                studentProfile={studentProfile}
                onRecommendationsGenerated={handleRecommendationsGenerated}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {hasRecommendations ? (
            <CollegeMatchesView refreshTrigger={matchesRefreshTrigger} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <Sparkles className="h-12 w-12 text-blue-600 mx-auto" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    No Recommendations Yet
                  </h3>
                  <p className="text-slate-600">
                    Generate your personalized college recommendations to see your matches.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

