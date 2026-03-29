'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { revalidatePath } from 'next/cache';

interface ActionError extends Error {
  message: string;
}

// Helper: Shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get Practice Configuration Options
export async function getPracticeConfigOptions(courseId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    // 1. Check active subscription
    const now = new Date().toISOString();
    const { data: subscription, error: subError } = await supabase
      .from('cbt_student_subscriptions')
      .select('id, course_id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .gt('expiry_date', now)
      .maybeSingle();

    if (subError) throw subError;

    if (!subscription) {
      return { success: false, error: 'No active subscription for this course' };
    }

    // 2. Get course info
    const { data: course, error: courseError } = await supabase
      .from('cbt_courses')
      .select('course_title')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) throw courseError;

    // 3. Get available questions count
    const { data: questions, error: questionsError } = await supabase
      .from('cbt_questions')
      .select('id, difficulty')
      .eq('course_id', courseId)
      .eq('is_active', true);

    if (questionsError) throw questionsError;

    if (!questions || questions.length === 0) {
      return { success: false, error: 'No questions available for this course' };
    }

    // Count by difficulty
    const difficultyCount = {
      easy: questions.filter((q) => q.difficulty === 'easy').length,
      medium: questions.filter((q) => q.difficulty === 'medium').length,
      hard: questions.filter((q) => q.difficulty === 'hard').length,
      total: questions.length,
    };

    return {
      success: true,
      config: {
        courseTitle: course?.course_title || '',
        totalQuestions: difficultyCount.total,
        questionsByDifficulty: {
          easy: difficultyCount.easy,
          medium: difficultyCount.medium,
          hard: difficultyCount.hard,
        },
      },
    };
  } catch (error) {
    console.log('[getPracticeConfigOptions]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

// Start Practice Session
// Fix the startPracticeSession function return type
// Add this at the top of student-cbt-practice.actions.ts

interface StartPracticeSessionSuccess {
  success: true;
  session: {
    id: string;
    totalQuestions: number;
    questions: Array<{
      id: string;
      questionNumber: number;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      difficulty: string;
    }>;
  };
}

interface StartPracticeSessionError {
  success: false;
  error: string;
}

type StartPracticeSessionResult = StartPracticeSessionSuccess | StartPracticeSessionError;

// Then update the function signature:
export async function startPracticeSession(input: { 
  courseId: string; 
  questionCount: number 
}): Promise<StartPracticeSessionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    console.log('[startPracticeSession] ========== START ==========');
    console.log('[startPracticeSession] User ID:', user.id);
    console.log('[startPracticeSession] Course ID:', input.courseId);
    console.log('[startPracticeSession] Requested questions:', input.questionCount);

    // 1. Check active subscription
    const now = new Date().toISOString();
    const { data: subscription, error: subError } = await supabase
      .from('cbt_student_subscriptions')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', input.courseId)
      .eq('is_active', true)
      .gt('expiry_date', now)
      .maybeSingle();

    if (subError) throw subError;

    if (!subscription) {
      return { success: false, error: 'No active subscription for this course' };
    }

    console.log('[startPracticeSession] ✅ Subscription found:', subscription.id);

    // 2. Get random questions
    const { data: allQuestions, error: questionsError } = await supabase
      .from('cbt_questions')
      .select('*')
      .eq('course_id', input.courseId)
      .eq('is_active', true);

    if (questionsError) throw questionsError;

    console.log('[startPracticeSession] ========== QUESTIONS FETCHED ==========');
    console.log('[startPracticeSession] Total questions found:', allQuestions?.length || 0);
    console.log('[startPracticeSession] First 3 question IDs:', 
      allQuestions?.slice(0, 3).map(q => q.id) || []
    );
    console.log('[startPracticeSession] First 3 question previews:', 
      allQuestions?.slice(0, 3).map(q => q.question_text?.substring(0, 50)) || []
    );
    console.log('[startPracticeSession] All course_ids in fetched questions:', 
      [...new Set(allQuestions?.map(q => q.course_id))]
    );
    console.log('[startPracticeSession] ========================================');

    if (!allQuestions || allQuestions.length === 0) {
      return { success: false, error: 'No questions available for this course' };
    }

    // Shuffle and limit questions
    const shuffled = shuffleArray(allQuestions).slice(0, Math.min(input.questionCount, allQuestions.length));

    console.log('[startPracticeSession] Shuffled and selected', shuffled.length, 'questions');

    // 3. Create session
    const { data: session, error: sessionError } = await supabase
      .from('cbt_practice_sessions')
      .insert({
        student_id: user.id,
        course_id: input.courseId,
        subscription_id: subscription.id,
        total_questions: shuffled.length,
        status: 'in_progress',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[startPracticeSession] Session creation error:', sessionError);
      throw sessionError;
    }

    if (!session) {
      return { success: false, error: 'Failed to create session' };
    }

    console.log('[startPracticeSession] ✅ Session created:', session.id);

    // 4. Create session questions (snapshot for audit trail)
    const sessionQuestions = shuffled.map((q, index) => ({
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
    }));

    const { error: insertError } = await supabase.from('cbt_session_questions').insert(sessionQuestions);

    if (insertError) {
      console.error('[startPracticeSession] Error inserting session questions:', insertError);
      throw insertError;
    }

    console.log('[startPracticeSession] ✅ Session questions created');

    // Return session with questions (WITHOUT correct answers)
    const questionsForStudent = shuffled.map((q, index) => ({
      id: q.id,
      questionNumber: index + 1,
      questionText: q.question_text,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      difficulty: q.difficulty,
      // DO NOT send correct_answer to student!
    }));

    console.log('[startPracticeSession] ✅✅ Session ready! Returning to client...');

    return {
      success: true,
      session: {
        id: session.id,
        totalQuestions: session.total_questions,
        questions: questionsForStudent,
      },
    };
  } catch (error: any) {
    console.error('[startPracticeSession] Error:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

// Complete Session
export async function completeSession(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    // 1. Get session
    const { data: session, error: sessionError } = await supabase
      .from('cbt_practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // 2. Get all answers
    const { data: answers, error: answersError } = await supabase
      .from('cbt_session_answers')
      .select('*')
      .eq('session_id', sessionId);

    if (answersError) throw answersError;

    const correctCount = (answers ?? []).filter((a) => a.is_correct).length;
    const scorePercentage = session.total_questions > 0 ? (correctCount / session.total_questions) * 100 : 0;

    // 3. Update session to completed
    const { error: updateSessionError } = await supabase
      .from('cbt_practice_sessions')
      .update({
        status: 'completed',
        score_percentage: scorePercentage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateSessionError) throw updateSessionError;

    // 4. Update subscription sessions_taken
    const { data: sub, error: fetchSubError } = await supabase
      .from('cbt_student_subscriptions')
      .select('sessions_taken')
      .eq('id', session.subscription_id)
      .maybeSingle();

    if (!fetchSubError && sub) {
      const { error: updateSubError } = await supabase
        .from('cbt_student_subscriptions')
        .update({
          sessions_taken: (sub.sessions_taken ?? 0) + 1,
        })
        .eq('id', session.subscription_id);

      if (updateSubError) throw updateSubError;
    }

    // 5. Update question statistics
    const { data: sessionQuestions, error: getQuestionsError } = await supabase
      .from('cbt_session_questions')
      .select('question_id')
      .eq('session_id', sessionId);

    if (getQuestionsError) throw getQuestionsError;

    if (sessionQuestions) {
      for (const sq of sessionQuestions) {
        const isCorrect = (answers ?? []).some((a) => a.question_id === sq.question_id && a.is_correct);

        // Get current stats
        const { data: currentQuestion, error: fetchError } = await supabase
          .from('cbt_questions')
          .select('times_attempted, times_correct')
          .eq('id', sq.question_id)
          .maybeSingle();

        if (!fetchError && currentQuestion) {
          await supabase
            .from('cbt_questions')
            .update({
              times_attempted: (currentQuestion.times_attempted ?? 0) + 1,
              ...(isCorrect && { times_correct: (currentQuestion.times_correct ?? 0) + 1 }),
            })
            .eq('id', sq.question_id);
        }
      }
    }

    // 6. Get session details with answers for results
    const { data: answers_for_result, error: answersForResultError } = await supabase
      .from('cbt_session_answers')
      .select('*')
      .eq('session_id', sessionId);

    if (answersForResultError) throw answersForResultError;

    const { data: questions_for_result, error: questionsForResultError } = await supabase
      .from('cbt_session_questions')
      .select('*')
      .eq('session_id', sessionId);

    if (questionsForResultError) throw questionsForResultError;

    // Combine answers with question details
    const detailedAnswers = (answers_for_result ?? []).map((answer) => {
      const questionDetails = (questions_for_result ?? []).find((q) => q.question_id === answer.question_id);
      return {
        ...answer,
        question: questionDetails
          ? {
              question_text: questionDetails.question_text,
              option_a: questionDetails.option_a,
              option_b: questionDetails.option_b,
              option_c: questionDetails.option_c,
              option_d: questionDetails.option_d,
              correct_answer: questionDetails.correct_answer,
              solution: questionDetails.solution,
            }
          : null,
      };
    });

    revalidatePath('/student/cbt');
    return {
      success: true,
      result: {
        sessionId,
        totalQuestions: session.total_questions,
        correctAnswers: correctCount,
        wrongAnswers: session.total_questions - correctCount,
        scorePercentage: Math.round(scorePercentage),
        answers: detailedAnswers,
      },
    };
  } catch (error) {
    console.log('[completeSession]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

// Get Session Results
export async function getSessionResults(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('cbt_practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Get answers and questions separately then combine
    const { data: answers, error: answersError } = await supabase
      .from('cbt_session_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_id');

    if (answersError) throw answersError;

    const { data: questions, error: questionsError } = await supabase
      .from('cbt_session_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_id');

    if (questionsError) throw questionsError;

    // Combine answers with question details
    const detailedAnswers = (answers ?? []).map((answer) => {
      const questionDetails = (questions ?? []).find((q) => q.question_id === answer.question_id);
      return {
        ...answer,
        question: questionDetails
          ? {
              question_text: questionDetails.question_text,
              option_a: questionDetails.option_a,
              option_b: questionDetails.option_b,
              option_c: questionDetails.option_c,
              option_d: questionDetails.option_d,
              correct_answer: questionDetails.correct_answer,
              solution: questionDetails.solution,
              difficulty: questionDetails.difficulty,
            }
          : null,
      };
    });

    return {
      success: true,
      result: {
        sessionId,
        status: session.status,
        totalQuestions: session.total_questions,
        correctAnswers: session.correct_answers ?? 0,
        wrongAnswers: session.wrong_answers ?? 0,
        scorePercentage: session.score_percentage ?? 0,
        completedAt: session.completed_at,
        answers: detailedAnswers,
      },
    };
  } catch (error) {
    console.log('[getSessionResults]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

// Get My Practice Sessions
export async function getMyPracticeSessions(filters?: Record<string, any>) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    const query = supabase
      .from('cbt_practice_sessions')
      .select('*, course:cbt_courses(course_code, course_title)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.courseId) {
        query.eq('course_id', filters.courseId);
      }
      if (filters.status) {
        query.eq('status', filters.status);
      }
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    return { success: true, sessions };
  } catch (error) {
    console.log('[getMyPracticeSessions]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

// Get Session Review (with correct answers visible)
export async function getSessionReview(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    // Verify session belongs to user and is completed
    const { data: session, error: sessionError } = await supabase
      .from('cbt_practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('student_id', user.id)
      .eq('status', 'completed')
      .maybeSingle();

    if (sessionError) throw sessionError;

    if (!session) {
      return { success: false, error: 'Session not found or not completed' };
    }

    // Get questions and answers separately then combine
    const { data: questions_review, error: questionsError } = await supabase
      .from('cbt_session_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_number');

    if (questionsError) throw questionsError;

    const { data: answers_review, error: answersError } = await supabase
      .from('cbt_session_answers')
      .select('*')
      .eq('session_id', sessionId);

    if (answersError) throw answersError;

    // Combine questions with student answers
    const review = (questions_review ?? []).map((question) => {
      const studentAnswer = (answers_review ?? []).find((a) => a.question_id === question.question_id);
      return {
        ...question,
        student_answer: studentAnswer
          ? {
              selected_answer: studentAnswer.selected_answer,
              is_correct: studentAnswer.is_correct,
            }
          : null,
      };
    });

    return {
      success: true,
      review: {
        sessionId,
        scorePercentage: session.score_percentage ?? 0,
        completedAt: session.completed_at,
        questions: review,
      },
    };
  } catch (error) {
    console.log('[getSessionReview]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

// Get My Performance Stats
export async function getMyPerformanceStats() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    // Get all completed sessions for user
    const { data: sessions, error: sessionsError } = await supabase
      .from('cbt_practice_sessions')
      .select('*')
      .eq('student_id', user.id)
      .eq('status', 'completed');

    if (sessionsError) throw sessionsError;

    if (!sessions || sessions.length === 0) {
      return {
        success: true,
        stats: {
          totalSessions: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          averageScore: 0,
          bestScore: 0,
          worstScore: 0,
          byDifficulty: {
            easy: { attempted: 0, correct: 0 },
            medium: { attempted: 0, correct: 0 },
            hard: { attempted: 0, correct: 0 },
          },
        },
      };
    }

    // Get all answers for these sessions
    const sessionIds = sessions.map((s) => s.id);
    const { data: allAnswers, error: answersError } = await supabase
      .from('cbt_session_answers')
      .select('*, question:cbt_session_questions(difficulty)')
      .in('session_id', sessionIds);

    if (answersError) throw answersError;

    // Calculate stats
    const totalQuestions = allAnswers?.length ?? 0;
    const correctAnswers = (allAnswers ?? []).filter((a) => a.is_correct).length;
    const wrongAnswers = totalQuestions - correctAnswers;

    const scores = (sessions ?? []).map((s) => s.score_percentage ?? 0).filter((s) => s > 0);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

    // By difficulty
    const byDifficulty = {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 },
    };

    (allAnswers ?? []).forEach((answer: any) => {
      const difficulty = answer.question?.difficulty ?? 'medium';
      if (difficulty in byDifficulty) {
        byDifficulty[difficulty as keyof typeof byDifficulty].attempted += 1;
        if (answer.is_correct) {
          byDifficulty[difficulty as keyof typeof byDifficulty].correct += 1;
        }
      }
    });

    return {
      success: true,
      stats: {
        totalSessions: sessions.length,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        averageScore,
        bestScore,
        worstScore,
        byDifficulty,
      },
    };
  } catch (error) {
    console.log('[getMyPerformanceStats]', error);
    return { success: false, error: (error as ActionError).message };
  }
}
