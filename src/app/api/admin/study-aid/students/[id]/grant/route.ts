// app/api/admin/study-aid/students/[id]/grant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const studentId = params.id;
    const body = await request.json();
    const { attempts } = body;

    if (!attempts || attempts <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid attempt count' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current credits
    const { data: credits } = await supabase
      .from('study_attempt_credits')
      .select('total_free_attempts')
      .eq('student_id', studentId)
      .single();

    if (!credits) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Grant free attempts
    const { error } = await supabase
      .from('study_attempt_credits')
      .update({
        total_free_attempts: credits.total_free_attempts + attempts,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Granted ${attempts} free attempts`,
      newTotal: credits.total_free_attempts + attempts
    });

  } catch (error) {
    console.error('[Grant Attempts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grant attempts' },
      { status: 500 }
    );
  }
}
