import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Test if linked_at column exists
    const { data: testData, error: testError } = await supabase
      .from('student_links')
      .select('linked_at')
      .limit(1)

    if (testError && testError.message.includes('linked_at')) {
      // Column doesn't exist, provide SQL to run manually
      const migrationSql = `-- Run this SQL in your Supabase dashboard:
-- Go to SQL Editor and paste the following:

-- Add linked_at column to student_links table
ALTER TABLE student_links ADD COLUMN linked_at timestamp with time zone;

-- Update existing records with linked_at set to created_at for accepted links
UPDATE student_links 
SET linked_at = created_at 
WHERE status = 'accepted' AND linked_at IS NULL;

-- Create an index for better performance on linked_at queries
CREATE INDEX IF NOT EXISTS idx_student_links_linked_at ON student_links(student_id, linked_at DESC);`
      
      return NextResponse.json({
        success: false,
        error: "Migration required",
        message: "The linked_at column doesn't exist in the student_links table. Please run the SQL below in your Supabase dashboard.",
        sql: migrationSql,
        migrationNeeded: true
      })
    }

    if (testError) {
      return NextResponse.json({
        success: false,
        error: "Database error",
        message: testError.message
      })
    }

    return NextResponse.json({
      success: true,
      message: "linked_at column already exists in student_links table. Migration not needed.",
      migrationNeeded: false
    })

  } catch (error: any) {
    console.error("Migration check error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to check migration status"
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
} 