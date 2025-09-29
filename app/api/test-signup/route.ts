import { NextRequest, NextResponse } from "next/server"
import { signupUser } from "@/app/actions/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role, invitationToken } = await request.json()

    console.log("🧪 Testing signup with:", { email, role, invitationToken })

    const result = await signupUser({
      email,
      password,
      fullName,
      role,
      invitationToken
    })

    console.log("🧪 Signup result:", result)

    return NextResponse.json({
      success: true,
      message: "Signup test completed",
      result
    })

  } catch (error: any) {
    console.error("🧪 Signup test error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Signup test failed"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Signup test endpoint - use POST with email, password, fullName, role, and optionally invitationToken",
    example: {
      email: "test@example.com",
      password: "testpassword",
      fullName: "Test User",
      role: "parent",
      invitationToken: "uuid-token-here"
    }
  })
} 