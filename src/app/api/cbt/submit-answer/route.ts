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
    const { sessionId, questionId, selectedAnswer } = body;

    if (!sessionId || !questionId || !selectedAnswer) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('cbt_practice_sessions')
      .select('id, student_id')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .eq('status', 'in_progress')
      .single();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 403 });
    }

    // Get correct answer
    const { data: question } = await supabase
      .from('cbt_session_questions')
      .select('correct_answer')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .single();

    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    const isCorrect = selectedAnswer === question.correct_answer;

    // Save answer (upsert in case they change their answer)
    const { error: upsertError } = await supabase
      .from('cbt_session_answers')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
      });

    if (upsertError) {
      console.error('[submit-answer] Upsert error:', upsertError);
      return NextResponse.json({ success: false, error: 'Failed to save answer' }, { status: 500 });
    }

    // Update session progress
    const { data: answers } = await supabase
      .from('cbt_session_answers')
      .select('is_correct')
      .eq('session_id', sessionId);

    const correctCount = (answers || []).filter(a => a.is_correct).length;
    const totalAnswered = answers?.length || 0;

    await supabase
      .from('cbt_practice_sessions')
      .update({
        answered_questions: totalAnswered,
        correct_answers: correctCount,
        wrong_answers: totalAnswered - correctCount,
      })
      .eq('id', sessionId);

    return NextResponse.json({ success: true, isCorrect });
  } catch (error: any) {
    console.error('[submit-answer] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
