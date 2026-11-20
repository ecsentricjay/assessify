'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Trash2, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fileToDataUri } from '@/lib/utils/image-file';
import { inspectImageCell } from '@/lib/utils/cbt-csv';

/**
 * One optional diagram. `value` is whatever will be sent to the server:
 * an existing stored URL, a Base64 data URI (picked file), raw <svg>, or ''.
 */
export function ImageSlot({
  label,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const inspection = inspectImageCell(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      onChange(await fileToDataUri(file));
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  function applyPaste() {
    const check = inspectImageCell(pasteText);
    if (check.kind === 'none' || check.kind === 'invalid') {
      toast.error(check.error ?? 'Paste a Base64 image, raw <svg> markup, or an https:// link');
      return;
    }
    onChange(pasteText.trim());
    setPasteText('');
    setPasting(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">{label}</p>

      {inspection.previewSrc && inspection.kind !== 'invalid' ? (
        <div className="relative inline-block rounded-lg border border-slate-200 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={inspection.previewSrc} alt={label} className={compact ? 'max-h-24 w-auto' : 'max-h-48 w-auto'} />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
            onClick={() => onChange('')}
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="mr-1.5 h-4 w-4" /> Upload
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPasting((p) => !p)}>
            <ClipboardPaste className="mr-1.5 h-4 w-4" /> Paste SVG / Base64
          </Button>
        </div>
      )}

      {inspection.kind === 'invalid' && <p className="text-xs text-rose-600">{inspection.error}</p>}

      {pasting && (
        <div className="space-y-2">
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="<svg …> … </svg>   or   data:image/png;base64,…   or   https://…"
            className="h-24 font-mono text-xs"
          />
          <Button type="button" size="sm" onClick={applyPaste}>
            Use this image
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
