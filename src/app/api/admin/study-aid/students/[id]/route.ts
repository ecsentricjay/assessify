// app/api/admin/study-aid/students/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export async function PATCH(
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
    const { totalFreeAttempts, purchasedAttempts } = body;

    const supabase = await createClient();

    // Update credits (only SOURCE columns)
    const { error } = await supabase
      .from('study_attempt_credits')
      .update({
        total_free_attempts: totalFreeAttempts,
        purchased_attempts: purchasedAttempts,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Credits updated successfully'
    });

  } catch (error) {
    console.error('[Update Credits] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update credits' },
      { status: 500 }
    );
  }
}
