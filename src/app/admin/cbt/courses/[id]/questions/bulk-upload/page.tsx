'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MathText } from '@/components/cbt/CbtContent';
import { bulkUploadQuestions, getCourseById, getTopicsByCourse, type BulkQuestionInput } from '@/lib/actions/admin-cbt-courses.actions';
import {
  AI_CSV_PROMPT,
  CSV_HEADERS,
  buildCsvTemplate,
  inspectImageCell,
  parseQuestionCsv,
  validateRow,
  type ParsedQuestionRow,
} from '@/lib/utils/cbt-csv';
import { fileToDataUri } from '@/lib/utils/image-file';
import { cn } from '@/lib/utils';

const BATCH_MAX_ROWS = 10;
const BATCH_MAX_CHARS = 3_500_000; // keeps each request comfortably below the 8MB server-action limit
const PAGE_SIZE = 25;

type Stage = 'idle' | 'preview' | 'importing' | 'done';

function rowChars(r: ParsedQuestionRow) {
  const i = r.images;
  return r.questionText.length + (r.solution?.length ?? 0) + i.question.length + i.A.length + i.B.length + i.C.length + i.D.length + i.solution.length + 600;
}

function toInput(r: ParsedQuestionRow): BulkQuestionInput {
  return {
    rowNumber: r.rowNumber,
    topicName: r.topicName,
    questionText: r.questionText,
    optionA: r.options.A,
    optionB: r.options.B,
    optionC: r.options.C,
    optionD: r.options.D,
    correctAnswer: r.correctAnswer as 'A' | 'B' | 'C' | 'D',
    solution: r.solution,
    difficulty: r.difficulty,
    images: r.images,
  };
}

