'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageSlot } from '@/components/cbt/ImageSlot';
import { RichContent } from '@/components/cbt/CbtContent';
import { getTopicsByCourse } from '@/lib/actions/admin-cbt-courses.actions';
import type { QuestionImageInputs } from '@/lib/actions/admin-cbt-courses.actions';
import { OPTION_LETTERS, type CbtDifficulty, type OptionLetter } from '@/lib/types/cbt.types';
import { inspectImageCell } from '@/lib/utils/cbt-csv';
import { cn } from '@/lib/utils';

export interface QuestionFormValues {
  topicName: string;
  questionText: string;
  options: Record<OptionLetter, string>;
  correctAnswer: OptionLetter;
  difficulty: CbtDifficulty;
  solution: string;
  images: { question: string; A: string; B: string; C: string; D: string; solution: string };
}

export const EMPTY_QUESTION: QuestionFormValues = {
  topicName: '',
  questionText: '',
  options: { A: '', B: '', C: '', D: '' },
  correctAnswer: 'A',
  difficulty: 'medium',
  solution: '',
  images: { question: '', A: '', B: '', C: '', D: '', solution: '' },
};

/** Row from cbt_questions -> form values */
export function questionToFormValues(q: Record<string, any>): QuestionFormValues {
  return {
    topicName: q.cbt_topics?.topic_name ?? '',
    questionText: q.question_text ?? '',
    options: { A: q.option_a ?? '', B: q.option_b ?? '', C: q.option_c ?? '', D: q.option_d ?? '' },
    correctAnswer: (q.correct_answer ?? 'A') as OptionLetter,
    difficulty: (q.difficulty ?? 'medium') as CbtDifficulty,
    solution: q.solution ?? '',
    images: {
      question: q.question_image_url ?? '',
      A: q.option_a_image_url ?? '',
      B: q.option_b_image_url ?? '',
      C: q.option_c_image_url ?? '',
      D: q.option_d_image_url ?? '',
      solution: q.solution_image_url ?? '',
    },
  };
}

/**
 * Shared create/edit form. `original` (edit mode) lets us send only the images that changed:
 * unchanged -> undefined (keep), removed -> '' (delete), replaced -> new value.
 */
export function QuestionForm({
  courseId,
  initial = EMPTY_QUESTION,
  original,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  courseId: string;
  initial?: QuestionFormValues;
  original?: QuestionFormValues;
  submitLabel: string;
  onSubmit: (values: QuestionFormValues, images: QuestionImageInputs) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<QuestionFormValues>(initial);
  const [topics, setTopics] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTopicsByCourse(courseId).then((res) => {
      if (res.success && res.topics) setTopics(res.topics as Array<{ id: string; name: string }>);
    });
  }, [courseId]);

  const setImage = (key: keyof QuestionFormValues['images'], v: string) =>
    setValues((p) => ({ ...p, images: { ...p.images, [key]: v } }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!values.questionText.trim() && !values.images.question) return toast.error('The question needs text or a diagram');
    for (const l of OPTION_LETTERS) {
      if (!values.options[l].trim() && !values.images[l]) return toast.error(`Option ${l} needs text or an image`);
    }

    // Only send images that changed (edit) — everything non-empty (create)
    const images: QuestionImageInputs = {};
    (Object.keys(values.images) as Array<keyof QuestionFormValues['images']>).forEach((key) => {
      const now = values.images[key];
      if (original) {
        if (now !== original.images[key]) images[key] = now; // '' means "remove"
      } else if (now) {
        images[key] = now;
      }
    });

    setSaving(true);
    const res = await onSubmit(values, images);
    setSaving(false);
    if (!res.success) toast.error(res.error || 'Could not save the question');
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                list="topic-suggestions"
                value={values.topicName}
                onChange={(e) => setValues((p) => ({ ...p, topicName: e.target.value }))}
                placeholder="e.g. Quadratic Equations"
                maxLength={120}
                className="mt-1 h-10"
                autoComplete="off"
              />
              <datalist id="topic-suggestions">
                {topics.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-slate-500">Pick an existing topic or type a new one — it is created automatically.</p>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                value={values.difficulty}
                onChange={(e) => setValues((p) => ({ ...p, difficulty: e.target.value as CbtDifficulty }))}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="q">Question</Label>
            <Textarea
              id="q"
              value={values.questionText}
              onChange={(e) => setValues((p) => ({ ...p, questionText: e.target.value }))}
              placeholder="Type the question. Use $x^2 + 1$ for maths."
              className="mt-1 min-h-28"
              maxLength={3000}
            />
            <p className="mt-1 text-xs text-slate-500">
              Maths: wrap LaTeX in dollar signs, e.g. <code>$\frac&#123;a&#125;&#123;b&#125;$</code>, <code>$\text&#123;H&#125;_2\text&#123;O&#125;$</code>.
            </p>
          </div>
          <ImageSlot label="Question diagram (optional)" value={values.images.question} onChange={(v) => setImage('question', v)} />
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Options</h3>
            <p className="text-xs text-slate-500">Select the correct one</p>
          </div>
          {OPTION_LETTERS.map((letter) => (
            <div key={letter} className={cn('rounded-lg border p-3', values.correctAnswer === letter ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200')}>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct"
                  checked={values.correctAnswer === letter}
                  onChange={() => setValues((p) => ({ ...p, correctAnswer: letter }))}
                  className="h-4 w-4 accent-emerald-600"
                  aria-label={`Option ${letter} is correct`}
                />
                <span className="w-5 font-bold text-slate-700">{letter}</span>
                <Input
                  value={values.options[letter]}
                  onChange={(e) => setValues((p) => ({ ...p, options: { ...p.options, [letter]: e.target.value } }))}
                  placeholder={`Option ${letter} text`}
                  maxLength={1000}
                />
              </div>
              <div className="ml-12 mt-2">
                <ImageSlot compact label={`Option ${letter} image (optional)`} value={values.images[letter]} onChange={(v) => setImage(letter, v)} />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <Label htmlFor="solution">Solution / explanation</Label>
          <Textarea
            id="solution"
            value={values.solution}
            onChange={(e) => setValues((p) => ({ ...p, solution: e.target.value }))}
            placeholder="Show the working. Students see this after answering."
            className="min-h-24"
          />
          <ImageSlot label="Solution diagram (optional)" value={values.images.solution} onChange={(v) => setImage('solution', v)} />
        </section>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {/* live preview exactly as a student will see it */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Student preview</p>
          <RichContent
            text={values.questionText || 'Your question appears here…'}
            imageUrl={null}
            alt="preview"
            textClassName="font-medium text-slate-900"
          />
          {values.images.question && <PreviewImage value={values.images.question} />}
          <div className="mt-4 space-y-2">
            {OPTION_LETTERS.map((l) => (
              <div key={l} className={cn('flex items-start gap-2 rounded-lg border p-2.5 text-sm', values.correctAnswer === l ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200')}>
                <span className="font-bold text-slate-500">{l}</span>
                <div className="min-w-0 flex-1">
                  <RichContent text={values.options[l]} imageUrl={null} alt={`Option ${l}`} />
                  {values.images[l] && <PreviewImage value={values.images[l]} small />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </form>
  );
}

function PreviewImage({ value, small }: { value: string; small?: boolean }) {
  const src = inspectImageCell(value).previewSrc;
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="diagram preview" className={cn('mt-2 w-auto rounded border bg-white', small ? 'max-h-20' : 'max-h-40')} />;
}
