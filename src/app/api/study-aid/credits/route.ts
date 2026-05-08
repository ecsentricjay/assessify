// app/api/study-aid/credits/route.ts
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

    // Get or create credits
    let { data: credits, error } = await supabase
      .from('study_attempt_credits')
      .select('remaining_free_attempts, remaining_paid_attempts, total_attempts_used, total_amount_spent')
      .eq('student_id', user.id)
      .single();

    // If no record exists, create one with defaults
    if (error?.code === 'PGRST116') {
      const { data: newCredits, error: createError } = await supabase
        .from('study_attempt_credits')
        .insert({ student_id: user.id })
        .select('remaining_free_attempts, remaining_paid_attempts, total_attempts_used, total_amount_spent')
        .single();

      if (createError) {
        console.error('[Credits API] Create error:', createError);
        return NextResponse.json(
          { success: false, error: 'Failed to initialize credits' },
          { status: 500 }
        );
      }

      credits = newCredits;
    } else if (error) {
      console.error('[Credits API] Fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      freeRemaining: credits?.remaining_free_attempts ?? 3,
      paidRemaining: credits?.remaining_paid_attempts ?? 0,
      totalUsed: credits?.total_attempts_used ?? 0,
      totalSpent: credits?.total_amount_spent ?? 0,
    });

  } catch (error) {
    console.error('[Credits API] Unexpected error:', error);
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