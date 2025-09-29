"use client"
/**
 * Client-side helpers for fetching and mutating the current user's
 * AI college matches.  These wrap the browser Supabase client so
 * they can be used directly in React client components.
 */

import { createClient } from "@/lib/supabase/client"

export interface CollegeMatch {
  id: string
  student_id: string
  college_name: string
  match_score: number // 0-1 decimal
  admission_chance: number // 0-1 decimal representing percentage chance
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
  is_dream_college?: boolean // Indicates if this college was selected as a dream college
}

/* ────────────────────────────────────────────────────────────
   GET all matches for the signed-in student
   ──────────────────────────────────────────────────────────── */
export async function getStudentCollegeMatches(): Promise<{
  success: boolean
  error?: string
  matches?: CollegeMatch[]
}> {
  try {
    const supabase = createClient()

    // Ensure we have an authenticated user
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return { success: false, error: "User not authenticated" }
    }

    const { data, error } = await supabase
      .from("college_matches")
      .select("*")
      .eq("student_id", user.id)
      .order("match_score", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "Failed to load matches" }
    }

    return { success: true, matches: data || [] }
  } catch (err: any) {
    console.error("getStudentCollegeMatches() error:", err)
    return { success: false, error: err.message || "Unexpected error" }
  }
}

/* ────────────────────────────────────────────────────────────
   DELETE every match for the current user
   ──────────────────────────────────────────────────────────── */
export async function deleteCollegeMatches(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr || !user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabase.from("college_matches").delete().eq("student_id", user.id)

    if (error) {
      console.error("Supabase error:", error)
      return { success: false, error: "Failed to delete matches" }
    }

    return { success: true }
  } catch (err: any) {
    console.error("deleteCollegeMatches() error:", err)
    return { success: false, error: err.message || "Unexpected error" }
  }
}

export async function updateDreamCollegeDetails(collegeName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Call the server action to update dream college details
    const response = await fetch('/api/update-dream-college-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: user.id,
        collegeName: collegeName
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Failed to update dream college details' }
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error updating dream college details:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function syncDreamColleges(dreamColleges: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Import and call the server action directly
    const { syncDreamColleges: serverSyncDreamColleges } = await import('@/app/actions/college-matching')
    
    const result = await serverSyncDreamColleges(user.id, dreamColleges)
    return result
  } catch (error) {
    console.error('Error syncing dream colleges:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
