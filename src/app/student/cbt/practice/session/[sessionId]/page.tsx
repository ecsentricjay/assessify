'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Grid3x3,
  Lightbulb,
  Loader2,
  Send,
  WifiOff,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MathText, RichContent } from '@/components/cbt/CbtContent';
import { getPracticeSession } from '@/lib/actions/student-cbt-practice.actions';
import { OPTION_LETTERS, type AnswerState, type OptionLetter, type PracticeSessionDTO } from '@/lib/types/cbt.types';
import { cn } from '@/lib/utils';

type SaveState = 'saving' | 'saved' | 'error';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** POST an answer, retrying on network trouble. Returns null if every attempt failed. */
async function postAnswer(sessionId: string, questionId: string, selectedAnswer: OptionLetter) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('/api/cbt/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId, selectedAnswer }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) return data;
      // Client/auth/expiry errors won't fix themselves on retry
      if ([400, 401, 404, 409].includes(res.status)) return data ?? { success: false };
    } catch {
      /* offline — retry */
    }
    await sleep(500 * 2 ** attempt);
  }
  return null;
}

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<PracticeSessionDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [pendingStudy, setPendingStudy] = useState<string | null>(null);
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const serverOffsetRef = useRef(0);
  const seqRef = useRef<Record<string, number>>({});
  const submittingRef = useRef(false);
  const allowLeaveRef = useRef(false);
  const warnedRef = useRef({ five: false, one: false });

  // ------------------------------------------------------------------ load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getPracticeSession(sessionId);
      if (cancelled) return;

      if (!res.success) {
        toast.error(res.error || 'Could not load this session');
        router.replace('/student/cbt/courses');
        return;
      }
      if (res.finished) {
        if (res.status === 'completed') router.replace(`/student/cbt/practice/results/${sessionId}`);
        else {
          toast.info('This session was closed.');
          router.replace('/student/cbt/courses');
        }
        return;
      }

      const s = res.session;
      serverOffsetRef.current = new Date(s.serverNow).getTime() - Date.now();
      setSession(s);
      setAnswers(s.answers);
      const firstOpen = s.questions.findIndex((q) => !s.answers[q.id]);
      setIndex(firstOpen === -1 ? 0 : firstOpen);

      try {
        const saved = localStorage.getItem(`cbt_flags_${sessionId}`);
        if (saved) setFlags(new Set(JSON.parse(saved) as string[]));
      } catch {
        /* storage unavailable — flags are a convenience only */
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  // ------------------------------------------------------------------ submit
  const submit = useCallback(
    async (auto = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);
      setPaletteOpen(false);
      if (auto) toast.warning("Time's up — submitting your answers…");

      const snapshot: Record<string, string> = {};
      Object.entries(answersRef.current).forEach(([qid, a]) => (snapshot[qid] = a.selected));

      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetch('/api/cbt/complete-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, answers: snapshot }),
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.success) {
            allowLeaveRef.current = true;
            try {
              localStorage.removeItem(`cbt_flags_${sessionId}`);
            } catch {
              /* ignore */
            }
            router.replace(`/student/cbt/practice/results/${sessionId}`);
            return;
          }
          if (res.status === 400 || res.status === 404) {
            toast.error(data?.error || 'This session can no longer be submitted');
            break;
          }
        } catch {
          /* offline — retry */
        }
        await sleep(800 * (attempt + 1));
      }

      toast.error('Could not submit — check your connection and press Submit again. Your answers are safe.');
      submittingRef.current = false;
      setSubmitting(false);
    },
    [sessionId, router]
  );
  const submitRef = useRef(submit);
  submitRef.current = submit;

  // ------------------------------------------------------------------ timer (server clock based)
  useEffect(() => {
    if (!session) return;
    const deadline = session.deadlineAt ? new Date(session.deadlineAt).getTime() : null;
    const startedAt = new Date(session.startedAt).getTime();

    const tick = () => {
      const now = Date.now() + serverOffsetRef.current;
      if (deadline) {
        const left = Math.max(0, Math.ceil((deadline - now) / 1000));
        setRemaining(left);
        if (left <= 300 && !warnedRef.current.five && left > 60) {
          warnedRef.current.five = true;
          toast.warning('5 minutes left');
        }
        if (left <= 60 && left > 0 && !warnedRef.current.one) {
          warnedRef.current.one = true;
          toast.warning('1 minute left!');
        }
        if (left === 0) void submitRef.current(true);
      } else {
        setElapsed(Math.max(0, Math.floor((now - startedAt) / 1000)));
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [session]);

  // ------------------------------------------------------------------ leave warning
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Re-send answers that failed to save once the connection is back
  useEffect(() => {
    const onOnline = () => {
      Object.entries(saveState).forEach(([qid, state]) => {
        const a = answersRef.current[qid];
        if (state === 'error' && a) void persist(qid, a.selected);
      });
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState]);

  // ------------------------------------------------------------------ answers
  async function persist(questionId: string, letter: OptionLetter) {
    const mySeq = (seqRef.current[questionId] = (seqRef.current[questionId] ?? 0) + 1);
    setSaveState((prev) => ({ ...prev, [questionId]: 'saving' }));
    const data = await postAnswer(sessionId, questionId, letter);
    if (seqRef.current[questionId] !== mySeq) return; // a newer choice superseded this one
    if (data?.success) setSaveState((prev) => ({ ...prev, [questionId]: 'saved' }));
    else if (data?.expired) void submitRef.current(true);
    else setSaveState((prev) => ({ ...prev, [questionId]: 'error' }));
  }

  async function choose(letter: OptionLetter) {
    if (!session || submitting || pendingStudy) return;
    const q = session.questions[index];
    if (!q) return;

    if (session.mode === 'study') {
      if (answersRef.current[q.id]) return; // locked after the first answer
      setPendingStudy(q.id);
      const data = await postAnswer(sessionId, q.id, letter);
      setPendingStudy(null);
      if (data?.success) {
        setAnswers((prev) => ({
          ...prev,
          [q.id]: {
            selected: letter,
            isCorrect: data.isCorrect,
            correctAnswer: data.correctAnswer,
            solution: data.solution,
            solutionImageUrl: data.solutionImageUrl,
          },
        }));
      } else if (data?.expired) {
        void submitRef.current(true);
      } else {
        toast.error('Could not save that answer — check your connection and try again');
      }
      return;
    }

    setAnswers((prev) => ({ ...prev, [q.id]: { selected: letter } }));
    void persist(q.id, letter);
  }

  function toggleFlag() {
    if (!session) return;
    const id = session.questions[index]?.id;
    if (!id) return;
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(`cbt_flags_${sessionId}`, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const total = session?.questions.length ?? 0;
  const goNext = () => setIndex((i) => Math.min(total - 1, i + 1));
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  // keyboard shortcuts (A-D to answer, ←/→ to move, F to flag)
  const keyHandlers = useRef({ choose, goNext, goPrev, toggleFlag });
  keyHandlers.current = { choose, goNext, goPrev, toggleFlag };
  const dialogOpenRef = useRef(false);
  dialogOpenRef.current = confirmOpen || paletteOpen;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialogOpenRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      const key = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(key)) keyHandlers.current.choose(key.toUpperCase() as OptionLetter);
      else if (['1', '2', '3', '4'].includes(key)) keyHandlers.current.choose(OPTION_LETTERS[Number(key) - 1]);
      else if (key === 'arrowright' || key === 'n') keyHandlers.current.goNext();
      else if (key === 'arrowleft' || key === 'p') keyHandlers.current.goPrev();
      else if (key === 'f') keyHandlers.current.toggleFlag();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ------------------------------------------------------------------ derived
  const question = session?.questions[index];
  const answeredCount = session ? session.questions.filter((q) => answers[q.id]).length : 0;
  const unansweredNumbers = useMemo(
    () => (session ? session.questions.filter((q) => !answers[q.id]).map((q) => q.questionNumber) : []),
    [session, answers]
  );
  const flaggedCount = session ? session.questions.filter((q) => flags.has(q.id)).length : 0;
  const anySaving = Object.values(saveState).includes('saving');
  const anyError = Object.values(saveState).includes('error');
  const timed = session?.deadlineAt != null;
  const lowTime = timed && remaining !== null && remaining <= 300;
  const critical = timed && remaining !== null && remaining <= 60;

  if (loading || !session || !question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-blue-600" />
          <p className="font-medium text-slate-600">Loading your session…</p>
        </div>
      </div>
    );
  }

  const answer = answers[question.id];
  const isStudy = session.mode === 'study';
  const isLast = index === total - 1;

  function jumpTo(i: number) {
    setIndex(i);
    setPaletteOpen(false);
  }

  const palette = (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {session.questions.map((q, i) => {
          const a = answers[q.id];
          const flagged = flags.has(q.id);
          const current = i === index;
          let tone = 'border-slate-200 bg-white text-slate-600 hover:border-slate-400';
          if (a) tone = 'border-blue-600 bg-blue-600 text-white';
          if (isStudy && a) tone = a.isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-rose-600 bg-rose-600 text-white';
          return (
            <button
              key={q.id}
              onClick={() => jumpTo(i)}
              className={cn(
                'relative h-10 rounded-lg border-2 text-sm font-semibold transition',
                tone,
                current && 'ring-2 ring-offset-2 ring-[#1F2A5A]'
              )}
              aria-label={`Question ${q.questionNumber}${a ? ', answered' : ''}${flagged ? ', flagged' : ''}`}
            >
              {q.questionNumber}
              {flagged && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-blue-600" /> Answered</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded border-2 border-slate-300 bg-white" /> Not answered</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-amber-400" /> Flagged</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded ring-2 ring-[#1F2A5A]" /> Current</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* ---------- top bar ---------- */}
      <header className="sticky top-0 z-30 bg-[#1F2A5A] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-blue-200">
              {session.courseCode} · {isStudy ? 'Study mode' : 'Exam mode'}
            </p>
            <p className="truncate text-base font-semibold leading-tight sm:text-lg">{session.courseTitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-base font-bold tabular-nums',
                critical ? 'animate-pulse bg-rose-500' : lowTime ? 'bg-amber-500 text-slate-900' : 'bg-white/15'
              )}
              aria-label={timed ? 'Time remaining' : 'Time elapsed'}
            >
              <Clock className="h-4 w-4" />
              {timed ? formatClock(remaining ?? 0) : formatClock(elapsed)}
            </div>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="hidden bg-emerald-500 font-semibold text-white hover:bg-emerald-600 sm:inline-flex"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit
            </Button>
          </div>
        </div>
        <div className="h-1 bg-white/10">
          <div className="h-full bg-cyan-300 transition-all" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
      </header>

      {anyError && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          <WifiOff className="mr-2 inline h-4 w-4" />
          Some answers haven&apos;t synced yet. They&apos;re kept on this screen and will be sent when you reconnect or submit.
        </div>
      )}

      {/* ---------- body ---------- */}
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pb-28 pt-5 lg:grid-cols-[1fr_300px] lg:pb-10">
        <section>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#1F2A5A] px-3 py-1 text-sm font-bold text-white">
                Q{question.questionNumber}
                <span className="font-normal text-blue-200"> / {total}</span>
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                  question.difficulty === 'easy' && 'bg-emerald-100 text-emerald-700',
                  question.difficulty === 'medium' && 'bg-amber-100 text-amber-700',
                  question.difficulty === 'hard' && 'bg-rose-100 text-rose-700'
                )}
              >
                {question.difficulty}
              </span>
              {question.topicName && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{question.topicName}</span>
              )}
              <button
                onClick={toggleFlag}
                className={cn(
                  'ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition',
                  flags.has(question.id)
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-400'
                )}
              >
                <Flag className="h-3.5 w-3.5" />
                {flags.has(question.id) ? 'Flagged' : 'Flag for review'}
              </button>
            </div>

            <RichContent
              text={question.questionText}
              imageUrl={question.questionImageUrl}
              alt={`Diagram for question ${question.questionNumber}`}
              textClassName="text-lg font-medium leading-relaxed text-slate-900 sm:text-xl"
            />

            {/* options */}
            <div className="mt-6 space-y-3" role="radiogroup" aria-label="Answer options">
              {OPTION_LETTERS.map((letter) => {
                const opt = question.options[letter];
                const selected = answer?.selected === letter;
                const revealed = isStudy && !!answer;
                const isRight = revealed && answer?.correctAnswer === letter;
                const isWrongPick = revealed && selected && !answer?.isCorrect;
                const locked = isStudy && !!answer;

                return (
                  <div
                    key={letter}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    onClick={() => choose(letter)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void choose(letter);
                      }
                    }}
                    className={cn(
                      'flex items-start gap-4 rounded-xl border-2 p-4 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                      locked ? 'cursor-default' : 'cursor-pointer',
                      !revealed && !selected && 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40',
                      !revealed && selected && 'border-blue-600 bg-blue-50',
                      isRight && 'border-emerald-500 bg-emerald-50',
                      isWrongPick && 'border-rose-500 bg-rose-50',
                      revealed && !isRight && !isWrongPick && 'border-slate-200 bg-white opacity-60'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                        !revealed && !selected && 'border-slate-300 text-slate-500',
                        !revealed && selected && 'border-blue-600 bg-blue-600 text-white',
                        isRight && 'border-emerald-500 bg-emerald-500 text-white',
                        isWrongPick && 'border-rose-500 bg-rose-500 text-white',
                        revealed && !isRight && !isWrongPick && 'border-slate-300 text-slate-400'
                      )}
                    >
                      {pendingStudy === question.id && selected ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isRight ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isWrongPick ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        letter
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <RichContent
                        text={opt.text}
                        imageUrl={opt.imageUrl}
                        alt={`Option ${letter} diagram`}
                        textClassName="text-base text-slate-800"
                        imageClassName="mt-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* study-mode feedback */}
            {isStudy && answer && (
              <div
                className={cn(
                  'mt-6 rounded-xl border p-4',
                  answer.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
                )}
              >
                <p className={cn('flex items-center gap-2 font-semibold', answer.isCorrect ? 'text-emerald-800' : 'text-rose-800')}>
                  {answer.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  {answer.isCorrect ? 'Correct!' : `Not quite — the answer is ${answer.correctAnswer}`}
                </p>
                {(answer.solution || answer.solutionImageUrl) && (
                  <div className="mt-3 border-t border-black/5 pt-3">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <Lightbulb className="h-3.5 w-3.5" /> Explanation
                    </p>
                    <RichContent
                      text={answer.solution}
                      imageUrl={answer.solutionImageUrl}
                      alt="Solution diagram"
                      textClassName="text-sm leading-relaxed text-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            {/* desktop nav */}
            <div className="mt-8 hidden items-center justify-between lg:flex">
              <Button variant="outline" onClick={goPrev} disabled={index === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <span className="text-xs text-slate-400">
                Keys: <kbd className="rounded border px-1">A</kbd>–<kbd className="rounded border px-1">D</kbd> answer ·{' '}
                <kbd className="rounded border px-1">←</kbd> <kbd className="rounded border px-1">→</kbd> move ·{' '}
                <kbd className="rounded border px-1">F</kbd> flag
              </span>
              {isLast ? (
                <Button onClick={() => setConfirmOpen(true)} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600">
                  Finish <Send className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={goNext}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ---------- desktop palette ---------- */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-semibold text-slate-900">Questions</h2>
              <span className="text-sm text-slate-500">
                {answeredCount}/{total} answered
              </span>
            </div>
            {palette}
            <p className="mt-4 text-xs text-slate-400">
              {anySaving ? 'Saving…' : anyError ? 'Some answers not synced' : 'All answers saved'}
              {flaggedCount > 0 && ` · ${flaggedCount} flagged`}
            </p>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="mt-4 w-full bg-emerald-500 font-semibold hover:bg-emerald-600"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit test
            </Button>
          </div>
        </aside>
      </main>

      {/* ---------- mobile bottom bar ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3">
          <Button variant="outline" size="icon" onClick={goPrev} disabled={index === 0} aria-label="Previous question">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setPaletteOpen(true)}>
            <Grid3x3 className="mr-2 h-4 w-4" />
            {answeredCount}/{total}
            {flaggedCount > 0 && <Flag className="ml-2 h-3.5 w-3.5 text-amber-500" />}
          </Button>
          {isLast ? (
            <Button onClick={() => setConfirmOpen(true)} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600">
              Finish
            </Button>
          ) : (
            <Button size="icon" onClick={goNext} aria-label="Next question">
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </nav>

      {/* ---------- mobile palette sheet ---------- */}
      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>
              Questions · {answeredCount}/{total} answered
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {palette}
            <Button onClick={() => setConfirmOpen(true)} className="mt-5 w-full bg-emerald-500 hover:bg-emerald-600">
              Submit test
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ---------- submit confirmation ---------- */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit your test?</DialogTitle>
            <DialogDescription>You won&apos;t be able to change your answers after submitting.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-2xl font-bold text-blue-700">{answeredCount}</p>
              <p className="text-xs text-slate-600">Answered</p>
            </div>
            <div className={cn('rounded-xl p-3', unansweredNumbers.length ? 'bg-amber-50' : 'bg-emerald-50')}>
              <p className={cn('text-2xl font-bold', unansweredNumbers.length ? 'text-amber-700' : 'text-emerald-700')}>
                {unansweredNumbers.length}
              </p>
              <p className="text-xs text-slate-600">Unanswered</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-2xl font-bold text-slate-700">{flaggedCount}</p>
              <p className="text-xs text-slate-600">Flagged</p>
            </div>
          </div>

          {unansweredNumbers.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-900">
                <AlertTriangle className="h-4 w-4" /> Unanswered questions score zero. Tap one to go back:
              </p>
              <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                {unansweredNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setConfirmOpen(false);
                      setIndex(n - 1);
                    }}
                    className="h-8 min-w-8 rounded-md bg-white px-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep practising
            </Button>
            <Button onClick={() => submit(false)} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* keeps MathText import used for future inline hints */}
      <span className="hidden">
        <MathText text="" />
      </span>
    </div>
  );
}
