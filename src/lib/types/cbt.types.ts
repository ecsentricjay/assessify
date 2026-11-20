export type CbtDifficulty = 'easy' | 'medium' | 'hard';
export type CbtMode = 'exam' | 'study';
export type OptionLetter = 'A' | 'B' | 'C' | 'D';
export const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

export const PASS_MARK = 50;

/** A question as the student sees it during a session (no answers!). */
export interface SessionQuestionDTO {
  id: string;
  questionNumber: number;
  questionText: string;
  questionImageUrl: string | null;
  options: Record<OptionLetter, { text: string; imageUrl: string | null }>;
  difficulty: CbtDifficulty;
  topicName: string | null;
}

/** What we know about the student's answer to one question during a session. */
export interface AnswerState {
  selected: OptionLetter;
  /** Only present in study mode (instant feedback) */
  isCorrect?: boolean;
  correctAnswer?: OptionLetter;
  solution?: string | null;
  solutionImageUrl?: string | null;
}

export interface PracticeSessionDTO {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  mode: CbtMode;
  totalQuestions: number;
  /** null = untimed */
  timeLimitMinutes: number | null;
  startedAt: string;
  /** null = untimed */
  deadlineAt: string | null;
  /** Server clock at response time, so the client countdown can't be cheated by changing the device clock */
  serverNow: string;
  questions: SessionQuestionDTO[];
  answers: Record<string, AnswerState>;
}

export interface ReviewQuestion {
  id: string;
  number: number;
  text: string;
  imageUrl: string | null;
  options: Record<OptionLetter, { text: string; imageUrl: string | null }>;
  correctAnswer: OptionLetter;
  selected: OptionLetter | null;
  isCorrect: boolean;
  solution: string | null;
  solutionImageUrl: string | null;
  difficulty: CbtDifficulty;
  topicName: string | null;
}

export interface SessionResultDTO {
  sessionId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  status: string;
  mode: CbtMode;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  scorePercentage: number;
  passed: boolean;
  passMark: number;
  timeTakenSeconds: number;
  timeLimitMinutes: number | null;
  completedAt: string | null;
  byDifficulty: Record<CbtDifficulty, { total: number; correct: number }>;
  byTopic: Array<{ topic: string; total: number; correct: number }>;
  questions: ReviewQuestion[];
}

export interface PracticeConfig {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  totalQuestions: number;
  questionsByDifficulty: Record<CbtDifficulty, number>;
  topics: Array<{ id: string; name: string; count: number }>;
  accessMode: 'free' | 'subscription';
  /** Sessions left on the subscription cap; null = unlimited / free */
  sessionsRemaining: number | null;
  activeSession: {
    id: string;
    totalQuestions: number;
    answered: number;
    mode: CbtMode;
    deadlineAt: string | null;
  } | null;
  recentSessions: Array<{
    id: string;
    scorePercentage: number;
    totalQuestions: number;
    completedAt: string | null;
  }>;
}

export interface PracticeCourseCard {
  id: string;
  code: string;
  title: string;
  description: string | null;
  questionCount: number;
  sessionsCompleted: number;
  bestScore: number | null;
  averageScore: number | null;
  hasAccess: boolean;
  subscription: { expiryDate: string; daysRemaining: number } | null;
}
