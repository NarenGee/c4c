import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get student's task states
    const { data: taskStates, error } = await supabase
      .from('student_task_states')
      .select('*')
      .eq('student_id', user.id);

    if (error) {
      console.error('Error fetching task states:', error);
      return NextResponse.json({ error: "Failed to fetch task states" }, { status: 500 });
    }

    return NextResponse.json({ taskStates: taskStates || [] });
  } catch (error) {
    console.error('Task states API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskStates } = await request.json();
    const supabase = await createClient();

    // Upsert task states
    const { error } = await supabase
      .from('student_task_states')
      .upsert(
        taskStates.map((task: any) => ({
          student_id: user.id,
          task_id: task.id,
          completed: task.completed,
          status: task.status,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'student_id,task_id' }
      );

    if (error) {
      console.error('Error saving task states:', error);
      return NextResponse.json({ error: "Failed to save task states" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save task states API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
