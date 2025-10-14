import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get student's notes and actions
    const { data: notes, error } = await supabase
      .from('student_notes')
      .select(`
        id,
        content,
        author,
        author_id,
        type,
        created_at,
        college_name,
        country,
        action_status,
        priority,
        due_date,
        visible_to_student,
        parent_note_id,
        is_reply
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error) {
    console.error('Notes API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notes } = await request.json();
    const supabase = await createClient();

    console.log('Saving notes:', notes);

    if (notes.length > 0) {
      // Separate main notes and replies
      const mainNotes = notes.filter((note: any) => !note.is_reply);
      const replies = notes.filter((note: any) => note.is_reply);

      // First, upsert main notes
      if (mainNotes.length > 0) {
        const { error: mainError } = await supabase
          .from('student_notes')
          .upsert(
            mainNotes.map((note: any) => ({
              id: note.id,
              student_id: user.id,
              content: note.content,
              author: note.author,
              author_id: note.author_id || user.id,
              type: note.type,
              created_at: note.created_at,
              college_name: note.college_name,
              country: note.country,
              action_status: note.action_status,
              priority: note.priority,
              due_date: note.due_date,
              visible_to_student: note.visible_to_student !== undefined ? note.visible_to_student : true,
              parent_note_id: null,
              is_reply: false
            })),
            { onConflict: 'id' }
          );

        if (mainError) {
          console.error('Error saving main notes:', mainError);
          return NextResponse.json({ error: `Failed to save main notes: ${mainError.message}` }, { status: 500 });
        }
      }

      // Then, upsert replies
      if (replies.length > 0) {
        const { error: repliesError } = await supabase
          .from('student_notes')
          .upsert(
            replies.map((note: any) => ({
              id: note.id,
              student_id: user.id,
              content: note.content,
              author: note.author,
              author_id: note.author_id || user.id,
              type: note.type,
              created_at: note.created_at,
              college_name: note.college_name,
              country: note.country,
              action_status: note.action_status,
              priority: note.priority,
              due_date: note.due_date,
              visible_to_student: note.visible_to_student !== undefined ? note.visible_to_student : true,
              parent_note_id: note.parent_note_id,
              is_reply: true
            })),
            { onConflict: 'id' }
          );

        if (repliesError) {
          console.error('Error saving replies:', repliesError);
          return NextResponse.json({ error: `Failed to save replies: ${repliesError.message}` }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save notes API error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
