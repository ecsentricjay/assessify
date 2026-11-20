import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PASS_MARK,
  type CbtDifficulty,
  type CbtMode,
  type OptionLetter,
  type ReviewQuestion,
  type SessionResultDTO,
} from '@/lib/types/cbt.types';

/** Answers are still accepted this long after the countdown hits zero (network latency, slow phones). */
export const DEADLINE_GRACE_SECONDS = 20;

interface TimedSession {
  started_at: string | null;
  created_at: string;
  time_limit_minutes: number | null;
}

export function sessionDeadline(session: TimedSession): Date | null {
  if (!session.time_limit_minutes || session.time_limit_minutes <= 0) return null;
  const start = new Date(session.started_at ?? session.created_at).getTime();
  return new Date(start + session.time_limit_minutes * 60_000);
}

export function isPastDeadline(session: TimedSession, graceSeconds = DEADLINE_GRACE_SECONDS): boolean {
  const deadline = sessionDeadline(session);
  return !!deadline && Date.now() > deadline.getTime() + graceSeconds * 1000;
}

type FinalizeResult = { success: true; alreadyCompleted: boolean } | { success: false; error: string };

/**
 * Score and close a practice session.
 *
 * Safe to call any number of times (double-click, retry, auto-submit racing a manual submit):
 * the in_progress -> completed flip is a single conditional UPDATE, and only the request that
 * wins it runs the side effects (subscription counter, question stats).
 *
 * `clientAnswers` is the student's own snapshot of what they picked. It is used to repair any
 * answer whose individual save failed (flaky mobile data) — but only while the session is still
 * inside its time limit, and never to overwrite locked study-mode answers.
 */
