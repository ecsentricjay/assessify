'use client';

import { useMemo, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// MathText — plain text with LaTeX between $...$ (inline) or $$...$$ (block)
// ---------------------------------------------------------------------------

type Part = { kind: 'text'; value: string } | { kind: 'math'; value: string; display: boolean };

const MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$[^$\n]+?(?<!\\)\$)/g;

function splitMath(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(MATH_PATTERN)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ kind: 'text', value: text.slice(last, start) });
    const raw = match[0];
    if (raw.startsWith('$$')) parts.push({ kind: 'math', value: raw.slice(2, -2), display: true });
    else if (raw.startsWith('\\[')) parts.push({ kind: 'math', value: raw.slice(2, -2), display: true });
    else if (raw.startsWith('\\(')) parts.push({ kind: 'math', value: raw.slice(2, -2), display: false });
    else parts.push({ kind: 'math', value: raw.slice(1, -1), display: false });
    last = start + raw.length;
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) });
  return parts;
}

function renderMath(source: string, display: boolean): string {
  try {
    return katex.renderToString(source, { displayMode: display, throwOnError: false, output: 'html', strict: 'ignore' });
  } catch {
    return '';
  }
}

export function MathText({ text, className }: { text: string | null | undefined; className?: string }) {
  const parts = useMemo(() => splitMath(text ?? ''), [text]);
  if (!text) return null;

  return (
    <span className={cn('whitespace-pre-wrap break-words', className)}>
      {parts.map((part, i) =>
        part.kind === 'text' ? (
          <span key={i}>{part.value.replace(/\\\$/g, '$')}</span>
        ) : (
          <span
            key={i}
            className={part.display ? 'block my-2 overflow-x-auto' : undefined}
            // KaTeX output is generated from the LaTeX source by KaTeX itself; the source is never inserted as HTML
            dangerouslySetInnerHTML={{ __html: renderMath(part.value, part.display) }}
          />
        )
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// CbtImage — diagram with tap-to-zoom
// ---------------------------------------------------------------------------

export function CbtImage({
  src,
  alt,
  className,
  imgClassName,
  zoomable = true,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  zoomable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!src) return null;

  if (failed) {
    return (
      <div className={cn('rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-500', className)}>
        Diagram could not be loaded
      </div>
    );
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('max-h-72 w-auto max-w-full rounded-lg bg-white object-contain', imgClassName)}
    />
  );

  if (!zoomable) return <div className={className}>{image}</div>;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          'group relative block cursor-zoom-in rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:border-blue-300',
          className
        )}
        aria-label="Enlarge diagram"
      >
        {image}
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
          Tap to enlarge
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl bg-white p-4 sm:p-6">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="mx-auto max-h-[75vh] w-auto max-w-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Text + optional diagram, used for questions, options and solutions. */
export function RichContent({
  text,
  imageUrl,
  alt,
  textClassName,
  imageClassName,
  zoomable = true,
}: {
  text?: string | null;
  imageUrl?: string | null;
  alt: string;
  textClassName?: string;
  imageClassName?: string;
  zoomable?: boolean;
}) {
  return (
    <div className="space-y-2">
      {text ? <MathText text={text} className={textClassName} /> : null}
      <CbtImage src={imageUrl} alt={alt} className={imageClassName} zoomable={zoomable} />
    </div>
  );
}
