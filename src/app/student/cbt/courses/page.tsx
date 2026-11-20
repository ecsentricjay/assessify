'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Gift, Loader2, Lock, Search, Trophy } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { getPracticeCourses } from '@/lib/actions/student-cbt-practice.actions';
import type { PracticeCourseCard } from '@/lib/types/cbt.types';
import { cn } from '@/lib/utils';

// Rotating accents so subjects are easy to tell apart at a glance
const ACCENTS = [
  'from-blue-600 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-700',
  'from-violet-500 to-purple-700',
  'from-cyan-500 to-sky-700',
];

export default function CbtCoursesPage() {
  const [courses, setCourses] = useState<PracticeCourseCard[]>([]);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      const res = await getPracticeCourses();
      if (res.success) {
        setCourses(res.courses);
        setSubscriptionRequired(res.subscriptionRequired);
      } else {
        setError(res.error ?? 'Could not load subjects');
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [courses, query]);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-gradient-to-br from-[#1F2A5A] via-[#26357a] to-[#2563EB] text-white">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold sm:text-4xl">Choose a subject</h1>
            {!subscriptionRequired && !loading && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/40">
                <Gift className="h-3.5 w-3.5" /> All practice is free
              </span>
            )}
          </div>
          <p className="mt-2 max-w-xl text-blue-100">Practise past-question style CBT, track your scores, and find the topics that need work.</p>

          <div className="relative mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects…"
              className="h-11 border-0 bg-white pl-10 text-slate-900 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-6 max-w-6xl px-4">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <p className="rounded-2xl bg-white p-10 text-center text-rose-600 shadow-sm">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            {courses.length === 0 ? 'No subjects have been published yet.' : 'No subject matches your search.'}
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course, i) => {
              const href = course.hasAccess ? `/student/cbt/courses/${course.id}/practice` : '/student/cbt/bundles';
              return (
                <Link
                  key={course.id}
                  href={href}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className={cn('relative flex h-24 items-end bg-gradient-to-br p-4 text-white', ACCENTS[i % ACCENTS.length])}>
                    <BookOpen className="absolute right-4 top-4 h-12 w-12 opacity-20" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{course.code}</p>
                      <h2 className="text-xl font-bold leading-tight">{course.title}</h2>
                    </div>
                    {!course.hasAccess && (
                      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-xs font-semibold">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    {course.description && <p className="mb-3 line-clamp-2 text-sm text-slate-600">{course.description}</p>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{course.questionCount.toLocaleString()} questions</span>
                      {course.bestScore !== null && (
                        <span className="flex items-center gap-1 font-semibold text-amber-600">
                          <Trophy className="h-3.5 w-3.5" /> Best {Math.round(course.bestScore)}%
                        </span>
                      )}
                    </div>

                    {course.sessionsCompleted > 0 && (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                          <span>{course.sessionsCompleted} sessions</span>
                          <span>Avg {course.averageScore}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-blue-600" style={{ width: `${course.averageScore ?? 0}%` }} />
                        </div>
                      </div>
                    )}

                    <p className="mt-4 flex items-center gap-1 text-sm font-semibold text-blue-700">
                      {course.hasAccess ? 'Start practising' : 'Unlock with a plan'}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </p>
                    {course.subscription && subscriptionRequired && (
                      <p className="mt-1 text-xs text-slate-400">{course.subscription.daysRemaining} days of access left</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
