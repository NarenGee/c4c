import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const requestStart = Date.now()
  const isDev = process.env.NODE_ENV !== "production"
  try {
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
    if (user.current_role !== "coach" && user.role !== "coach") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Coach access required" },
        { status: 401 }
      )
    }

    const { data: assignments, error: assignmentsError } = await adminClient
      .from("coach_student_assignments")
      .select("student_id, assigned_at")
      .eq("coach_id", user.id)
      .eq("is_active", true)

    if (assignmentsError) {
      console.error("Assignment error:", assignmentsError)
      return NextResponse.json(
        { success: false, error: "Failed to fetch assignments" },
        { status: 500 }
      )
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        success: true,
        students: [],
      })
    }

    const studentIds = assignments.map((assignment) => assignment.student_id)
    const studentIdSet = new Set(studentIds)
    const assignmentByStudentId = new Map(
      assignments.map((assignment) => [assignment.student_id, assignment])
    )

    const queryStart = Date.now()
    const [
      studentsResult,
      profilesResult,
      matchesByUserIdResult,
      matchesByStudentIdResult,
      collegeByStudentIdResult,
      collegeByUserIdResult,
      authUsersResult,
    ] = await Promise.all([
      adminClient
        .from("users")
        .select("id, full_name, email")
        .in("id", studentIds),
      adminClient
        .from("student_profiles")
        .select("user_id, grade_level, gpa, country_of_residence, interests, preferred_majors, budget_range, location_preferences, sat_score, act_score, updated_at")
        .in("user_id", studentIds)
        .order("updated_at", { ascending: false }),
      adminClient
        .from("college_matches")
        .select("id, user_id, student_id")
        .in("user_id", studentIds),
      adminClient
        .from("college_matches")
        .select("id, user_id, student_id")
        .in("student_id", studentIds),
      adminClient
        .from("my_college_list")
        .select("id, student_id, user_id, application_stage")
        .in("student_id", studentIds),
      adminClient
        .from("my_college_list")
        .select("id, student_id, user_id, application_stage")
        .in("user_id", studentIds),
      Promise.all(
        studentIds.map(async (studentId) => {
          try {
            const { data: authUser } = await adminClient.auth.admin.getUserById(studentId)
            return [studentId, authUser?.user?.last_sign_in_at ?? null] as const
          } catch {
            return [studentId, null] as const
          }
        })
      ),
    ])
    const queryMs = Date.now() - queryStart

    if (studentsResult.error) {
      console.error("Failed to fetch student users:", studentsResult.error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch students" },
        { status: 500 }
      )
    }
    if (profilesResult.error) {
      console.error("Failed to fetch profiles:", profilesResult.error)
    }
    if (matchesByUserIdResult.error || matchesByStudentIdResult.error) {
      console.error("Failed to fetch matches:", matchesByUserIdResult.error || matchesByStudentIdResult.error)
    }
    if (collegeByStudentIdResult.error || collegeByUserIdResult.error) {
      console.error("Failed to fetch college list:", collegeByStudentIdResult.error || collegeByUserIdResult.error)
    }

    const studentsById = new Map(
      (studentsResult.data ?? []).map((student) => [student.id, student])
    )

    const profilesByStudentId = new Map<string, any[]>()
    for (const profile of profilesResult.data ?? []) {
      const profileList = profilesByStudentId.get(profile.user_id) ?? []
      profileList.push(profile)
      profilesByStudentId.set(profile.user_id, profileList)
    }

    const matchesByStudentId = new Map<string, Set<string>>()
    const allMatches = [
      ...(matchesByUserIdResult.data ?? []),
      ...(matchesByStudentIdResult.data ?? []),
    ]
    for (const match of allMatches) {
      const possibleIds = [match.user_id, match.student_id].filter((value): value is string => !!value)
      for (const possibleId of possibleIds) {
        if (!studentIdSet.has(possibleId)) continue
        const set = matchesByStudentId.get(possibleId) ?? new Set<string>()
        set.add(match.id)
        matchesByStudentId.set(possibleId, set)
      }
    }

    const applicationProgressByStudentId = new Map<
      string,
      {
        considering: number
        planning_to_apply: number
        applied: number
        interviewing: number
        accepted: number
        rejected: number
        enrolled: number
        total: number
      }
    >()
    const seenCollegeRowsByStudentId = new Map<string, Set<string>>()
    const allCollegeRows = [
      ...(collegeByStudentIdResult.data ?? []),
      ...(collegeByUserIdResult.data ?? []),
    ]
    for (const row of allCollegeRows) {
      const possibleIds = [row.student_id, row.user_id].filter((value): value is string => !!value)
      for (const possibleId of possibleIds) {
        if (!studentIdSet.has(possibleId)) continue
        const seen = seenCollegeRowsByStudentId.get(possibleId) ?? new Set<string>()
        if (seen.has(row.id)) {
          continue
        }
        seen.add(row.id)
        seenCollegeRowsByStudentId.set(possibleId, seen)

        const progress = applicationProgressByStudentId.get(possibleId) ?? {
          considering: 0,
          planning_to_apply: 0,
          applied: 0,
          interviewing: 0,
          accepted: 0,
          rejected: 0,
          enrolled: 0,
          total: 0,
        }
        const stage = row.application_stage || "considering"
        if (stage in progress) {
          progress[stage as keyof Omit<typeof progress, "total">] += 1
        } else {
          progress.considering += 1
        }
        progress.total += 1
        applicationProgressByStudentId.set(possibleId, progress)
      }
    }

    const authByStudentId = new Map(authUsersResult)
    const responseBuildStart = Date.now()
    const students = studentIds
      .map((studentId) => {
        const student = studentsById.get(studentId)
        if (!student) return null

        const profiles = profilesByStudentId.get(studentId) ?? []
        const bestProfile = pickBestProfile(profiles)
        const matchesCount = matchesByStudentId.get(studentId)?.size ?? 0
        const progress = applicationProgressByStudentId.get(studentId) ?? {
          considering: 0,
          planning_to_apply: 0,
          applied: 0,
          interviewing: 0,
          accepted: 0,
          rejected: 0,
          enrolled: 0,
          total: 0,
        }
        const profileCompletion = calculateProfileCompletion(bestProfile, matchesCount > 0, progress.total > 0)

        return {
          id: student.id,
          full_name: student.full_name,
          email: student.email,
          grade_level: bestProfile?.grade_level,
          gpa: bestProfile?.gpa,
          country_of_residence: bestProfile?.country_of_residence,
          profile_completion: profileCompletion,
          college_matches_count: matchesCount,
          college_list_count: progress.total,
          application_progress: {
            considering: progress.considering,
            planning_to_apply: progress.planning_to_apply,
            applied: progress.applied,
            interviewing: progress.interviewing,
            accepted: progress.accepted,
            rejected: progress.rejected,
            enrolled: progress.enrolled,
          },
          assigned_at: assignmentByStudentId.get(studentId)?.assigned_at,
          last_sign_in_at: authByStudentId.get(studentId) ?? null,
        }
      })
      .filter(Boolean)

    const responseBuildMs = Date.now() - responseBuildStart
    const totalMs = Date.now() - requestStart
    const response: Record<string, unknown> = {
      success: true,
      students,
    }
    if (isDev) {
      response.timings = {
        query_ms: queryMs,
        response_build_ms: responseBuildMs,
        total_ms: totalMs,
      }
    }
    return NextResponse.json(response)

  } catch (error: any) {
    console.error("Error fetching coach students:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

function pickBestProfile(profiles: any[]): any | null {
  if (!profiles || profiles.length === 0) return null
  return profiles.reduce((best, current) => {
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

function calculateProfileCompletion(
  profile: any | null,
  hasCollegeMatches: boolean,
  hasCollegeList: boolean
): number {
  // Calculate completion based on three main categories
  const totalSections = 3
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

  return finalCompletion
}