function download(filename: string, text: string) {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkUploadQuestionsPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [courseTitle, setCourseTitle] = useState('');
  const [existingTopics, setExistingTopics] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>('idle');
  const [fileName, setFileName] = useState('');
  const [fatal, setFatal] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedQuestionRow[]>([]);
  const [page, setPage] = useState(0);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<{ imported: number; errors: string[] } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);
  const attachTarget = useRef<{ rowNumber: number; slot: 'question' | 'solution' } | null>(null);

  useEffect(() => {
    getCourseById(courseId).then((res) => {
      if (res.success && res.course) setCourseTitle((res.course as { course_title: string }).course_title);
    });
    getTopicsByCourse(courseId).then((res) => {
      if (res.success && res.topics) setExistingTopics((res.topics as Array<{ name: string }>).map((t) => t.name.trim().replace(/\s+/g, ' ').toLowerCase()));
    });
  }, [courseId]);

  // Topics found in the CSV: how many questions each, and whether it will be newly created
  const topicSummary = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    let noTopic = 0;
    rows.filter((r) => r.errors.length === 0).forEach((r) => {
      const label = r.topicName?.trim().replace(/\s+/g, ' ');
      if (!label) {
        noTopic += 1;
        return;
      }
      const key = label.toLowerCase();
      const cur = counts.get(key) ?? { label, count: 0 };
      cur.count += 1;
      counts.set(key, cur);
    });
    const topics = [...counts.entries()]
      .map(([key, v]) => ({ ...v, isNew: !existingTopics.includes(key) }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return { topics, noTopic };
  }, [rows, existingTopics]);

  const valid = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalid = rows.length - valid.length;
  const withImages = useMemo(
    () => rows.filter((r) => Object.values(r.images).some((v) => v.trim())).length,
    [rows]
  );
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.ceil(rows.length / PAGE_SIZE);

  const loadFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      toast.error('Please choose a .csv file');
      return;
    }
    const text = await file.text();
    const parsed = parseQuestionCsv(text);
    setFileName(file.name);
    setFatal(parsed.fatal ?? null);
    setRows(parsed.rows);
    setPage(0);
    setSummary(null);
    setStage(parsed.fatal ? 'idle' : 'preview');
  }, []);

  function updateRow(rowNumber: number, mutate: (r: ParsedQuestionRow) => ParsedQuestionRow) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const next = mutate({ ...r, images: { ...r.images }, errors: [...r.errors] });
        validateRow(next);
        return next;
      })
    );
  }

  async function handleAttach(file: File | undefined) {
    const target = attachTarget.current;
    if (!file || !target) return;
    try {
      const uri = await fileToDataUri(file);
      updateRow(target.rowNumber, (r) => {
        r.images[target.slot] = uri;
        return r;
      });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function runImport() {
    if (valid.length === 0) return;
    setStage('importing');

    const batches: ParsedQuestionRow[][] = [];
    let current: ParsedQuestionRow[] = [];
    let size = 0;
    for (const r of valid) {
      const c = rowChars(r);
      if (current.length > 0 && (current.length >= BATCH_MAX_ROWS || size + c > BATCH_MAX_CHARS)) {
        batches.push(current);
        current = [];
        size = 0;
      }
      current.push(r);
      size += c;
    }
    if (current.length) batches.push(current);

    setProgress({ done: 0, total: valid.length });
    let imported = 0;
    const errors: string[] = [];
    let processed = 0;

    for (const batch of batches) {
      try {
        const res = await bulkUploadQuestions(courseId, batch.map(toInput));
        if (res.success) {
          imported += res.imported;
          errors.push(...res.errors);
        } else {
          errors.push(...batch.map((r) => `Row ${r.rowNumber}: ${res.error}`));
        }
      } catch (error) {
        errors.push(...batch.map((r) => `Row ${r.rowNumber}: ${(error as Error).message}`));
      }
      processed += batch.length;
      setProgress({ done: processed, total: valid.length });
    }

    setSummary({ imported, errors });
    setStage('done');
    if (imported > 0) toast.success(`${imported} question${imported === 1 ? '' : 's'} imported`);
  }

  function reset() {
    setStage('idle');
    setRows([]);
    setFileName('');
    setFatal(null);
    setSummary(null);
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AI_CSV_PROMPT);
      toast.success('Prompt copied — paste it into your AI model');
    } catch {
      toast.error('Could not copy — select the text and copy manually');
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link href={`/admin/cbt/courses/${courseId}/questions`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to questions
      </Link>
      <h1 className="text-3xl font-bold text-slate-900">Bulk upload questions</h1>
      <p className="mb-6 mt-1 text-slate-600">{courseTitle && `${courseTitle} · `}Upload a CSV — diagrams can be embedded right in the file.</p>

      {/* help */}
      <Card className="mb-6">
        <button onClick={() => setHelpOpen((o) => !o)} className="flex w-full items-center justify-between p-5 text-left">
          <span className="font-semibold text-slate-900">CSV format, diagrams &amp; AI prompt</span>
          <ChevronDown className={cn('h-5 w-5 text-slate-400 transition', helpOpen && 'rotate-180')} />
        </button>
        {helpOpen && (
          <CardContent className="space-y-5 border-t pt-5 text-sm text-slate-700">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => download('cbt-questions-template.csv', buildCsvTemplate())}>
                <Download className="mr-2 h-4 w-4" /> Download template (with 3 examples)
              </Button>
              <Button variant="outline" size="sm" onClick={copyPrompt}>
                <Copy className="mr-2 h-4 w-4" /> Copy AI prompt
              </Button>
            </div>

            <div>
              <p className="mb-1 font-medium text-slate-900">Columns</p>
              <p className="font-mono text-xs leading-6 text-slate-600">{CSV_HEADERS.join(' · ')}</p>
              <p className="mt-2">
                <b>Topic Name</b> — type the topic for every question (e.g. <i>Algebra</i>, <i>Mechanics</i>). Topics are created automatically the first time they appear, so you never need to set them up
                beforehand. Spelling and capital letters are matched loosely, and students&apos; topic performance is built from this column.
              </p>
              <p className="mt-2">
                Required: <b>Question Text</b> (or Question Image), <b>Option A–D</b> (or an option image) and <b>Correct Answer</b> (A–D). Everything else is optional. Column names are
                flexible (e.g. &quot;Answer&quot;, &quot;Explanation&quot;, &quot;Diagram&quot; also work).
              </p>
            </div>

            <div>
              <p className="mb-1 font-medium text-slate-900">Putting a diagram in a cell</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <b>Raw SVG</b> — paste <code>&lt;svg …&gt;…&lt;/svg&gt;</code>. Easiest for AI-written diagrams (geometry, circuits, graphs). Use single quotes inside the SVG.
                </li>
                <li>
                  <b>Base64 data URI</b> — <code>data:image/png;base64,iVBOR…</code> (PNG, JPEG, WebP, GIF or SVG, up to 2 MB each).
                </li>
                <li>
                  <b>Link</b> — a normal <code>https://…</code> image URL.
                </li>
              </ul>
              <p className="mt-2 text-slate-500">
                Images are uploaded to storage on import, and identical diagrams are stored once. Text AI models write SVG reliably; real PNG Base64 usually needs an AI with a code
                tool (e.g. matplotlib). You can also attach a diagram to any row after uploading, in the preview below.
              </p>
            </div>

            <div>
              <p className="mb-1 font-medium text-slate-900">Maths &amp; chemistry</p>
              <p>
                Put LaTeX between dollar signs: <code>$x^2 - 5x + 6 = 0$</code>, <code>$\frac&#123;a&#125;&#123;b&#125;$</code>, <code>$\text&#123;H&#125;_2\text&#123;SO&#125;_4$</code>. For a literal dollar sign write <code>\$</code>.
              </p>
            </div>

            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-xs text-slate-100">{AI_CSV_PROMPT}</pre>
          </CardContent>
        )}
      </Card>

      {/* upload */}
      {(stage === 'idle' || stage === 'preview') && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void loadFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'mb-6 flex flex-col items-center rounded-2xl border-2 border-dashed bg-white p-10 text-center transition',
            dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
          )}
        >
          <Upload className="mb-3 h-10 w-10 text-slate-400" />
          <p className="font-medium text-slate-900">{fileName || 'Drop your CSV here'}</p>
          <p className="mb-4 text-sm text-slate-500">or choose a file from your computer</p>
          <Button onClick={() => fileRef.current?.click()}>{fileName ? 'Choose a different file' : 'Choose CSV file'}</Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void loadFile(e.target.files?.[0])} />
          {fatal && (
            <p className="mt-4 flex max-w-xl items-start gap-2 rounded-lg bg-rose-50 p-3 text-left text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {fatal}
            </p>
          )}
        </div>
      )}

      {/* preview */}
      {stage === 'preview' && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{valid.length} ready</span>
            {invalid > 0 && <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700">{invalid} with problems (will be skipped)</span>}
            {withImages > 0 && <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">{withImages} with diagrams</span>}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button onClick={runImport} disabled={valid.length === 0} className="bg-emerald-600 hover:bg-emerald-700">
                Import {valid.length} question{valid.length === 1 ? '' : 's'}
              </Button>
            </div>
          </div>

          {/* Topics found in the file */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">Topics in this file ({topicSummary.topics.length})</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {topicSummary.topics.map((t) => (
                <span key={t.label} className={cn('rounded-full border px-2.5 py-1', t.isNew ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700')}>
                  {t.label} · {t.count}
                  {t.isNew && <b className="ml-1">NEW</b>}
                </span>
              ))}
              {topicSummary.noTopic > 0 && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-amber-800">
                  {topicSummary.noTopic} question{topicSummary.noTopic === 1 ? '' : 's'} with no topic — they won&apos;t count in topic performance
                </span>
              )}
            </div>
          </div>

          <input ref={attachRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            void handleAttach(e.target.files?.[0]);
            e.target.value = '';
          }} />

          <div className="space-y-3">
            {pageRows.map((r) => {
              const qImg = inspectImageCell(r.images.question);
              const ok = r.errors.length === 0;
              return (
                <div key={r.rowNumber} className={cn('rounded-xl border bg-white p-4', ok ? 'border-slate-200' : 'border-rose-300')}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Row {r.rowNumber}</span>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-3 text-sm font-medium text-slate-900">
                        <MathText text={r.questionText || '(diagram only)'} />
                      </div>
                      {qImg.previewSrc && qImg.kind !== 'invalid' && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qImg.previewSrc} alt="Question diagram" className="mt-2 max-h-28 w-auto rounded border bg-white" />
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {r.topicName ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{r.topicName}</span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">No topic</span>
                        )}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-600">{r.difficulty}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Answer {r.correctAnswer || '?'}</span>
                        {(['A', 'B', 'C', 'D'] as const).filter((l) => r.images[l]).map((l) => (
                          <span key={l} className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Option {l} image</span>
                        ))}
                        {r.images.solution && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Solution image</span>}
                      </div>
                      {r.errors.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-xs text-rose-600">
                          {r.errors.map((e, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {e}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={r.images.question ? 'Replace question diagram' : 'Attach question diagram'}
                        onClick={() => {
                          attachTarget.current = { rowNumber: r.rowNumber, slot: 'question' };
                          attachRef.current?.click();
                        }}
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Remove row" onClick={() => setRows((prev) => prev.filter((x) => x.rowNumber !== r.rowNumber))}>
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {page + 1} of {pageCount}
              </span>
              <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* importing */}
      {stage === 'importing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
            <p className="text-lg font-semibold text-slate-900">
              Importing {progress.done} / {progress.total}
            </p>
            <div className="mx-auto mt-4 h-2.5 max-w-md overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-500">Uploading diagrams and saving questions. Keep this tab open.</p>
          </CardContent>
        </Card>
      )}

      {/* done */}
      {stage === 'done' && summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" /> Import finished
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              <b className="text-emerald-700">{summary.imported}</b> imported
              {summary.errors.length > 0 && (
                <>
                  , <b className="text-rose-600">{summary.errors.length}</b> failed
                </>
              )}
              {invalid > 0 && (
                <>
                  , <b className="text-amber-600">{invalid}</b> skipped (problems in the CSV)
                </>
              )}
            </p>
            {summary.errors.length > 0 && (
              <ul className="max-h-60 space-y-1 overflow-auto rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
                {summary.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            <div className="flex gap-3">
              <Button asChild>
                <Link href={`/admin/cbt/courses/${courseId}/questions`}>View questions</Link>
              </Button>
              <Button variant="outline" onClick={reset}>
                Upload another file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
