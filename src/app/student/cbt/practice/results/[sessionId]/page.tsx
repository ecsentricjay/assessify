'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Lightbulb, Loader2, MinusCircle, RotateCcw, Target, Trophy, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { RichContent } from '@/components/cbt/CbtContent';
import { getSessionResults, startPracticeSession } from '@/lib/actions/student-cbt-practice.actions';
import { OPTION_LETTERS, type SessionResultDTO } from '@/lib/types/cbt.types';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'wrong' | 'unanswered' | 'correct';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}

function ScoreRing({ value, passed }: { value: number; passed: boolean }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <div className="relative h-40 w-40">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={passed ? '#34d399' : '#fbbf24'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{Math.round(value)}%</span>
        <span className="text-xs uppercase tracking-wider text-blue-200">score</span>
      </div>
    </div>
  );
}

export default function PracticeResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [result, setResult] = useState<SessionResultDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getSessionResults(sessionId);
      if (!res.success) {
        toast.error(res.error || 'Could not load results');
        router.replace('/student/cbt/courses');
        return;
      }
      if (res.result.status === 'in_progress') {
        router.replace(`/student/cbt/practice/session/${sessionId}`);
        return;
      }
      setResult(res.result);
      setLoading(false);
    })();
  }, [sessionId, router]);

  const missed = useMemo(() => result?.questions.filter((q) => !q.isCorrect) ?? [], [result]);

  const visible = useMemo(() => {
    if (!result) return [];
    switch (filter) {
      case 'wrong':
        return result.questions.filter((q) => q.selected && !q.isCorrect);
      case 'unanswered':
        return result.questions.filter((q) => !q.selected);
      case 'correct':
        return result.questions.filter((q) => q.isCorrect);
      default:
        return result.questions;
    }
  }, [result, filter]);

  async function retryMissed() {
    if (!result || missed.length === 0) return;
    setRetrying(true);
    const res = await startPracticeSession({
      courseId: result.courseId,
      questionCount: missed.length,
      questionIds: missed.map((q) => q.id),
      mode: 'study',
      timeLimitMinutes: null,
    });
    if (res.success) router.push(`/student/cbt/practice/session/${res.sessionId}`);
    else {
      toast.error(res.error || 'Could not start a retry session');
      setRetrying(false);
    }
  }

  if (loading || !result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const message =
    result.scorePercentage >= 70
      ? { title: 'Excellent work!', body: "You're on track for a strong JAMB score. Keep the momentum going." }
      : result.passed
      ? { title: 'Good job!', body: 'Solid result. Review the ones you missed to push higher.' }
      : { title: 'Keep going!', body: "Every attempt teaches you something. Retry the questions you missed — that's where the marks are." };

  const tabs: Array<{ id: Filter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: result.questions.length },
    { id: 'wrong', label: 'Wrong', count: result.wrongAnswers },
    { id: 'unanswered', label: 'Skipped', count: result.unanswered },
    { id: 'correct', label: 'Correct', count: result.correctAnswers },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* hero */}
      <div className="bg-gradient-to-br from-[#1F2A5A] via-[#26357a] to-[#2563EB] text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pb-12 pt-10 text-center sm:flex-row sm:text-left">
          <ScoreRing value={result.scorePercentage} passed={result.passed} />
          <div>
            <p className="text-sm font-medium text-blue-200">
              {result.courseCode} · {result.courseTitle}
            </p>
            <h1 className="mt-1 flex items-center justify-center gap-2 text-3xl font-bold sm:justify-start">
              {result.passed && <Trophy className="h-7 w-7 text-amber-300" />}
              {message.title}
            </h1>
            <p className="mt-2 max-w-md text-blue-100">{message.body}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-6 max-w-4xl space-y-5 px-4">
        {/* stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Correct', value: result.correctAnswers, icon: <CheckCircle2 className="h-5 w-5" />, tone: 'text-emerald-600 bg-emerald-50' },
            { label: 'Wrong', value: result.wrongAnswers, icon: <XCircle className="h-5 w-5" />, tone: 'text-rose-600 bg-rose-50' },
            { label: 'Skipped', value: result.unanswered, icon: <MinusCircle className="h-5 w-5" />, tone: 'text-amber-600 bg-amber-50' },
            { label: 'Time', value: formatDuration(result.timeTakenSeconds), icon: <Clock className="h-5 w-5" />, tone: 'text-blue-600 bg-blue-50' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-lg', s.tone)}>{s.icon}</span>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* actions */}
        <div className="flex flex-wrap gap-3">
          {missed.length > 0 && (
            <Button onClick={retryMissed} disabled={retrying} className="bg-[#1F2A5A] hover:bg-[#2a3a7a]">
              {retrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
              Retry the {missed.length} I missed
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/student/cbt/courses/${result.courseId}/practice`}>
              <RotateCcw className="mr-2 h-4 w-4" /> New session
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/student/cbt/courses">All subjects</Link>
          </Button>
        </div>

        {/* breakdowns */}
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">By difficulty</h2>
            <div className="space-y-3">
              {(['easy', 'medium', 'hard'] as const).map((d) => {
                const { total, correct } = result.byDifficulty[d];
                if (total === 0) return null;
                const pct = Math.round((correct / total) * 100);
                return (
                  <div key={d}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize text-slate-700">{d}</span>
                      <span className="text-slate-500">
                        {correct}/{total} · {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', d === 'easy' ? 'bg-emerald-500' : d === 'medium' ? 'bg-amber-500' : 'bg-rose-500')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Topics to focus on</h2>
            <ul className="space-y-3">
              {result.byTopic.slice(0, 5).map((t) => {
                const pct = Math.round((t.correct / t.total) * 100);
                return (
                  <li key={t.topic}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate pr-2 text-slate-700">{t.topic}</span>
                      <span className="shrink-0 text-slate-500">
                        {t.correct}/{t.total}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn('h-full rounded-full', pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* review */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Review your answers</h2>
            <div className="flex gap-1.5 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                    filter === t.id ? 'bg-[#1F2A5A] text-white' : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {t.label} <span className="opacity-70">{t.count}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Nothing here — nice.</p>
          ) : (
            <div className="space-y-4">
              {visible.map((q) => (
                <article key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-sm font-bold text-white">Q{q.number}</span>
                    {q.isCorrect ? (
                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Correct</span>
                    ) : q.selected ? (
                      <span className="flex items-center gap-1 text-sm font-semibold text-rose-600"><XCircle className="h-4 w-4" /> Wrong</span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm font-semibold text-amber-600"><MinusCircle className="h-4 w-4" /> Skipped</span>
                    )}
                    {q.topicName && <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{q.topicName}</span>}
                  </div>

                  <RichContent text={q.text} imageUrl={q.imageUrl} alt={`Diagram for question ${q.number}`} textClassName="text-base font-medium text-slate-900" />

                  <div className="mt-4 space-y-2">
                    {OPTION_LETTERS.map((letter) => {
                      const isRight = q.correctAnswer === letter;
                      const isWrongPick = q.selected === letter && !isRight;
                      return (
                        <div
                          key={letter}
                          className={cn(
                            'flex items-start gap-3 rounded-lg border p-3 text-sm',
                            isRight && 'border-emerald-400 bg-emerald-50',
                            isWrongPick && 'border-rose-400 bg-rose-50',
                            !isRight && !isWrongPick && 'border-slate-200'
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                              isRight ? 'bg-emerald-500 text-white' : isWrongPick ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            {letter}
                          </span>
                          <div className="min-w-0 flex-1">
                            <RichContent text={q.options[letter].text} imageUrl={q.options[letter].imageUrl} alt={`Option ${letter}`} textClassName="text-slate-800" />
                          </div>
                          {isRight && <span className="shrink-0 text-xs font-semibold text-emerald-700">Correct answer</span>}
                          {isWrongPick && <span className="shrink-0 text-xs font-semibold text-rose-700">Your answer</span>}
                        </div>
                      );
                    })}
                  </div>

                  {(q.solution || q.solutionImageUrl) && (
                    <div className="mt-4 rounded-lg bg-blue-50 p-4">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700">
                        <Lightbulb className="h-3.5 w-3.5" /> Explanation
                      </p>
                      <RichContent text={q.solution} imageUrl={q.solutionImageUrl} alt="Solution diagram" textClassName="text-sm leading-relaxed text-slate-700" />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
