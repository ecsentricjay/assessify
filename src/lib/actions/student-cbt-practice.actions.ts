'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthUserId, isSubscriptionRequired, resolveCbtAccess } from '@/lib/services/cbt-access.service';
import {
  finalizeSession,
  isPastDeadline,
  loadSessionResult,
  sessionDeadline,
} from '@/lib/services/cbt-session.service';
import {
  PASS_MARK,
  type AnswerState,
  type CbtDifficulty,
  type CbtMode,
  type OptionLetter,
  type PracticeConfig,
  type PracticeCourseCard,
  type PracticeSessionDTO,
  type SessionQuestionDTO,
} from '@/lib/types/cbt.types';

const MAX_QUESTIONS_PER_SESSION = 200;

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : (e as { message?: string })?.message || 'Something went wrong');

/** Active question ids/metadata for a course. Pages through results (Supabase caps a request at 1000 rows). */
async function fetchQuestionMeta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  filters?: { difficulty?: CbtDifficulty | 'all'; topicIds?: string[] }
) {
  const rows: Array<{ id: string; difficulty: CbtDifficulty; topic_id: string | null }> = [];
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from('cbt_questions')
      .select('id, difficulty, topic_id')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('id')
      .range(from, from + 999);
    if (filters?.difficulty && filters.difficulty !== 'all') query = query.eq('difficulty', filters.difficulty);
    if (filters?.topicIds?.length) query = query.in('topic_id', filters.topicIds);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...((data ?? []) as typeof rows));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Setup screen data
// ---------------------------------------------------------------------------