export async function finalizeSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  clientAnswers?: Record<string, string>
): Promise<FinalizeResult> {
  const { data: session, error: sessionError } = await supabase
    .from('cbt_practice_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('student_id', userId)
    .maybeSingle();

  if (sessionError) return { success: false, error: sessionError.message };
  if (!session) return { success: false, error: 'Session not found' };
  if (session.status === 'completed') return { success: true, alreadyCompleted: true };
  if (session.status !== 'in_progress') return { success: false, error: 'This session was abandoned' };

  const [{ data: snapshot, error: snapshotError }, { data: savedAnswers, error: answersError }] = await Promise.all([
    supabase.from('cbt_session_questions').select('question_id, correct_answer').eq('session_id', sessionId),
    supabase.from('cbt_session_answers').select('question_id, selected_answer, is_correct').eq('session_id', sessionId),
  ]);
  if (snapshotError) return { success: false, error: snapshotError.message };
  if (answersError) return { success: false, error: answersError.message };

  const correctByQuestion = new Map<string, string>((snapshot ?? []).map((q) => [q.question_id as string, q.correct_answer as string]));
  const answerByQuestion = new Map<string, { selected: string; isCorrect: boolean }>();
  for (const a of savedAnswers ?? []) {
    if (correctByQuestion.has(a.question_id)) {
      answerByQuestion.set(a.question_id, { selected: a.selected_answer, isCorrect: !!a.is_correct });
    }
  }

  // Repair step
  if (clientAnswers && !isPastDeadline(session)) {
    const repairs: Array<Record<string, unknown>> = [];
    for (const [questionId, selected] of Object.entries(clientAnswers)) {
      if (!correctByQuestion.has(questionId)) continue;
      if (!['A', 'B', 'C', 'D'].includes(selected)) continue;
      const previous = answerByQuestion.get(questionId);
      if (previous && session.mode === 'study') continue;
      if (previous?.selected === selected) continue;
      const isCorrect = selected === correctByQuestion.get(questionId);
      repairs.push({
        session_id: sessionId,
        question_id: questionId,
        selected_answer: selected,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      });
      answerByQuestion.set(questionId, { selected, isCorrect });
    }
    if (repairs.length > 0) {
      const { error } = await supabase.from('cbt_session_answers').upsert(repairs, { onConflict: 'session_id,question_id' });
      if (error) return { success: false, error: error.message };
    }
  }

  const total: number = session.total_questions ?? correctByQuestion.size;
  const answered = answerByQuestion.size;
  const correct = [...answerByQuestion.values()].filter((a) => a.isCorrect).length;
  const score = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;

  const startedMs = new Date(session.started_at ?? session.created_at).getTime();
  let secondsTaken = Math.max(0, Math.round((Date.now() - startedMs) / 1000));
  if (session.time_limit_minutes) secondsTaken = Math.min(secondsTaken, session.time_limit_minutes * 60);

  const { data: claimed, error: claimError } = await supabase
    .from('cbt_practice_sessions')
    .update({
      status: 'completed',
      answered_questions: answered,
      unanswered: Math.max(0, total - answered),
      correct_answers: correct,
      wrong_answers: Math.max(0, answered - correct),
      score_percentage: score,
      pass_mark: PASS_MARK,
      passed: score >= PASS_MARK,
      completed_at: new Date().toISOString(),
      time_taken_seconds: secondsTaken,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('student_id', userId)
    .eq('status', 'in_progress')
    .select('id');

  if (claimError) return { success: false, error: claimError.message };
  if (!claimed || claimed.length === 0) return { success: true, alreadyCompleted: true };

  const { error: effectsError } = await supabase.rpc('cbt_finalize_session_effects', { p_session_id: sessionId });
  if (effectsError) console.error('[finalizeSession] side effects failed:', effectsError.message);

  return { success: true, alreadyCompleted: false };
}

/** Full results + review for a session. Covers unanswered questions too. */
export async function loadSessionResult(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string
): Promise<SessionResultDTO | null> {
  const { data: session } = await supabase
    .from('cbt_practice_sessions')
    .select('*, course:cbt_courses(course_code, course_title)')
    .eq('id', sessionId)
    .eq('student_id', userId)
    .maybeSingle();
  if (!session) return null;

  const [{ data: questions }, { data: answers }] = await Promise.all([
    supabase.from('cbt_session_questions').select('*').eq('session_id', sessionId).order('question_number'),
    supabase.from('cbt_session_answers').select('question_id, selected_answer, is_correct').eq('session_id', sessionId),
  ]);

  const answerByQuestion = new Map<string, { selected: OptionLetter; isCorrect: boolean }>(
    (answers ?? []).map((a) => [a.question_id as string, { selected: a.selected_answer as OptionLetter, isCorrect: !!a.is_correct }])
  );

  const byDifficulty: Record<CbtDifficulty, { total: number; correct: number }> = {
    easy: { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard: { total: 0, correct: 0 },
  };
  const topicMap = new Map<string, { total: number; correct: number }>();

  const review: ReviewQuestion[] = (questions ?? []).map((q) => {
    const answer = answerByQuestion.get(q.question_id);
    const isCorrect = !!answer?.isCorrect;
    const difficulty = (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as CbtDifficulty;

    byDifficulty[difficulty].total += 1;
    if (isCorrect) byDifficulty[difficulty].correct += 1;

    const topic = (q.topic_name as string | null) || 'General';
    const t = topicMap.get(topic) ?? { total: 0, correct: 0 };
    t.total += 1;
    if (isCorrect) t.correct += 1;
    topicMap.set(topic, t);

    return {
      id: q.question_id,
      number: q.question_number,
      text: q.question_text ?? '',
      imageUrl: q.question_image_url ?? null,
      options: {
        A: { text: q.option_a ?? '', imageUrl: q.option_a_image_url ?? null },
        B: { text: q.option_b ?? '', imageUrl: q.option_b_image_url ?? null },
        C: { text: q.option_c ?? '', imageUrl: q.option_c_image_url ?? null },
        D: { text: q.option_d ?? '', imageUrl: q.option_d_image_url ?? null },
      },
      correctAnswer: q.correct_answer as OptionLetter,
      selected: answer?.selected ?? null,
      isCorrect,
      solution: q.solution ?? null,
      solutionImageUrl: q.solution_image_url ?? null,
      difficulty,
      topicName: (q.topic_name as string | null) ?? null,
    };
  });

  const total: number = session.total_questions ?? review.length;
  const answered = review.filter((r) => r.selected).length;
  const correct = review.filter((r) => r.isCorrect).length;

  return {
    sessionId,
    courseId: session.course_id,
    courseCode: session.course?.course_code ?? '',
    courseTitle: session.course?.course_title ?? '',
    status: session.status,
    mode: (session.mode ?? 'exam') as CbtMode,
    totalQuestions: total,
    correctAnswers: correct,
    wrongAnswers: Math.max(0, answered - correct),
    unanswered: Math.max(0, total - answered),
    scorePercentage: Number(session.score_percentage ?? (total > 0 ? Math.round((correct / total) * 1000) / 10 : 0)),
    passed: session.passed ?? (total > 0 ? (correct / total) * 100 >= PASS_MARK : false),
    passMark: Number(session.pass_mark ?? PASS_MARK),
    timeTakenSeconds: session.time_taken_seconds ?? 0,
    timeLimitMinutes: session.time_limit_minutes ?? null,
    completedAt: session.completed_at ?? null,
    byDifficulty,
    byTopic: [...topicMap.entries()]
      .map(([topic, v]) => ({ topic, ...v }))
      .sort((a, b) => a.correct / a.total - b.correct / b.total),
    questions: review,
  };
}
