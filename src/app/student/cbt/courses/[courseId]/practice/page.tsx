'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpenCheck,
  Clock,
  Gift,
  GraduationCap,
  Loader2,
  Play,
  RotateCcw,
  Timer,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  abandonSession,
  getPracticeConfigOptions,
  startPracticeSession,
} from '@/lib/actions/student-cbt-practice.actions';
import type { CbtDifficulty, CbtMode, PracticeConfig } from '@/lib/types/cbt.types';
import { cn } from '@/lib/utils';

type PresetId = 'quick' | 'standard' | 'jamb' | 'custom';

const TIME_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'No timer', value: null },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

const DIFFICULTIES: Array<{ id: CbtDifficulty | 'all'; label: string }> = [
  { id: 'all', label: 'Mixed' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
];

export default function PracticeSetupPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [config, setConfig] = useState<PracticeConfig | null>(null);
  const [error, setError] = useState<{ message: string; needsSubscription: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const [preset, setPreset] = useState<PresetId>('standard');
  const [mode, setMode] = useState<CbtMode>('exam');
  const [count, setCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState<number | null>(20);
  const [difficulty, setDifficulty] = useState<CbtDifficulty | 'all'>('all');
  const [topicIds, setTopicIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getPracticeConfigOptions(courseId);
      if (cancelled) return;
      if (res.success) {
        setConfig(res.config);
      } else {
        setError({ message: res.error ?? 'Could not load this subject', needsSubscription: 'needsSubscription' in res && !!res.needsSubscription });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const isEnglish = /english/i.test(config?.courseTitle ?? '');
  const jambCount = isEnglish ? 60 : 40;

  const available = useMemo(() => {
    if (!config) return 0;
    let n = difficulty === 'all' ? config.totalQuestions : config.questionsByDifficulty[difficulty];
    if (topicIds.length > 0) {
      // Topic counts ignore difficulty, so this is an upper bound; the server picks what really matches
      n = Math.min(n, config.topics.filter((t) => topicIds.includes(t.id)).reduce((sum, t) => sum + t.count, 0));
    }
    return n;
  }, [config, difficulty, topicIds]);

  const effectiveCount = Math.min(count, Math.max(available, 1));

  function applyPreset(id: PresetId) {
    if (!config) return;
    setPreset(id);
    if (id === 'quick') {
      setMode('study');
      setCount(Math.min(10, config.totalQuestions));
      setTimeLimit(null);
      setDifficulty('all');
      setTopicIds([]);
    } else if (id === 'standard') {
      setMode('exam');
      setCount(Math.min(20, config.totalQuestions));
      setTimeLimit(20);
      setDifficulty('all');
      setTopicIds([]);
    } else if (id === 'jamb') {
      setMode('exam');
      setCount(Math.min(jambCount, config.totalQuestions));
      setTimeLimit(Math.ceil(Math.min(jambCount, config.totalQuestions) * 0.75));
      setDifficulty('all');
      setTopicIds([]);
    }
  }

  // Start with the standard preset sized to the question bank
  useEffect(() => {
    if (config) applyPreset('standard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.courseId]);

  const touch = () => setPreset('custom');

  async function handleStart() {
    if (!config) return;
    setStarting(true);
    const res = await startPracticeSession({
      courseId,
      questionCount: effectiveCount,
      difficulty,
      topicIds: topicIds.length ? topicIds : undefined,
      timeLimitMinutes: timeLimit,
      mode,
    });
    if (res.success) {
      router.push(`/student/cbt/practice/session/${res.sessionId}`);
    } else {
      toast.error(res.error || 'Could not start the session');
      setStarting(false);
    }
  }

  async function handleDiscard() {
    if (!config?.activeSession) return;
    await abandonSession(config.activeSession.id);
    setConfig({ ...config, activeSession: null });
    toast.success('Previous session discarded');
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-6 text-lg text-slate-700">{error?.message ?? 'Something went wrong'}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/student/cbt/courses">Back to subjects</Link>
          </Button>
          {error?.needsSubscription && (
            <Button asChild>
              <Link href="/student/cbt/bundles">View plans</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const presets: Array<{ id: PresetId; title: string; detail: string; icon: React.ReactNode }> = [
    { id: 'quick', title: 'Quick drill', detail: `${Math.min(10, config.totalQuestions)} questions · instant answers`, icon: <Zap className="h-5 w-5" /> },
    { id: 'standard', title: 'Timed practice', detail: `${Math.min(20, config.totalQuestions)} questions · 20 min`, icon: <Timer className="h-5 w-5" /> },
    {
      id: 'jamb',
      title: 'JAMB simulation',
      detail: `${Math.min(jambCount, config.totalQuestions)} questions · ${Math.ceil(Math.min(jambCount, config.totalQuestions) * 0.75)} min`,
      icon: <GraduationCap className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* hero */}
      <div className="bg-gradient-to-br from-[#1F2A5A] via-[#26357a] to-[#2563EB] text-white">
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-6">
          <Link href="/student/cbt/courses" className="mb-5 inline-flex items-center gap-1.5 text-sm text-blue-200 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All subjects
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold sm:text-4xl">{config.courseTitle}</h1>
            {config.accessMode === 'free' && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/40">
                <Gift className="h-3.5 w-3.5" /> Free practice
              </span>
            )}
          </div>
          <p className="mt-2 text-blue-100">
            {config.courseCode} · {config.totalQuestions.toLocaleString()} questions in the bank
            {config.sessionsRemaining !== null && ` · ${config.sessionsRemaining} sessions left on your plan`}
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-6 max-w-4xl space-y-5 px-4">
        {/* resume */}
        {config.activeSession && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div>
              <p className="font-semibold text-amber-900">You have an unfinished test</p>
              <p className="text-sm text-amber-800">
                {config.activeSession.answered}/{config.activeSession.totalQuestions} answered
                {config.activeSession.deadlineAt && ' · the timer is still running'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDiscard}>
                Discard
              </Button>
              <Button size="sm" asChild className="bg-amber-500 text-white hover:bg-amber-600">
                <Link href={`/student/cbt/practice/session/${config.activeSession.id}`}>
                  <RotateCcw className="mr-1.5 h-4 w-4" /> Resume
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* presets */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Pick a session</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={cn(
                  'rounded-xl border-2 p-4 text-left transition',
                  preset === p.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                )}
              >
                <span className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-lg', preset === p.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
                  {p.icon}
                </span>
                <p className="font-semibold text-slate-900">{p.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{p.detail}</p>
              </button>
            ))}
          </div>
        </section>

        {/* mode */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">How do you want to practise?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { id: 'exam', title: 'Exam mode', detail: 'Answers and explanations appear after you submit — just like the real CBT.', icon: <Clock className="h-5 w-5" /> },
              { id: 'study', title: 'Study mode', detail: 'See if you were right, with the explanation, straight after each question.', icon: <BookOpenCheck className="h-5 w-5" /> },
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id);
                  touch();
                }}
                className={cn(
                  'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition',
                  mode === m.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                )}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', mode === m.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
                  {m.icon}
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">{m.title}</span>
                  <span className="text-xs text-slate-500">{m.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* customise */}
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Customise</h2>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="count" className="text-sm font-medium text-slate-700">Number of questions</label>
              <span className="text-2xl font-bold text-blue-700">{effectiveCount}</span>
            </div>
            <input
              id="count"
              type="range"
              min={1}
              max={Math.max(1, Math.min(available, 100))}
              value={Math.min(count, Math.max(1, Math.min(available, 100)))}
              onChange={(e) => {
                setCount(Number(e.target.value));
                touch();
              }}
              className="w-full accent-blue-600"
            />
            <p className="mt-1 text-xs text-slate-500">{available} questions match your filters</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Difficulty</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => {
                const n = d.id === 'all' ? config.totalQuestions : config.questionsByDifficulty[d.id];
                const disabled = n === 0;
                return (
                  <button
                    key={d.id}
                    disabled={disabled}
                    onClick={() => {
                      setDifficulty(d.id);
                      touch();
                    }}
                    className={cn(
                      'rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40',
                      difficulty === d.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-blue-300'
                    )}
                  >
                    {d.label} <span className="opacity-70">({n})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Time limit</p>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => {
                    setTimeLimit(t.value);
                    touch();
                  }}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                    timeLimit === t.value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-blue-300'
                  )}
                >
                  {t.label}
                </button>
              ))}
              {timeLimit !== null && !TIME_OPTIONS.some((t) => t.value === timeLimit) && (
                <span className="rounded-full border border-blue-600 bg-blue-600 px-4 py-1.5 text-sm font-medium text-white">{timeLimit} min</span>
              )}
            </div>
          </div>

          {config.topics.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Topics {topicIds.length === 0 && <span className="font-normal text-slate-400">(all)</span>}</p>
                {topicIds.length > 0 && (
                  <button onClick={() => setTopicIds([])} className="text-xs font-medium text-blue-600 hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {config.topics.map((t) => {
                  const on = topicIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTopicIds((prev) => (on ? prev.filter((id) => id !== t.id) : [...prev, t.id]));
                        touch();
                      }}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition',
                        on ? 'border-blue-600 bg-blue-50 font-medium text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                      )}
                    >
                      {t.name} <span className="opacity-60">({t.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* recent */}
        {config.recentSessions.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Your recent scores</h2>
            <ul className="divide-y divide-slate-100">
              {config.recentSessions.map((s) => (
                <li key={s.id}>
                  <Link href={`/student/cbt/practice/results/${s.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-blue-700">
                    <span className="text-slate-500">
                      {s.completedAt ? new Date(s.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'} · {s.totalQuestions} questions
                    </span>
                    <span className={cn('font-bold', s.scorePercentage >= 50 ? 'text-emerald-600' : 'text-rose-600')}>{Math.round(s.scorePercentage)}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* sticky start bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{effectiveCount} questions</span> · {timeLimit ? `${timeLimit} min` : 'no timer'} ·{' '}
            {mode === 'study' ? 'study' : 'exam'} mode
          </p>
          <Button size="lg" onClick={handleStart} disabled={starting || available === 0} className="bg-[#1F2A5A] px-8 hover:bg-[#2a3a7a]">
            {starting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
            Start
          </Button>
        </div>
      </div>
    </div>
  );
}
