'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Clock, 
  Target, 
  TrendingUp,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getSessionResults } from '@/lib/actions/student-cbt-practice.actions';

// ==================== TYPES ====================

interface SessionQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  solution: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SessionAnswer {
  id: string;
  question_id: string;
  selected_answer: 'A' | 'B' | 'C' | 'D' | null;
  is_correct: boolean;
  question: SessionQuestion;
}

interface SessionResult {
  sessionId: string;
  status: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercentage: number;
  completedAt: string;
  answers: SessionAnswer[];
}

// ==================== CONSTANTS ====================

const PASSING_SCORE = 50;
const OPTIONS = {
  A: 'option_a',
  B: 'option_b',
  C: 'option_c',
  D: 'option_d',
} as const;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get option label and text
 */
function getOptionDisplay(question: SessionQuestion, option: 'A' | 'B' | 'C' | 'D') {
  const key = OPTIONS[option] as keyof SessionQuestion;
  return (question[key] as string) || '';
}

/**
 * Calculate statistics by difficulty level
 */
function calculateStatsByDifficulty(answers: SessionAnswer[]) {
  const stats = {
    easy: { total: 0, correct: 0 },
    medium: { total: 0, correct: 0 },
    hard: { total: 0, correct: 0 },
  };

  answers.forEach((answer) => {
    if (answer.question) {
      const difficulty = answer.question.difficulty as keyof typeof stats;
      stats[difficulty].total++;
      if (answer.is_correct) {
        stats[difficulty].correct++;
      }
    }
  });

  return stats;
}

/**
 * Get performance message based on score
 */
function getPerformanceMessage(score: number): { message: string; emoji: string } {
  if (score >= 90) {
    return { message: 'Outstanding performance! 🌟', emoji: '🌟' };
  }
  if (score >= 80) {
    return { message: 'Excellent work! 🎉', emoji: '🎉' };
  }
  if (score >= 70) {
    return { message: 'Great job! Keep it up! 💪', emoji: '💪' };
  }
  if (score >= 50) {
    return { message: 'Well done! You passed! ✨', emoji: '✨' };
  }
  if (score >= 30) {
    return { message: 'Don\'t give up! Practice makes perfect 📚', emoji: '📚' };
  }
  return { message: 'Keep practicing! You\'ll get there 🚀', emoji: '🚀' };
}

/**
 * Format time (assuming milliseconds)
 */
function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// ==================== COMPONENTS ====================

/**
 * Score Display Hero Section
 */
