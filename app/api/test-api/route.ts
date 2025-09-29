import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("🧪 TEST API: Simple test route called")
  
  try {
    const body = await request.json()
    console.log("🧪 TEST API: Request body:", body)
    
    const result = {
      success: true,
      message: "Test API route is working!",
      timestamp: new Date().toISOString(),
      receivedData: body
    }
    
    console.log("🧪 TEST API: Returning result:", result)
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error("🧪 TEST API: Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  console.log("🧪 TEST API: GET request")
  return NextResponse.json({ 
    message: "Test API GET is working!",
    timestamp: new Date().toISOString()
  })
} 