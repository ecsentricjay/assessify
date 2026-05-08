// app/api/study-aid/attempts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;

    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: 'Attempt ID required' },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch attempt
    const { data: attempt, error } = await supabase
      .from('study_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('student_id', user.id) // Security: only own attempts
      .single();

    if (error) {
      console.error('[Get Attempt] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: 'Attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt: attempt,
    });

  } catch (error) {
    console.error('[Get Attempt] Unexpected error:', error);
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