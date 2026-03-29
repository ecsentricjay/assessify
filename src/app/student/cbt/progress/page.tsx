'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Trophy,
  Target,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  BarChart3,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getMyPracticeSessions } from '@/lib/actions/student-cbt-practice.actions';

// ==================== TYPES ====================

interface Course {
  course_code: string;
  course_title: string;
}

interface PracticeSession {
  id: string;
  course_id: string;
  course: Course;
  status: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score_percentage: number;
  completed_at: string;
  time_taken_seconds?: number;
  created_at: string;
}

interface CourseProgress {
  courseId: string;
  courseName: string;
  courseCode: string;
  sessionsCompleted: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  totalCorrect: number;
  totalAttempted: number;
  lastAttempted: string;
}

// ==================== CONSTANTS ====================

const PASSING_SCORE = 50;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format time in seconds to readable format
 */
function formatTime(seconds?: number): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Format date to readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date and time
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Organize sessions by course
 */
function organizeByCoursee(sessions: any[]): CourseProgress[] {
  const courseMap = new Map<string, CourseProgress>();

  sessions
    .filter((s) => s.status === 'completed')
    .forEach((session) => {
      const courseId = session.course_id;

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          courseId,
          courseName: session.course?.course_title || 'Unknown Course',
          courseCode: session.course?.course_code || 'N/A',
          sessionsCompleted: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          totalCorrect: 0,
          totalAttempted: 0,
          lastAttempted: session.completed_at || session.created_at,
        });
      }

      const progress = courseMap.get(courseId)!;
      progress.sessionsCompleted++;
      progress.totalScore += session.score_percentage || 0;
      progress.bestScore = Math.max(progress.bestScore, session.score_percentage || 0);
      progress.totalCorrect += session.correct_answers || 0;
      progress.totalAttempted += session.total_questions || 0;
      progress.lastAttempted = new Date(session.completed_at || session.created_at) >
        new Date(progress.lastAttempted) 
        ? (session.completed_at || session.created_at)
        : progress.lastAttempted;
    });

  // Calculate averages
  courseMap.forEach((progress) => {
    progress.averageScore = progress.sessionsCompleted > 0 
      ? Math.round(progress.totalScore / progress.sessionsCompleted)
      : 0;
  });

  return Array.from(courseMap.values()).sort(
    (a, b) => new Date(b.lastAttempted).getTime() - new Date(a.lastAttempted).getTime()
  );
}

// ==================== COMPONENTS ====================

/**
 * Overall Statistics Header
 */
function OverallStats({ sessions }: { sessions: PracticeSession[] }) {
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.total_questions || 0), 0);
  const totalCorrect = completedSessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
  const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const stats = [
    {
      icon: Trophy,
      label: 'Overall Score',
      value: `${overallScore}%`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      icon: BookOpen,
      label: 'Sessions Done',
      value: completedSessions.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Target,
      label: 'Questions',
      value: totalQuestions,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: TrendingUp,
      label: 'Correct Answers',
      value: totalCorrect,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
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
 * Course Progress Card
 */
function CourseProgressCard({ progress }: { progress: CourseProgress }) {
  const passPercentage = progress.totalAttempted > 0 
    ? Math.round((progress.totalCorrect / progress.totalAttempted) * 100)
    : 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{progress.courseName}</h3>
            <p className="text-sm text-gray-600">{progress.courseCode}</p>
          </div>
          <Badge variant={progress.bestScore >= PASSING_SCORE ? 'default' : 'secondary'}>
            Best: {progress.bestScore}%
          </Badge>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-blue-50 p-2">
            <p className="text-xs font-medium text-gray-600">Sessions</p>
            <p className="text-xl font-bold text-blue-600">{progress.sessionsCompleted}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-2">
            <p className="text-xs font-medium text-gray-600">Average</p>
            <p className="text-xl font-bold text-green-600">{progress.averageScore}%</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-2">
            <p className="text-xs font-medium text-gray-600">Accuracy</p>
            <p className="text-xl font-bold text-purple-600">{passPercentage}%</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Progress</span>
            <span className="text-xs font-semibold text-gray-700">
              {progress.totalCorrect}/{progress.totalAttempted}
            </span>
          </div>
          <Progress value={passPercentage} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Last attempted: {formatDate(progress.lastAttempted)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recent Sessions List
 */
function RecentSessions({ sessions }: { sessions: PracticeSession[] }) {
  const recentCompleted = sessions
    .filter((s) => s.status === 'completed')
    .slice(0, 10);

  if (recentCompleted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-gray-600">No completed sessions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Recent Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentCompleted.map((session) => {
            const passed = session.score_percentage >= PASSING_SCORE;

            return (
              <Link
                key={session.id}
                href={`/student/cbt/practice/results/${session.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {session.course?.course_title}
                    </h4>
                    <Badge variant={passed ? 'default' : 'secondary'}>
                      {passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    {formatDateTime(session.completed_at || session.created_at)} •{' '}
                    {formatTime(session.time_taken_seconds)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-lg font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                      {session.score_percentage}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {session.correct_answers}/{session.total_questions}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading State
 */
function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Loading your progress...</p>
      </div>
    </div>
  );
}

/**
 * Error State
 */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
            <h2 className="mb-2 text-xl font-bold text-red-900">Error Loading Progress</h2>
            <p className="mb-6 text-sm text-red-700">{error}</p>
            <div className="flex gap-3">
              <Button onClick={onRetry} variant="destructive">
                Try Again
              </Button>
              <Link href="/student/cbt/courses">
                <Button variant="outline">Back to Courses</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Empty State
 */
function EmptyState() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-blue-200 bg-blue-50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <BarChart3 className="mb-4 h-12 w-12 text-blue-600" />
            <h2 className="mb-2 text-xl font-bold text-blue-900">No Sessions Yet</h2>
            <p className="mb-6 text-sm text-blue-700">
              Start practicing to see your progress here!
            </p>
            <Link href="/student/cbt/courses">
              <Button>Start Practicing</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== MAIN PAGE COMPONENT ====================

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    try {
      setLoading(true);
      setError(null);

      const response = await getMyPracticeSessions();

      if (!response.success) {
        setError(response.error || 'Failed to load progress');
        return;
      }

      setSessions(response.sessions || []);
      toast.success('Progress loaded!');
    } catch (err) {
      console.error('[ProgressPage] Error:', err);
      setError('An unexpected error occurred');
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadProgress} />;
  }

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  if (completedSessions.length === 0) {
    return <EmptyState />;
  }

  const courseProgress = organizeByCoursee(sessions);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Your Progress
          </h1>
          <p className="mt-2 text-gray-600">
            Track your CBT practice performance and improve your skills
          </p>
        </div>

        {/* Overall Statistics */}
        <OverallStats sessions={sessions} />

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Course Progress - 2 columns */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Course Progress</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {courseProgress.map((progress) => (
                <CourseProgressCard key={progress.courseId} progress={progress} />
              ))}
            </div>
          </div>

          {/* Recent Sessions - 1 column */}
          <div className="lg:col-span-1">
            <RecentSessions sessions={sessions} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/student/cbt/courses">
            <Button size="lg" className="w-full sm:w-auto">
              Start New Practice
            </Button>
          </Link>
          <Link href="/student/cbt">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