export async function getPracticeConfigOptions(courseId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();

  try {
    const access = await resolveCbtAccess(supabase, userId, courseId);
    if (!access.allowed) {
      return { success: false as const, error: access.reason ?? 'No access', needsSubscription: !!access.needsSubscription };
    }

    const [{ data: course, error: courseError }, questions, { data: topicRows }] = await Promise.all([
      supabase.from('cbt_courses').select('course_code, course_title').eq('id', courseId).maybeSingle(),
      fetchQuestionMeta(supabase, courseId),
      supabase.from('cbt_topics').select('id, topic_name').eq('course_id', courseId).order('topic_name'),
    ]);
    if (courseError) throw courseError;
    if (!course) return { success: false as const, error: 'Course not found' };
    if (questions.length === 0) return { success: false as const, error: 'No questions have been added to this course yet' };

    const topicCounts = new Map<string, number>();
    questions.forEach((q) => q.topic_id && topicCounts.set(q.topic_id, (topicCounts.get(q.topic_id) ?? 0) + 1));

    // Resume banner: the newest unfinished session. If it already ran out of time, close it now.
    let activeSession: PracticeConfig['activeSession'] = null;
    const { data: openSessions } = await supabase
      .from('cbt_practice_sessions')
      .select('*')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1);

    const open = openSessions?.[0];
    if (open) {
      if (isPastDeadline(open)) {
        await finalizeSession(supabase, userId, open.id);
      } else {
        const { count } = await supabase
          .from('cbt_session_answers')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', open.id);
        activeSession = {
          id: open.id,
          totalQuestions: open.total_questions,
          answered: count ?? 0,
          mode: (open.mode ?? 'exam') as CbtMode,
          deadlineAt: sessionDeadline(open)?.toISOString() ?? null,
        };
      }
    }

    const { data: recent } = await supabase
      .from('cbt_practice_sessions')
      .select('id, score_percentage, total_questions, completed_at')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);

    const sub = access.subscription;
    const config: PracticeConfig = {
      courseId,
      courseCode: course.course_code ?? '',
      courseTitle: course.course_title ?? '',
      totalQuestions: questions.length,
      questionsByDifficulty: {
        easy: questions.filter((q) => q.difficulty === 'easy').length,
        medium: questions.filter((q) => q.difficulty === 'medium').length,
        hard: questions.filter((q) => q.difficulty === 'hard').length,
      },
      topics: (topicRows ?? [])
        .map((t) => ({ id: t.id as string, name: t.topic_name as string, count: topicCounts.get(t.id) ?? 0 }))
        .filter((t) => t.count > 0),
      accessMode: access.mode,
      sessionsRemaining: sub?.maxSessions ? Math.max(0, sub.maxSessions - sub.sessionsTaken) : null,
      activeSession,
      recentSessions: (recent ?? []).map((s) => ({
        id: s.id,
        scorePercentage: Number(s.score_percentage ?? 0),
        totalQuestions: s.total_questions,
        completedAt: s.completed_at,
      })),
    };
    return { success: true as const, config };
  } catch (error) {
    return { success: false as const, error: errorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Start / load a session
// ---------------------------------------------------------------------------

export interface StartPracticeInput {
  courseId: string;
  questionCount: number;
  difficulty?: CbtDifficulty | 'all';
  topicIds?: string[];
  /** null / 0 = untimed */
  timeLimitMinutes?: number | null;
  mode?: CbtMode;
  /** Retry specific questions (e.g. "practise the ones I got wrong") */
  questionIds?: string[];
}

export async function startPracticeSession(input: StartPracticeInput) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();

  try {
    const count = Math.floor(Number(input.questionCount));
    if (!Number.isFinite(count) || count < 1) return { success: false as const, error: 'Choose at least 1 question' };
    const timeLimit = input.timeLimitMinutes && input.timeLimitMinutes > 0 ? Math.min(Math.floor(input.timeLimitMinutes), 300) : null;
    const mode: CbtMode = input.mode === 'study' ? 'study' : 'exam';
    const difficulty = input.difficulty && ['easy', 'medium', 'hard'].includes(input.difficulty) ? input.difficulty : 'all';

    const access = await resolveCbtAccess(supabase, userId, input.courseId);
    if (!access.allowed) {
      return { success: false as const, error: access.reason ?? 'No access to this course', needsSubscription: !!access.needsSubscription };
    }

    // 1. Pick questions
    let pool: string[];
    if (input.questionIds?.length) {
      const { data, error } = await supabase
        .from('cbt_questions')
        .select('id')
        .eq('course_id', input.courseId)
        .eq('is_active', true)
        .in('id', input.questionIds.slice(0, 300));
      if (error) throw error;
      pool = (data ?? []).map((q) => q.id as string);
    } else {
      const meta = await fetchQuestionMeta(supabase, input.courseId, { difficulty, topicIds: input.topicIds });
      pool = meta.map((q) => q.id);
    }
    if (pool.length === 0) return { success: false as const, error: 'No questions match those settings' };

    const chosenIds = shuffle(pool).slice(0, Math.min(count, pool.length, MAX_QUESTIONS_PER_SESSION));

    const { data: questionRows, error: questionsError } = await supabase
      .from('cbt_questions')
      .select('*, cbt_topics(topic_name)')
      .in('id', chosenIds);
    if (questionsError) throw questionsError;

    const order = new Map(chosenIds.map((id, i) => [id, i]));
    const questions = (questionRows ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    // 2. Starting fresh closes any session the student left hanging on this course
    await supabase
      .from('cbt_practice_sessions')
      .update({ status: 'abandoned', updated_at: new Date().toISOString() })
      .eq('student_id', userId)
      .eq('course_id', input.courseId)
      .eq('status', 'in_progress');

    // 3. Create the session
    const { data: session, error: sessionError } = await supabase
      .from('cbt_practice_sessions')
      .insert({
        student_id: userId,
        course_id: input.courseId,
        subscription_id: access.subscription?.id ?? null,
        total_questions: questions.length,
        time_limit_minutes: timeLimit,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        mode,
        difficulty_filter: input.questionIds?.length ? 'all' : difficulty,
        is_free_access: access.mode === 'free',
        pass_mark: PASS_MARK,
        answered_questions: 0,
        correct_answers: 0,
        wrong_answers: 0,
      })
      .select('id')
      .single();
    if (sessionError) throw sessionError;

    // 4. Freeze a copy of each question so later edits never change a finished test
    const snapshot = questions.map((q, index) => ({
      session_id: session.id,
      question_id: q.id,
      question_number: index + 1,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      solution: q.solution,
      difficulty: q.difficulty,
      topic_id: q.topic_id,
      topic_name: q.cbt_topics?.topic_name ?? null,
      question_image_url: q.question_image_url ?? null,
      option_a_image_url: q.option_a_image_url ?? null,
      option_b_image_url: q.option_b_image_url ?? null,
      option_c_image_url: q.option_c_image_url ?? null,
      option_d_image_url: q.option_d_image_url ?? null,
      solution_image_url: q.solution_image_url ?? null,
    }));

    const { error: snapshotError } = await supabase.from('cbt_session_questions').insert(snapshot);
    if (snapshotError) {
      await supabase.from('cbt_practice_sessions').delete().eq('id', session.id);
      throw snapshotError;
    }

    return { success: true as const, sessionId: session.id as string, totalQuestions: questions.length };
  } catch (error) {
    console.error('[startPracticeSession]', errorMessage(error));
    return { success: false as const, error: errorMessage(error) };
  }
}

/**
 * Everything the session screen needs, straight from the database.
 * Because nothing lives in localStorage, a refresh, a second tab or another device resumes exactly where the student left off.
 */
export async function getPracticeSession(sessionId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();

  try {
    const { data: session, error } = await supabase
      .from('cbt_practice_sessions')
      .select('*, course:cbt_courses(course_code, course_title)')
      .eq('id', sessionId)
      .eq('student_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!session) return { success: false as const, error: 'Session not found' };

    // Time ran out while the student was away: score what they have
    if (session.status === 'in_progress' && isPastDeadline(session)) {
      await finalizeSession(supabase, userId, sessionId);
      return { success: true as const, finished: true as const, status: 'completed' };
    }
    if (session.status !== 'in_progress') {
      return { success: true as const, finished: true as const, status: session.status as string };
    }

    const mode: CbtMode = session.mode === 'study' ? 'study' : 'exam';

    const [{ data: questionRows, error: questionsError }, { data: answerRows, error: answersError }] = await Promise.all([
      supabase.from('cbt_session_questions').select('*').eq('session_id', sessionId).order('question_number'),
      supabase.from('cbt_session_answers').select('question_id, selected_answer, is_correct').eq('session_id', sessionId),
    ]);
    if (questionsError) throw questionsError;
    if (answersError) throw answersError;

    const questions: SessionQuestionDTO[] = (questionRows ?? []).map((q) => ({
      id: q.question_id,
      questionNumber: q.question_number,
      questionText: q.question_text ?? '',
      questionImageUrl: q.question_image_url ?? null,
      options: {
        A: { text: q.option_a ?? '', imageUrl: q.option_a_image_url ?? null },
        B: { text: q.option_b ?? '', imageUrl: q.option_b_image_url ?? null },
        C: { text: q.option_c ?? '', imageUrl: q.option_c_image_url ?? null },
        D: { text: q.option_d ?? '', imageUrl: q.option_d_image_url ?? null },
      },
      difficulty: (q.difficulty ?? 'medium') as CbtDifficulty,
      topicName: q.topic_name ?? null,
    }));

    // Correct answers are only revealed for questions the student already answered in study mode
    const snapshotById = new Map((questionRows ?? []).map((q) => [q.question_id as string, q]));
    const answers: Record<string, AnswerState> = {};
    for (const a of answerRows ?? []) {
      const state: AnswerState = { selected: a.selected_answer as OptionLetter };
      if (mode === 'study') {
        const q = snapshotById.get(a.question_id);
        state.isCorrect = !!a.is_correct;
        state.correctAnswer = q?.correct_answer as OptionLetter;
        state.solution = q?.solution ?? null;
        state.solutionImageUrl = q?.solution_image_url ?? null;
      }
      answers[a.question_id] = state;
    }

    const dto: PracticeSessionDTO = {
      id: session.id,
      courseId: session.course_id,
      courseCode: session.course?.course_code ?? '',
      courseTitle: session.course?.course_title ?? '',
      mode,
      totalQuestions: session.total_questions,
      timeLimitMinutes: session.time_limit_minutes ?? null,
      startedAt: session.started_at ?? session.created_at,
      deadlineAt: sessionDeadline(session)?.toISOString() ?? null,
      serverNow: new Date().toISOString(),
      questions,
      answers,
    };
    return { success: true as const, finished: false as const, session: dto };
  } catch (error) {
    return { success: false as const, error: errorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Finish / abandon / results
// ---------------------------------------------------------------------------

export async function completeSession(sessionId: string, answers?: Record<string, string>) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();
  const outcome = await finalizeSession(supabase, userId, sessionId, answers);
  if (!outcome.success) return outcome;

  revalidatePath('/student/cbt');
  return { success: true as const, alreadyCompleted: outcome.alreadyCompleted };
}

export async function abandonSession(sessionId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('cbt_practice_sessions')
    .update({ status: 'abandoned', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('student_id', userId)
    .eq('status', 'in_progress');
  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

export async function getSessionResults(sessionId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  try {
    const supabase = await createClient();
    const result = await loadSessionResult(supabase, userId, sessionId);
    if (!result) return { success: false as const, error: 'Session not found' };
    return { success: true as const, result };
  } catch (error) {
    return { success: false as const, error: errorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Course list, history, stats
// ---------------------------------------------------------------------------

/** Subjects the student can practise. In free mode every active course is open. */
export async function getPracticeCourses() {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();

  try {
    const subscriptionRequired = await isSubscriptionRequired();

    const { data: courses, error } = await supabase
      .from('cbt_courses')
      .select('id, course_code, course_title, description, course_description')
      .eq('is_active', true)
      .order('course_title');
    if (error) throw error;

    const courseIds = (courses ?? []).map((c) => c.id as string);

    const [counts, { data: sessions }, { data: subs }] = await Promise.all([
      Promise.all(
        courseIds.map(async (id) => {
          const { count } = await supabase
            .from('cbt_questions')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', id)
            .eq('is_active', true);
          return [id, count ?? 0] as const;
        })
      ),
      supabase
        .from('cbt_practice_sessions')
        .select('course_id, score_percentage')
        .eq('student_id', userId)
        .eq('status', 'completed'),
      supabase
        .from('cbt_student_subscriptions')
        .select('course_id, expiry_date')
        .eq('student_id', userId)
        .eq('is_active', true)
        .gt('expiry_date', new Date().toISOString()),
    ]);

    const questionCount = new Map(counts);
    const scoresByCourse = new Map<string, number[]>();
    (sessions ?? []).forEach((s) => {
      const list = scoresByCourse.get(s.course_id) ?? [];
      list.push(Number(s.score_percentage ?? 0));
      scoresByCourse.set(s.course_id, list);
    });
    const subByCourse = new Map((subs ?? []).map((s) => [s.course_id as string, s.expiry_date as string]));

    const cards: PracticeCourseCard[] = (courses ?? [])
      .map((c) => {
        const scores = scoresByCourse.get(c.id) ?? [];
        const expiry = subByCourse.get(c.id);
        return {
          id: c.id as string,
          code: (c.course_code as string) ?? '',
          title: (c.course_title as string) ?? '',
          description: ((c.description ?? c.course_description) as string | null) ?? null,
          questionCount: questionCount.get(c.id) ?? 0,
          sessionsCompleted: scores.length,
          bestScore: scores.length ? Math.max(...scores) : null,
          averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
          hasAccess: !subscriptionRequired || !!expiry,
          subscription: expiry
            ? { expiryDate: expiry, daysRemaining: Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000)) }
            : null,
        };
      })
      .filter((c) => c.questionCount > 0);

    return { success: true as const, subscriptionRequired, courses: cards };
  } catch (error) {
    return { success: false as const, error: errorMessage(error) };
  }
}

export async function getMyPracticeSessions(filters?: { courseId?: string; status?: string; limit?: number }) {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();

  try {
    let query = supabase
      .from('cbt_practice_sessions')
      .select('*, course:cbt_courses(course_code, course_title)')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(filters?.limit ?? 500);

    if (filters?.courseId) query = query.eq('course_id', filters.courseId);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data: sessions, error } = await query;
    if (error) throw error;
    return { success: true as const, sessions };
  } catch (error) {
    return { success: false as const, error: errorMessage(error) };
  }
}

/** PostgREST returns at most 1000 rows per request, so page through bigger result sets */
async function fetchAllRows<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await build(from, from + size - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return out;
}

/**
 * Performance per subject and topic across all completed practice sessions.
 * Read straight from the frozen session questions (topic_name) joined to the student's answers,
 * so it reflects the topics exactly as they were when each test was taken.
 */
export async function getMyTopicPerformance() {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();
  try {
    const { data: sessions, error } = await supabase
      .from('cbt_practice_sessions')
      .select('id, course_id, course:cbt_courses(course_title)')
      .eq('student_id', userId)
      .eq('status', 'completed')
      .limit(300);
    if (error) throw error;
    if (!sessions?.length) return { success: true as const, topics: [] };

    const ids = sessions.map((s) => s.id as string);
    const sessionCourse = new Map(
      sessions.map((s) => {
        const c = s.course as unknown as { course_title: string } | { course_title: string }[] | null;
        const title = Array.isArray(c) ? c[0]?.course_title : c?.course_title;
        return [s.id as string, { courseId: s.course_id as string, courseTitle: title ?? 'Subject' }];
      })
    );

    const [questions, answers] = await Promise.all([
      fetchAllRows<{ session_id: string; question_id: string; topic_name: string | null }>((from, to) =>
        supabase.from('cbt_session_questions').select('session_id, question_id, topic_name').in('session_id', ids).range(from, to)
      ),
      fetchAllRows<{ session_id: string; question_id: string; is_correct: boolean }>((from, to) =>
        supabase.from('cbt_session_answers').select('session_id, question_id, is_correct').in('session_id', ids).range(from, to)
      ),
    ]);

    const topicOf = new Map(questions.map((q) => [`${q.session_id}:${q.question_id}`, (q.topic_name ?? '').trim()]));
    const agg = new Map<string, { courseId: string; courseTitle: string; topic: string; answered: number; correct: number }>();

    for (const a of answers) {
      const topic = topicOf.get(`${a.session_id}:${a.question_id}`);
      if (!topic) continue; // questions without a topic are not part of topic performance
      const c = sessionCourse.get(a.session_id);
      if (!c) continue;
      const key = `${c.courseId}:${topic.toLowerCase()}`;
      const row = agg.get(key) ?? { courseId: c.courseId, courseTitle: c.courseTitle, topic, answered: 0, correct: 0 };
      row.answered += 1;
      if (a.is_correct) row.correct += 1;
      agg.set(key, row);
    }

    const topics = [...agg.values()].map((t) => ({ ...t, accuracy: Math.round((t.correct / t.answered) * 100) }));
    return { success: true as const, topics };
  } catch (error) {
    return { success: false as const, error: errorMessage(error) };
  }
}

export async function getMyPerformanceStats() {
  const userId = await getAuthUserId();
  if (!userId) return { success: false as const, error: 'Not authenticated' };

  const supabase = await createClient();

  try {
    const { data: sessions, error } = await supabase
      .from('cbt_practice_sessions')
      .select('id, score_percentage, total_questions, correct_answers, answered_questions')
      .eq('student_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(200);
    if (error) throw error;

    const byDifficulty = {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 },
    };

    if (!sessions || sessions.length === 0) {
      return {
        success: true as const,
        stats: {
          totalSessions: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          averageScore: 0,
          bestScore: 0,
          worstScore: 0,
          byDifficulty,
        },
      };
    }

    const ids = sessions.map((s) => s.id as string);
    const [questions, answers] = await Promise.all([
      fetchAllRows<{ session_id: string; question_id: string; difficulty: string }>((from, to) =>
        supabase.from('cbt_session_questions').select('session_id, question_id, difficulty').in('session_id', ids).range(from, to)
      ),
      fetchAllRows<{ session_id: string; question_id: string; is_correct: boolean }>((from, to) =>
        supabase.from('cbt_session_answers').select('session_id, question_id, is_correct').in('session_id', ids).range(from, to)
      ),
    ]);

    const difficultyOf = new Map((questions ?? []).map((q) => [`${q.session_id}:${q.question_id}`, q.difficulty as CbtDifficulty]));
    let correctAnswers = 0;
    let answered = 0;
    (answers ?? []).forEach((a) => {
      const d = difficultyOf.get(`${a.session_id}:${a.question_id}`) ?? 'medium';
      answered += 1;
      byDifficulty[d].attempted += 1;
      if (a.is_correct) {
        correctAnswers += 1;
        byDifficulty[d].correct += 1;
      }
    });

    const scores = sessions.map((s) => Number(s.score_percentage ?? 0));
    return {
      success: true as const,
      stats: {
        totalSessions: sessions.length,
        totalQuestions: answered,
        correctAnswers,
        wrongAnswers: answered - correctAnswers,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        bestScore: Math.max(...scores),
        worstScore: Math.min(...scores),
        byDifficulty,
      },
    };
  } catch (error) {
    return { success: false as const, error: errorMessage(error) };
  }
}
