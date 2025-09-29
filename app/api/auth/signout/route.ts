import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    
    return NextResponse.redirect(new URL("/", request.url))
  } catch (error) {
    console.error("Sign out error:", error)
    return NextResponse.redirect(new URL("/", request.url))
  }
} 