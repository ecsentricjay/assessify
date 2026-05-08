// app/api/study-aid/attempts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.profile?.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can access this resource' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch all attempts for this student
    const { data: attempts, error } = await supabase
      .from('study_attempts')
      .select('id, course_code, course_title, topic, question_format, question_count, is_free, cost_naira, status, created_at, completed_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Get Attempts] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attempts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attempts: attempts || [],
      total: attempts?.length || 0,
    });

  } catch (error) {
    console.error('[Get Attempts] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}