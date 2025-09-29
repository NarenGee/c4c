import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Try to insert a test row with all columns
    const testData = {
      grading_system: 'test',
      a_level_subjects: [],
      ib_subjects: [],
      ib_total_points: null,
      extracurricular_details: []
    }

    const { error: insertError } = await supabase
      .from('student_profiles')
      .insert(testData)
      .select()

    // Check which columns caused the error
    const missingColumns = []
    if (insertError) {
      const errorMsg = insertError.message.toLowerCase()
      if (errorMsg.includes('grading_system')) missingColumns.push('grading_system')
      if (errorMsg.includes('a_level_subjects')) missingColumns.push('a_level_subjects')
      if (errorMsg.includes('ib_subjects')) missingColumns.push('ib_subjects')
      if (errorMsg.includes('ib_total_points')) missingColumns.push('ib_total_points')
      if (errorMsg.includes('extracurricular_details')) missingColumns.push('extracurricular_details')
    }

    return NextResponse.json({
      success: true,
      missingColumns,
      error: insertError ? insertError.message : null,
      note: "If no error and missingColumns is empty, all columns exist"
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to get schema"
    })
  }
} 