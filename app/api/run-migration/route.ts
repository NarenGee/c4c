import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { scriptName } = await request.json()
    
    if (!scriptName) {
      return NextResponse.json({ success: false, error: "Script name is required" })
    }

    const adminClient = createAdminClient()
    
    // Read the SQL script
    const scriptPath = path.join(process.cwd(), "scripts", scriptName)
    
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ 
        success: false, 
        error: `Script not found: ${scriptName}` 
      })
    }

    const sqlContent = fs.readFileSync(scriptPath, "utf8")
    
    console.log(`Running migration script: ${scriptName}`)
    console.log("SQL content:", sqlContent)

    // Execute the SQL
    const { error } = await adminClient.rpc("exec_sql", { sql: sqlContent })

    if (error) {
      console.error("Migration error:", error)
      return NextResponse.json({ 
        success: false, 
        error: `Migration failed: ${error.message}` 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Migration ${scriptName} completed successfully` 
    })

  } catch (error: any) {
    console.error("Migration API error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: false, 
    error: "Please use POST method with scriptName parameter" 
  })
} 