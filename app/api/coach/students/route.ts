import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG-v2] Coach students API called at", new Date().toISOString())
    // Simple auth check using admin client
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Not logged in" },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: user, error: userError } = await adminClient
      .from("users")
      .select("id, email, full_name, role, \"current_role\"")
      .eq("id", authUser.id)
      .single()

    if (userError || !user) {
      console.error("Failed to fetch user profile:", userError)
      return NextResponse.json(
        { success: false, error: "User profile not found" },
        { status: 404 }
      )
    }

    // Check if user is a coach (either current_role or original role)
    if (user.current_role !== 'coach' && user.role !== 'coach') {
      console.log("Access denied - not a coach. User role:", user.role, "Current role:", user.current_role)
      return NextResponse.json(
        { success: false, error: "Unauthorized - Coach access required" },
        { status: 401 }
      )
    }

    console.log("Fetching assignments for coach:", user.id, user.email)

    // First, get basic assignments
    const { data: assignments, error: assignmentsError } = await adminClient
      .from("coach_student_assignments")
      .select("student_id, assigned_at")
      .eq("coach_id", user.id)
      .eq("is_active", true)

    console.log("Assignments query result:", { assignments, assignmentsError })

    if (assignmentsError) {
      console.error("Assignment error:", assignmentsError)
      return NextResponse.json(
        { success: false, error: "Failed to fetch assignments" },
        { status: 500 }
      )
    }

    if (!assignments || assignments.length === 0) {
      console.log("No assignments found for coach")
      return NextResponse.json({
        success: true,
        students: [],
      })
    }

    const students = []

    for (const assignment of assignments) {
      const studentId = assignment.student_id
      console.log("📝 Processing student:", studentId)
      
      // Get student basic info
      const { data: student, error: studentError } = await adminClient
        .from("users")
        .select("id, full_name, email")
        .eq("id", studentId)
        .single()

      if (studentError || !student) {
        console.error("❌ Failed to fetch student:", studentId, studentError)
        continue
      }

      console.log("✅ Student found:", student.email)

      // Get last login info from auth.users
      let lastSignInAt = null
      try {
        const { data: authUser } = await adminClient.auth.admin.getUserById(studentId)
        lastSignInAt = authUser?.user?.last_sign_in_at
      } catch (error) {
        console.log("Could not fetch auth user data:", error)
      }

      // Get student profile (handle multiple records)
      const { data: profiles, error: profileError } = await adminClient
        .from("student_profiles")
        .select("grade_level, gpa, country_of_residence")
        .eq("user_id", studentId)
        .order("updated_at", { ascending: false })
        
      // Find the most complete profile (not just the newest)
      let profile = null
      if (profiles && profiles.length > 0) {
        // Try to find a profile with data
        profile = profiles.find(p => p.grade_level || p.gpa || p.country_of_residence) || profiles[0]
      }
        
      console.log(`📋 [DEBUG-v2] Profile query for ${student.email}:`, {
        profileCount: profiles?.length || 0,
        error: profileError,
        selectedProfile: profile,
        allProfiles: profiles?.map(p => ({ grade_level: p.grade_level, gpa: p.gpa, country_of_residence: p.country_of_residence })) || [],
        lastSignInAt,
        studentId,
        coachId: user.id
      })
      
      // Get profile completion
      console.log("🧮 Calculating profile completion for:", student.email)
      const profileCompletion = await calculateProfileCompletion(adminClient, studentId)
      console.log(`✅ Profile completion for ${student.email}:`, profileCompletion)
      
      // Get college matches count (try user_id first, fallback to student_id)
      let matchesCount = 0
      const { count: matchesWithUserId } = await adminClient
        .from("college_matches")
        .select("*", { count: "exact", head: true })
        .eq("user_id", studentId)
      
      if (matchesWithUserId !== null) {
        matchesCount = matchesWithUserId
      } else {
        const { count: matchesWithStudentId } = await adminClient
          .from("college_matches")
          .select("*", { count: "exact", head: true })
          .eq("student_id", studentId)
        matchesCount = matchesWithStudentId || 0
      }

      // Get college list with application stages (try different column names)
      let collegeList = null
      let collegeError = null
      
      // First try with student_id
      const { data: collegeListWithStudentId, error: collegeError1 } = await adminClient
        .from("my_college_list")
        .select("application_stage")
        .eq("student_id", studentId)
        
      if (collegeListWithStudentId && collegeListWithStudentId.length > 0) {
        collegeList = collegeListWithStudentId
        collegeError = collegeError1
      } else {
        // Fallback to user_id if needed
        const { data: collegeListWithUserId, error: collegeError2 } = await adminClient
          .from("my_college_list")
          .select("application_stage")
          .eq("user_id", studentId)
        collegeList = collegeListWithUserId
        collegeError = collegeError2
      }
      
      console.log(`🎓 [DEBUG-v2] College list for ${student.email}:`, {
        listCount: collegeList?.length || 0,
        error: collegeError,
        sampleStages: collegeList?.slice(0, 3).map(c => c.application_stage) || [],
        allStages: collegeList?.map(c => c.application_stage) || []
      })

      // Calculate application progress
      const applicationProgress = {
        considering: 0,
        planning_to_apply: 0,
        applied: 0,
        interviewing: 0,
        accepted: 0,
        rejected: 0,
        enrolled: 0,
      }

      collegeList?.forEach(college => {
        const stage = college.application_stage || 'considering'
        if (stage in applicationProgress) {
          applicationProgress[stage as keyof typeof applicationProgress]++
        }
      })
      
      console.log(`📊 [DEBUG-v2] Application progress for ${student.email}:`, {
        rawStages: collegeList?.map(c => c.application_stage) || [],
        calculatedProgress: applicationProgress,
        totalColleges: collegeList?.length || 0
      })

      students.push({
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        grade_level: profile?.grade_level,
        gpa: profile?.gpa,
        country_of_residence: profile?.country_of_residence,
        profile_completion: profileCompletion,
        college_matches_count: matchesCount || 0,
        college_list_count: collegeList?.length || 0,
        application_progress: applicationProgress,
        assigned_at: assignment.assigned_at,
        last_sign_in_at: lastSignInAt,
      })
    }

    console.log("Final students result:", students.length, "students")

    return NextResponse.json({
      success: true,
      students,
    })

  } catch (error: any) {
    console.error("Error fetching coach students:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function calculateProfileCompletion(supabase: any, studentId: string): Promise<number> {
  const { data: profiles, error: profileError } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", studentId)
    .order("updated_at", { ascending: false })

  // Find the most complete profile for calculation
  let profile = null
  if (profiles && profiles.length > 0) {
    // Try to find a profile with the most data
    profile = profiles.reduce((best, current) => {
      const currentScore = (current.grade_level ? 1 : 0) + 
                          (current.gpa ? 1 : 0) + 
                          (current.interests?.length || 0) + 
                          (current.preferred_majors?.length || 0) +
                          (current.budget_range ? 1 : 0) +
                          (current.location_preferences?.length || 0) +
                          (current.sat_score ? 1 : 0) +
                          (current.act_score ? 1 : 0)
      
      const bestScore = (best.grade_level ? 1 : 0) + 
                       (best.gpa ? 1 : 0) + 
                       (best.interests?.length || 0) + 
                       (best.preferred_majors?.length || 0) +
                       (best.budget_range ? 1 : 0) +
                       (best.location_preferences?.length || 0) +
                       (best.sat_score ? 1 : 0) +
                       (best.act_score ? 1 : 0)
      
      return currentScore > bestScore ? current : best
    }, profiles[0])
  }

  // Get college matches count (indicates they've generated recommendations)
  let hasCollegeMatches = false
  const { count: matchesCount } = await supabase
    .from("college_matches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", studentId)
  
  if (matchesCount === null) {
    // Fallback to student_id if user_id doesn't work
    const { count: altMatchesCount } = await supabase
      .from("college_matches")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
    hasCollegeMatches = altMatchesCount && altMatchesCount > 0
  } else {
    hasCollegeMatches = matchesCount > 0
  }

  // Get college list count (indicates they've added colleges to their list)
  let hasCollegeList = false
  const { count: collegeListCount } = await supabase
    .from("my_college_list")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
  
  if (collegeListCount === null) {
    // Fallback to user_id if student_id doesn't work
    const { count: altCollegeListCount } = await supabase
      .from("my_college_list")
      .select("*", { count: "exact", head: true })
      .eq("user_id", studentId)
    hasCollegeList = altCollegeListCount && altCollegeListCount > 0
  } else {
    hasCollegeList = collegeListCount > 0
  }
  
  console.log(`📊 [DEBUG-v2] Profile completion calculation for student ${studentId}:`, { 
    profileFound: !!profile, 
    profileCount: profiles?.length || 0, 
    hasCollegeMatches,
    hasCollegeList,
    matchesCount: matchesCount || 0,
    collegeListCount: collegeListCount || 0,
    error: profileError,
    selectedProfile: profile ? {
      grade_level: profile.grade_level,
      gpa: profile.gpa,
      interests: profile.interests?.length || 0,
      preferred_majors: profile.preferred_majors?.length || 0,
      budget_range: !!profile.budget_range,
      sat_score: !!profile.sat_score,
      act_score: !!profile.act_score
    } : null
  })

  // Calculate completion based on three main categories
  let totalSections = 3
  let completedSections = 0

  // 1. Basic Profile Details (40% weight)
  let profileDetailsScore = 0
  if (profile) {
    const requiredFields = [
      'grade_level', 'gpa', 'interests', 'preferred_majors', 
      'budget_range', 'location_preferences'
    ]

    let profileFieldsCompleted = 0
    requiredFields.forEach(field => {
      const value = profile[field]
      if (value && (!Array.isArray(value) || value.length > 0)) {
        profileFieldsCompleted++
      }
    })

    // Check test scores
    if (profile.sat_score || profile.act_score) {
      profileFieldsCompleted++
    }

    const totalProfileFields = requiredFields.length + 1
    profileDetailsScore = profileFieldsCompleted / totalProfileFields
    
    // If they have basic profile details (>50% of fields), count this section as complete
    if (profileDetailsScore >= 0.5) {
      completedSections++
    }
  }

  // 2. Generated College Recommendations (30% weight)
  if (hasCollegeMatches) {
    completedSections++
  }

  // 3. Added Colleges to List (30% weight)
  if (hasCollegeList) {
    completedSections++
  }

  // Calculate final percentage
  const baseCompletion = Math.round((completedSections / totalSections) * 100)
  
  // Bonus points for having comprehensive profile details
  let bonusPoints = 0
  if (profile && profileDetailsScore >= 0.8) {
    bonusPoints = 10 // Up to 10% bonus for having most profile fields filled
  }

  const finalCompletion = Math.min(100, baseCompletion + bonusPoints)

  console.log(`📊 [DEBUG-v2] Profile completion breakdown for student ${studentId}:`, {
    profileDetailsScore: Math.round(profileDetailsScore * 100),
    hasCollegeMatches,
    hasCollegeList,
    completedSections,
    totalSections,
    baseCompletion,
    bonusPoints,
    finalCompletion
  })

  return finalCompletion
}
