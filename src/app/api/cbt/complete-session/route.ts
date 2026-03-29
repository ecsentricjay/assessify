import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('cbt_practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    // Get all answers
    const { data: answers } = await supabase
      .from('cbt_session_answers')
      .select('*')
      .eq('session_id', sessionId);

    const correctCount = (answers || []).filter(a => a.is_correct).length;
    const totalAnswered = answers?.length || 0;
    const scorePercentage = session.total_questions > 0 
      ? Math.round((correctCount / session.total_questions) * 100)
      : 0;

    // Calculate time taken
    const startTime = new Date(session.started_at || session.created_at).getTime();
    const endTime = new Date().getTime();
    const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);

    // Update session to completed
    const { error: updateError } = await supabase
      .from('cbt_practice_sessions')
      .update({
        status: 'completed',
        answered_questions: totalAnswered,
        correct_answers: correctCount,
        wrong_answers: totalAnswered - correctCount,
        score_percentage: scorePercentage,
        completed_at: new Date().toISOString(),
        time_taken_seconds: timeTakenSeconds,
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('[complete-session] Update error:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to complete session' }, { status: 500 });
    }

    // Update subscription sessions_taken count
    if (session.subscription_id) {
      const { data: subscription } = await supabase
        .from('cbt_student_subscriptions')
        .select('sessions_taken')
        .eq('id', session.subscription_id)
        .single();

      if (subscription) {
        await supabase
          .from('cbt_student_subscriptions')
          .update({ 
            sessions_taken: (subscription.sessions_taken || 0) + 1 
          })
          .eq('id', session.subscription_id);
      }
    }

    // Update question statistics
    const { data: sessionQuestions } = await supabase
      .from('cbt_session_questions')
      .select('question_id')
      .eq('session_id', sessionId);

    if (sessionQuestions) {
      for (const sq of sessionQuestions) {
        const isCorrect = (answers || []).some(a => a.question_id === sq.question_id && a.is_correct);

        const { data: currentQuestion } = await supabase
          .from('cbt_questions')
          .select('times_attempted, times_correct')
          .eq('id', sq.question_id)
          .single();

        if (currentQuestion) {
          await supabase
            .from('cbt_questions')
            .update({
              times_attempted: (currentQuestion.times_attempted || 0) + 1,
              times_correct: (currentQuestion.times_correct || 0) + (isCorrect ? 1 : 0),
            })
            .eq('id', sq.question_id);
        }
      }
    }

    console.log('[complete-session] ✅ Session completed:', sessionId);
    console.log('[complete-session] Score:', scorePercentage + '%');

    return NextResponse.json({ 
      success: true,
      result: {
        sessionId,
        scorePercentage,
        correctAnswers: correctCount,
        totalQuestions: session.total_questions,
      }
    });
  } catch (error: any) {
    console.error('[complete-session] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
