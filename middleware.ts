import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Only apply middleware to protected routes
    if (!pathname.startsWith('/college-recommendations') && 
        !pathname.startsWith('/college-list')) {
      return NextResponse.next()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, "current_role"')
      .eq('id', user.id)
      .single()

    if (userProfile) {
      const currentRole = userProfile.current_role || userProfile.role

      // Super admins and parents shouldn't access college recommendation/list pages
      if (currentRole === 'super_admin' || currentRole === 'parent') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Coaches might have limited access - redirect to their dashboard for now
      if (currentRole === 'coach') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return NextResponse.next()

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/college-recommendations/:path*',
    '/college-list/:path*'
  ]
}