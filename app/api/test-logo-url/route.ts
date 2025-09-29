import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const logoUrl = `${baseUrl}/logo.png`
  
  return NextResponse.json({
    baseUrl,
    logoUrl,
    envVar: process.env.NEXT_PUBLIC_APP_URL,
    fullLogoUrl: logoUrl
  })
} 