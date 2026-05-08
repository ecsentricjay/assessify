// app/api/admin/study-aid/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Get all students with their credits
    const { data: credits, error } = await supabase
      .from('study_attempt_credits')
      .select(`
        student_id,
        total_free_attempts,
        used_free_attempts,
        remaining_free_attempts,
        purchased_attempts,
        used_paid_attempts,
        remaining_paid_attempts,
        total_attempts_used,
        total_amount_spent,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const studentIds = credits?.map(c => c.student_id) || [];
    
    // Get student profiles (name only)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', studentIds)
      .eq('role', 'student');
    
    if (profilesError) throw profilesError;
    
    // Create a map for O(1) lookup
    const profilesById = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const students = credits?.map((credit) => {
      const profile = profilesById.get(credit.student_id);
      return {
        id: credit.student_id,
        name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        ...credit,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      students,
      total: students.length
    });

  } catch (error) {
    console.error('[Get Students] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
