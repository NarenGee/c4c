import { NextRequest, NextResponse } from 'next/server'
import { updateDreamCollegeDetails } from '@/app/actions/college-matching'

export async function POST(request: NextRequest) {
  try {
    const { studentId, collegeName } = await request.json()
    
    if (!studentId || !collegeName) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId and collegeName' },
        { status: 400 }
      )
    }
    
    const result = await updateDreamCollegeDetails(studentId, collegeName)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to update dream college details' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in update-dream-college-details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