function ScoreDisplay({ 
  score, 
  passed, 
  totalQuestions,
  correctAnswers 
}: { 
  score: number; 
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
}) {
  const { message, emoji } = getPerformanceMessage(score);

  return (
    <div className="mb-8">
      <Card className={`overflow-hidden ${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-6 py-4">
            <div className="flex items-center justify-center">
              {passed ? (
                <Trophy className="h-16 w-16 text-green-600" />
              ) : (
                <AlertCircle className="h-16 w-16 text-red-600" />
              )}
            </div>

            <div className="text-center">
              <div className="mb-2 text-5xl font-bold sm:text-6xl">
                <span className={passed ? 'text-green-700' : 'text-red-700'}>
                  {score}%
                </span>
              </div>
              <p className={`text-lg font-semibold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                {passed ? 'PASSED' : 'FAILED'}
              </p>
            </div>

            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">{message}</p>
              <p className="mt-2 text-sm text-gray-600">
                You answered {correctAnswers} out of {totalQuestions} questions correctly
              </p>
            </div>

            {!passed && (
              <div className={`rounded-lg ${passed ? 'bg-green-100' : 'bg-red-100'} px-4 py-2`}>
                <p className={`text-sm font-medium ${passed ? 'text-green-800' : 'text-red-800'}`}>
                  Passing score: {PASSING_SCORE}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Statistics Cards Grid
 */
function StatisticsGrid({
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  timeMs,
}: {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeMs: number;
}) {
  const stats = [
    {
      icon: Target,
      label: 'Questions',
      value: totalQuestions,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: CheckCircle,
      label: 'Correct',
      value: correctAnswers,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: XCircle,
      label: 'Wrong',
      value: wrongAnswers,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: Clock,
      label: 'Time Taken',
      value: formatTime(timeMs),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isTime: true,
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`border-0 ${stat.bgColor}`}>
            <CardContent className="flex items-center gap-4 p-6">
              <Icon className={`h-8 w-8 shrink-0 ${stat.color}`} />
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Difficulty Breakdown Section
 */
function DifficultyBreakdown({ 
  stats 
}: { 
  stats: Record<'easy' | 'medium' | 'hard', { total: number; correct: number }> 
}) {
  const difficulties = [
    { key: 'easy' as const, label: 'Easy', color: 'bg-green-100 text-green-800' },
    { key: 'medium' as const, label: 'Medium', color: 'bg-amber-100 text-amber-800' },
    { key: 'hard' as const, label: 'Hard', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <CardTitle>Performance by Difficulty</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {difficulties.map(({ key, label, color }) => {
              const stat = stats[key];
              const percentage = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;

              return (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={color}>{label}</Badge>
                      <span className="font-medium text-gray-700">
                        {stat.correct}/{stat.total}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Question Review Item with Collapsible Details
 */
function QuestionReviewItem({ 
  answer, 
  index 
}: { 
  answer: SessionAnswer; 
  index: number 
}) {
  const [expanded, setExpanded] = useState(false);

  if (!answer.question) {
    return null;
  }

  const { question } = answer;
  const selectedOptionText = answer.selected_answer 
    ? getOptionDisplay(question, answer.selected_answer)
    : 'Not answered';
  const correctOptionText = getOptionDisplay(question, question.correct_answer);

  const bgColor = answer.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const borderColor = answer.is_correct ? 'border-l-4 border-l-green-600' : 'border-l-4 border-l-red-600';

  return (
    <Card className={`overflow-hidden ${bgColor} ${borderColor} mb-4`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 text-left hover:bg-opacity-75 transition-colors flex items-start justify-between"
      >
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <div className="shrink-0 mt-1">
              {answer.is_correct ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 mb-1">
                Question {index + 1}
              </p>
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                {question.question_text}
              </p>

              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary"
                  className={
                    question.difficulty === 'easy' 
                      ? 'bg-green-200 text-green-800'
                      : question.difficulty === 'medium'
                      ? 'bg-amber-200 text-amber-800'
                      : 'bg-red-200 text-red-800'
                  }
                >
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </Badge>
                <span className={`text-sm font-medium ${answer.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                  {answer.is_correct ? 'Correct' : 'Wrong'}
                </span>
              </div>

              {!expanded && (
                <div className="text-xs text-gray-600 mt-2">
                  <p>Your answer: <span className="font-semibold">{answer.selected_answer}</span></p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 ml-4 mt-2">
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-6 py-4 bg-opacity-50">
          <div className="space-y-4">
            {/* Options Grid */}
            <div>
              <h4 className="mb-3 font-semibold text-gray-800">Options</h4>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionChar = option as 'A' | 'B' | 'C' | 'D';
                  const text = getOptionDisplay(question, optionChar);
                  const isSelected = answer.selected_answer === optionChar;
                  const isCorrect = question.correct_answer === optionChar;

                  let bgClass = 'bg-white hover:bg-gray-50';
                  let borderClass = 'border-gray-200';
                  let textClass = 'text-gray-700';

                  if (isSelected && isCorrect) {
                    bgClass = 'bg-green-100';
                    borderClass = 'border-green-400';
                    textClass = 'text-green-900 font-semibold';
                  } else if (isSelected && !isCorrect) {
                    bgClass = 'bg-red-100';
                    borderClass = 'border-red-400';
                    textClass = 'text-red-900 font-semibold';
                  } else if (isCorrect) {
                    bgClass = 'bg-green-50';
                    borderClass = 'border-green-300';
                    textClass = 'text-green-900';
                  }

                  return (
                    <div
                      key={optionChar}
                      className={`rounded-lg border-2 ${borderClass} ${bgClass} p-3 ${textClass}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold">{optionChar}.</span>
                        <div className="flex-1">
                          <p className="text-sm">{text}</p>
                          <div className="mt-1 flex gap-2">
                            {isSelected && (
                              <span className="text-xs font-semibold text-gray-600">
                                📌 Your answer
                              </span>
                            )}
                            {isCorrect && (
                              <span className="text-xs font-semibold text-green-700">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Solution/Explanation */}
            {question.solution && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 border border-blue-200">
                <h4 className="mb-2 font-semibold text-blue-900">Explanation</h4>
                <p className="text-sm text-blue-900 leading-relaxed">
                  {question.solution}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Question Review Section
 */
function QuestionReview({ answers }: { answers: SessionAnswer[] }) {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle>Question Review</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandAll(!expandAll)}
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {answers.map((answer, index) => (
              <QuestionReviewItem
                key={answer.id}
                answer={answer}
                index={index}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Action Buttons Section
 */
function ActionButtons({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button
        size="lg"
        className="gap-2"
        onClick={() => router.push('/student/cbt/courses')}
      >
        <Home className="h-4 w-4" />
        Back to Courses
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="gap-2"
        onClick={() => router.push('/student/cbt/progress')}
      >
        <TrendingUp className="h-4 w-4" />
        View My Progress
      </Button>
      <Button
        size="lg"
        variant="secondary"
        className="gap-2"
        onClick={() => router.push('/student/cbt/courses')}
      >
        <RefreshCw className="h-4 w-4" />
        Practice Again
      </Button>
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
            <h2 className="mb-2 text-xl font-bold text-red-900">Error Loading Results</h2>
            <p className="mb-6 text-sm text-red-700">{error}</p>
            <div className="flex gap-3">
              <Button onClick={onRetry} variant="destructive">
                Try Again
              </Button>
              <Link href="/student/cbt/courses">
                <Button variant="outline">
                  Back to Courses
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Loading your results...</p>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE COMPONENT ====================

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResult | null>(null);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  async function loadResults() {
    try {
      setLoading(true);
      setError(null);

      const response = await getSessionResults(sessionId);

      if (!response.success) {
        setError(response.error || 'Failed to load results');
        return;
      }

      setResults(response.result as SessionResult);
      toast.success('Results loaded successfully!');
    } catch (err) {
      console.error('[ResultsPage] Error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !results) {
    return <ErrorState error={error || 'No results found'} onRetry={loadResults} />;
  }

  const passed = results.scorePercentage >= PASSING_SCORE;
  const statsByDifficulty = calculateStatsByDifficulty(results.answers);

  // Calculate time in milliseconds (assuming completedAt is ISO string)
  const startTime = new Date('2000-01-01').getTime(); // Placeholder
  const endTime = results.completedAt ? new Date(results.completedAt).getTime() : Date.now();
  const timeMs = endTime - startTime;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Practice Session Results
          </h1>
          <p className="mt-2 text-gray-600">
            Session completed on {new Date(results.completedAt).toLocaleDateString()} at{' '}
            {new Date(results.completedAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Main Results */}
        <ScoreDisplay
          score={results.scorePercentage}
          passed={passed}
          totalQuestions={results.totalQuestions}
          correctAnswers={results.correctAnswers}
        />

        {/* Statistics */}
        <StatisticsGrid
          totalQuestions={results.totalQuestions}
          correctAnswers={results.correctAnswers}
          wrongAnswers={results.wrongAnswers}
          timeMs={timeMs}
        />

        {/* Difficulty Breakdown */}
        <DifficultyBreakdown stats={statsByDifficulty} />

        {/* Question Review */}
        <QuestionReview answers={results.answers} />

        {/* Action Buttons */}
        <ActionButtons sessionId={sessionId} />

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help? <Link href="/help" className="font-semibold text-blue-600 hover:text-blue-700">
              View our guide
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
