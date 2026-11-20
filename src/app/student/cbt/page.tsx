'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, Flame, Gift, Loader2, Play, Target, Trophy, Wallet } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getCbtAccessMode } from '@/lib/actions/cbt-settings.actions';
import { getMyPerformanceStats, getMyPracticeSessions } from '@/lib/actions/student-cbt-practice.actions';
import { getMyPromoCode, getMyPromoStats } from '@/lib/actions/promo-codes.actions';
import { cn } from '@/lib/utils';

interface RecentSession {
  id: string;
  score_percentage: number | null;
  total_questions: number;
  completed_at: string | null;
  status: string;
  course?: { course_title?: string; course_code?: string } | null;
}

export default function CBTDashboard() {
  const [loading, setLoading] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [stats, setStats] = useState({ totalSessions: 0, averageScore: 0, bestScore: 0, totalQuestions: 0 });
  const [recent, setRecent] = useState<RecentSession[]>([]);
  const [active, setActive] = useState<RecentSession | null>(null);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoEarnings, setPromoEarnings] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [mode, perf, sessions, promo, promoStats] = await Promise.all([
          getCbtAccessMode(),
          getMyPerformanceStats(),
          getMyPracticeSessions({ limit: 30 }),
          getMyPromoCode(),
          getMyPromoStats(),
        ]);

        setSubscriptionRequired(mode.subscriptionRequired);
        if (perf.success) setStats(perf.stats);
        if (sessions.success && sessions.sessions) {
          const list = sessions.sessions as RecentSession[];
          setRecent(list.filter((s) => s.status === 'completed').slice(0, 5));
          setActive(list.find((s) => s.status === 'in_progress') ?? null);
        }
        if (promo.success && promo.code) setPromoCode(promo.code.code);
        if (promoStats.success && promoStats.stats) setPromoEarnings(promoStats.stats.totalEarnings || 0);
      } catch (error) {
        console.error('[CBTDashboard]', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Tests taken', value: stats.totalSessions, icon: <Flame className="h-5 w-5" />, tone: 'bg-orange-50 text-orange-600' },
    { label: 'Average score', value: `${stats.averageScore}%`, icon: <BarChart3 className="h-5 w-5" />, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Best score', value: `${stats.bestScore}%`, icon: <Trophy className="h-5 w-5" />, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Questions answered', value: stats.totalQuestions.toLocaleString(), icon: <Target className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-gradient-to-br from-[#1F2A5A] via-[#26357a] to-[#2563EB] text-white">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold sm:text-4xl">JAMB CBT Practice</h1>
            {!subscriptionRequired && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/40">
                <Gift className="h-3.5 w-3.5" /> Free for everyone
              </span>
            )}
          </div>
          <p className="mt-2 max-w-xl text-blue-100">Practise in a real CBT environment, see your mistakes explained, and watch your scores climb before exam day.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white font-semibold text-[#1F2A5A] hover:bg-blue-50">
              <Link href="/student/cbt/courses">
                <Play className="mr-2 h-5 w-5" /> Start practising
              </Link>
            </Button>
            {active && (
              <Button asChild size="lg" variant="outline" className="border-amber-300 bg-amber-400/20 text-white hover:bg-amber-400/30 hover:text-white">
                <Link href={`/student/cbt/practice/session/${active.id}`}>Resume unfinished test</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-6 max-w-6xl space-y-6 px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-lg', s.tone)}>{s.icon}</span>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* recent */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent results</h2>
              <Link href="/student/cbt/progress" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                Full progress <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="py-10 text-center">
                <p className="mb-4 text-slate-500">You haven&apos;t taken a test yet.</p>
                <Button asChild>
                  <Link href="/student/cbt/courses">Take your first test</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((s) => {
                  const score = Math.round(Number(s.score_percentage ?? 0));
                  return (
                    <li key={s.id}>
                      <Link href={`/student/cbt/practice/results/${s.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-blue-700">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{s.course?.course_title ?? 'Practice test'}</p>
                          <p className="text-xs text-slate-500">
                            {s.completed_at ? new Date(s.completed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''} · {s.total_questions} questions
                          </p>
                        </div>
                        <span className={cn('rounded-full px-3 py-1 text-sm font-bold', score >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>{score}%</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* side links */}
          <div className="space-y-4">
            <Link href="/student/cbt/leaderboard" className="flex items-center gap-4 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5 shadow-sm transition hover:shadow-md">
              <Trophy className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-semibold text-slate-900">Leaderboard</p>
                <p className="text-sm text-slate-600">See how you rank</p>
              </div>
            </Link>

            {subscriptionRequired && (
              <Link href="/student/cbt/bundles" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <Wallet className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">Plans & bundles</p>
                  <p className="text-sm text-slate-600">Unlock more subjects</p>
                </div>
              </Link>
            )}

            {promoCode && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs text-slate-500">Your referral code</p>
                <p className="font-mono text-2xl font-bold text-emerald-700">{promoCode}</p>
                <p className="mt-1 text-xs text-slate-600">Earned so far: ₦{promoEarnings.toLocaleString()}</p>
                <Link href="/student/profile/promo" className="mt-2 inline-block text-sm font-medium text-emerald-700 hover:underline">
                  Manage code →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
