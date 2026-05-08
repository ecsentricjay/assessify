// app/api/admin/study-aid/dashboard/route.ts
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

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    const supabase = await createClient();

    // Calculate date filter
    let dateFilter = null;
    if (range === '7d') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      dateFilter = date.toISOString();
    } else if (range === '30d') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      dateFilter = date.toISOString();
    }

    // Get total students with credits
    const { count: totalStudents } = await supabase
      .from('study_attempt_credits')
      .select('*', { count: 'exact', head: true });

    // Get active students (used at least once)
    const { count: activeStudents } = await supabase
      .from('study_attempt_credits')
      .select('*', { count: 'exact', head: true })
      .gt('total_attempts_used', 0);

    // Get study-aid purchases (actual revenue) with date filter
    let purchasesQuery = supabase
      .from('study_attempt_purchases')
      .select('amount_paid, created_at');

    if (dateFilter) {
      purchasesQuery = purchasesQuery.gte('created_at', dateFilter);
    }

    const { data: purchases } = await purchasesQuery;
    const totalRevenue = (purchases || []).reduce((sum, p) => sum + (p.amount_paid || 0), 0);

    // Get attempts with date filter
    let attemptsQuery = supabase
      .from('study_attempts')
      .select('id, is_free, question_count, status');

    if (dateFilter) {
      attemptsQuery = attemptsQuery.gte('created_at', dateFilter);
    }

    const { data: attempts } = await attemptsQuery;

    const totalAttempts = attempts?.length || 0;
    const freeAttempts = attempts?.filter(a => a.is_free).length || 0;
    const paidAttempts = attempts?.filter(a => !a.is_free).length || 0;
    const totalQuestions = attempts?.reduce((sum, a) => sum + (a.question_count || 0), 0) || 0;

    // Average attempts per student
    const averageAttemptsPerStudent = totalStudents ? totalAttempts / totalStudents : 0;

    // Popular courses
    let coursesQuery = supabase
      .from('study_attempts')
      .select('course_code, course_title');

    if (dateFilter) {
      coursesQuery = coursesQuery.gte('created_at', dateFilter);
    }

    const { data: courseAttempts } = await coursesQuery;

    const courseCounts: Record<string, { code: string; title: string; count: number }> = {};
    courseAttempts?.forEach(attempt => {
      const key = attempt.course_code;
      if (!courseCounts[key]) {
        courseCounts[key] = {
          code: attempt.course_code,
          title: attempt.course_title || '',
          count: 0
        };
      }
      courseCounts[key].count++;
    });

    const popularCourses = Object.values(courseCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(c => ({
        course_code: c.code,
        course_title: c.title,
        attempt_count: c.count
      }));

    // Recent activity
    let activityQuery = supabase
      .from('study_attempts')
      .select(`
        id,
        course_code,
        question_format,
        is_free,
        created_at,
        student_id
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentAttempts } = await activityQuery;

    // Get student names for recent activity
    const studentIds = recentAttempts?.map(a => a.student_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', studentIds);

    const recentActivity = recentAttempts?.map(attempt => {
      const profile = profiles?.find(p => p.id === attempt.student_id);
      return {
        id: attempt.id,
        student_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        course_code: attempt.course_code,
        question_format: attempt.question_format,
        is_free: attempt.is_free,
        created_at: attempt.created_at
      };
    }) || [];

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalAttempts,
        freeAttempts,
        paidAttempts,
        totalRevenue,
        totalQuestions,
        averageAttemptsPerStudent,
        popularCourses,
        recentActivity
      }
    });

  } catch (error) {
    console.error('[Admin Dashboard] Error:', error);
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