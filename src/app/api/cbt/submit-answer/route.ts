import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserId } from '@/lib/services/cbt-access.service';
import { isPastDeadline } from '@/lib/services/cbt-session.service';

/**
 * POST { sessionId, questionId, selectedAnswer }
 * Saves (or changes) one answer. Exam mode returns just { success }.
 * Study mode locks the answer on first submit and returns instant feedback.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { sessionId, questionId, selectedAnswer } = await request.json();
    if (!sessionId || !questionId || !['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid fields' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: session } = await supabase
      .from('cbt_practice_sessions')
      .select('id, status, mode, started_at, created_at, time_limit_minutes')
      .eq('id', sessionId)
      .eq('student_id', userId)
      .maybeSingle();

    if (!session || session.status !== 'in_progress') {
      return NextResponse.json({ success: false, error: 'This session is no longer active' }, { status: 409 });
    }
    if (isPastDeadline(session)) {
      return NextResponse.json({ success: false, error: 'Time is up', expired: true }, { status: 409 });
    }

    const [{ data: question }, { data: existing }] = await Promise.all([
      supabase
        .from('cbt_session_questions')
        .select('correct_answer, solution, solution_image_url')
        .eq('session_id', sessionId)
        .eq('question_id', questionId)
        .maybeSingle(),
      supabase
        .from('cbt_session_answers')
        .select('selected_answer, is_correct')
        .eq('session_id', sessionId)
        .eq('question_id', questionId)
        .maybeSingle(),
    ]);

    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found in this session' }, { status: 404 });
    }

    const isStudy = session.mode === 'study';
    const feedback = (selected: string, isCorrect: boolean) => ({
      selectedAnswer: selected,
      isCorrect,
      correctAnswer: question.correct_answer,
      solution: question.solution ?? null,
      solutionImageUrl: question.solution_image_url ?? null,
    });

    // Study mode: first answer is final
    if (isStudy && existing) {
      return NextResponse.json({ success: true, locked: true, ...feedback(existing.selected_answer, !!existing.is_correct) });
    }

    const isCorrect = selectedAnswer === question.correct_answer;
    const { error } = await supabase.from('cbt_session_answers').upsert(
      {
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,question_id' }
    );

    if (error) {
      console.error('[submit-answer]', error.message);
      return NextResponse.json({ success: false, error: 'Failed to save answer' }, { status: 500 });
    }

    return NextResponse.json(isStudy ? { success: true, ...feedback(selectedAnswer, isCorrect) } : { success: true });
  } catch (error) {
    console.error('[submit-answer]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
