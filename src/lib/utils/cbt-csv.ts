import { parseCsv } from '@/lib/utils/csv';
import type { CbtDifficulty, OptionLetter } from '@/lib/types/cbt.types';

// ---------------------------------------------------------------------------
// Image cells
// ---------------------------------------------------------------------------

export type ImageKind = 'none' | 'url' | 'data' | 'svg' | 'base64' | 'invalid';

export interface ImageInspection {
  kind: ImageKind;
  error?: string;
  /** Safe value to put in an <img src> for the preview */
  previewSrc?: string;
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function guessMimeFromBase64(b64: string): string | null {
  if (b64.startsWith('iVBOR')) return 'image/png';
  if (b64.startsWith('/9j/')) return 'image/jpeg';
  if (b64.startsWith('R0lGOD')) return 'image/gif';
  if (b64.startsWith('UklGR')) return 'image/webp';
  if (b64.startsWith('PHN2Zy') || b64.startsWith('PD94bWw')) return 'image/svg+xml';
  return null;
}

/** Cheap, client-safe check of one image cell. The server re-validates everything on import. */
export function inspectImageCell(raw: string | undefined | null): ImageInspection {
  const value = (raw ?? '').trim();
  if (!value) return { kind: 'none' };

  if (/^https?:\/\//i.test(value)) return { kind: 'url', previewSrc: value };

  if (/^data:/i.test(value)) {
    if (!/^data:image\/(png|jpe?g|webp|gif|svg\+xml)/i.test(value)) {
      return { kind: 'invalid', error: 'Data URI must be PNG, JPEG, WebP, GIF or SVG' };
    }
    const comma = value.indexOf(',');
    if (comma === -1) return { kind: 'invalid', error: 'Malformed data URI (missing comma)' };
    const payload = value.slice(comma + 1);
    if (value.slice(0, comma).includes(';base64')) {
      if (!/^[A-Za-z0-9+/=\s_-]+$/.test(payload)) return { kind: 'invalid', error: 'Base64 contains invalid characters' };
      if (payload.length * 0.75 > MAX_IMAGE_BYTES) return { kind: 'invalid', error: 'Image is larger than 2MB' };
    }
    return { kind: 'data', previewSrc: value };
  }

  if (/^(<\?xml|<svg)/i.test(value)) {
    if (!/<\/svg>\s*$/i.test(value)) return { kind: 'invalid', error: 'SVG is incomplete (missing </svg>)' };
    if (value.length > MAX_IMAGE_BYTES) return { kind: 'invalid', error: 'SVG is larger than 2MB' };
    return { kind: 'svg', previewSrc: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}` };
  }

  const compact = value.replace(/\s+/g, '');
  if (compact.length >= 40 && /^[A-Za-z0-9+/=_-]+$/.test(compact)) {
    if (compact.length * 0.75 > MAX_IMAGE_BYTES) return { kind: 'invalid', error: 'Image is larger than 2MB' };
    const mime = guessMimeFromBase64(compact);
    if (!mime) return { kind: 'invalid', error: 'Base64 is not a PNG, JPEG, WebP, GIF or SVG image' };
    return { kind: 'base64', previewSrc: `data:${mime};base64,${compact}` };
  }

  return { kind: 'invalid', error: 'Not a Base64 image, raw <svg>, or https:// link' };
}

// ---------------------------------------------------------------------------
// Question rows
// ---------------------------------------------------------------------------

export interface ParsedQuestionRow {
  rowNumber: number;
  topicName?: string;
  questionText: string;
  options: Record<OptionLetter, string>;
  correctAnswer: OptionLetter | '';
  difficulty: CbtDifficulty;
  solution?: string;
  /** Raw image cell values (Base64 data URI, raw SVG, bare Base64 or https link) */
  images: {
    question: string;
    A: string;
    B: string;
    C: string;
    D: string;
    solution: string;
  };
  errors: string[];
}

export const MAX_QUESTION_CHARS = 3000;
export const MAX_OPTION_CHARS = 1000;

const norm = (h: string) => h.toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

const HEADER_ALIASES: Record<string, string[]> = {
  topic: ['topic name', 'topic', 'chapter', 'subtopic'],
  question: ['question text', 'question', 'stem'],
  questionImage: ['question image', 'question diagram', 'diagram', 'image', 'question figure', 'figure'],
  optionA: ['option a', 'a', 'optiona', 'choice a'],
  optionB: ['option b', 'b', 'optionb', 'choice b'],
  optionC: ['option c', 'c', 'optionc', 'choice c'],
  optionD: ['option d', 'd', 'optiond', 'choice d'],
  optionAImage: ['option a image', 'option a diagram', 'image a', 'a image', 'optiona image'],
  optionBImage: ['option b image', 'option b diagram', 'image b', 'b image', 'optionb image'],
  optionCImage: ['option c image', 'option c diagram', 'image c', 'c image', 'optionc image'],
  optionDImage: ['option d image', 'option d diagram', 'image d', 'd image', 'optiond image'],
  correct: ['correct answer', 'answer', 'correct', 'correct option', 'key'],
  difficulty: ['difficulty', 'level', 'difficulty level'],
  solution: ['solution', 'explanation', 'solution text', 'working'],
  solutionImage: ['solution image', 'explanation image', 'solution diagram', 'working image'],
};

function buildColumnMap(headers: string[]): Record<string, number> {
  const normalised = headers.map(norm);
  const map: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    // Prefer the earliest alias in priority order (so "option a" beats bare "a")
    for (const alias of aliases) {
      const idx = normalised.indexOf(alias);
      if (idx !== -1) {
        map[key] = idx;
        break;
      }
    }
  }
  return map;
}

function normaliseCorrect(raw: string): OptionLetter | '' {
  const v = raw.trim().toUpperCase().replace(/^OPTION\s*/, '').replace(/[().\s]/g, '');
  if (['A', 'B', 'C', 'D'].includes(v)) return v as OptionLetter;
  if (['1', '2', '3', '4'].includes(v)) return (['A', 'B', 'C', 'D'] as const)[Number(v) - 1];
  return '';
}

export function parseQuestionCsv(text: string): { rows: ParsedQuestionRow[]; fatal?: string; columns: string[] } {
  const table = parseCsv(text);
  if (table.length < 2) {
    return { rows: [], columns: [], fatal: 'The CSV is empty or only has a header row.' };
  }

  const headers = table[0];
  const col = buildColumnMap(headers);

  const missing: string[] = [];
  if (col.question === undefined && col.questionImage === undefined) missing.push('Question Text');
  if (col.optionA === undefined && col.optionAImage === undefined) missing.push('Option A');
  if (col.optionB === undefined && col.optionBImage === undefined) missing.push('Option B');
  if (col.optionC === undefined && col.optionCImage === undefined) missing.push('Option C');
  if (col.optionD === undefined && col.optionDImage === undefined) missing.push('Option D');
  if (col.correct === undefined) missing.push('Correct Answer');
  if (missing.length) {
    return {
      rows: [],
      columns: headers,
      fatal: `Missing required column(s): ${missing.join(', ')}. Found: ${headers.join(' | ')}`,
    };
  }

  const cell = (r: string[], key: string) => (col[key] !== undefined ? (r[col[key]] ?? '').trim() : '');

  const rows: ParsedQuestionRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    const errors: string[] = [];

    const difficultyRaw = cell(r, 'difficulty').toLowerCase();
    const difficulty: CbtDifficulty = (['easy', 'medium', 'hard'] as const).includes(difficultyRaw as CbtDifficulty)
      ? (difficultyRaw as CbtDifficulty)
      : 'medium';
    if (difficultyRaw && !['easy', 'medium', 'hard'].includes(difficultyRaw)) {
      errors.push(`Invalid difficulty "${difficultyRaw}" (use easy, medium or hard)`);
    }

    const correctRaw = cell(r, 'correct');
    const correctAnswer = normaliseCorrect(correctRaw);
    if (!correctAnswer) errors.push(`Invalid correct answer "${correctRaw}" (use A, B, C or D)`);

    const row: ParsedQuestionRow = {
      rowNumber: i + 1,
      topicName: cell(r, 'topic') || undefined,
      questionText: cell(r, 'question'),
      options: {
        A: cell(r, 'optionA'),
        B: cell(r, 'optionB'),
        C: cell(r, 'optionC'),
        D: cell(r, 'optionD'),
      },
      correctAnswer,
      difficulty,
      solution: cell(r, 'solution') || undefined,
      images: {
        question: cell(r, 'questionImage'),
        A: cell(r, 'optionAImage'),
        B: cell(r, 'optionBImage'),
        C: cell(r, 'optionCImage'),
        D: cell(r, 'optionDImage'),
        solution: cell(r, 'solutionImage'),
      },
      errors,
    };

    validateRow(row);
    rows.push(row);
  }

  return { rows, columns: headers };
}

/** (Re)run validation — also called after the admin attaches an image manually in the preview. */
export function validateRow(row: ParsedQuestionRow) {
  // keep only the parse-time errors that aren't content errors
  row.errors = row.errors.filter((e) => /difficulty|correct answer/i.test(e));

  const qImg = inspectImageCell(row.images.question);
  if (!row.questionText && qImg.kind === 'none') row.errors.push('Question needs text or a diagram');
  if (row.questionText.length > MAX_QUESTION_CHARS) row.errors.push(`Question text is over ${MAX_QUESTION_CHARS} characters`);
  if (qImg.kind === 'invalid') row.errors.push(`Question image: ${qImg.error}`);

  for (const letter of ['A', 'B', 'C', 'D'] as const) {
    const img = inspectImageCell(row.images[letter]);
    if (!row.options[letter] && img.kind === 'none') row.errors.push(`Option ${letter} needs text or an image`);
    if (row.options[letter].length > MAX_OPTION_CHARS) row.errors.push(`Option ${letter} is over ${MAX_OPTION_CHARS} characters`);
    if (img.kind === 'invalid') row.errors.push(`Option ${letter} image: ${img.error}`);
  }

  const sImg = inspectImageCell(row.images.solution);
  if (sImg.kind === 'invalid') row.errors.push(`Solution image: ${sImg.error}`);
}

// ---------------------------------------------------------------------------
// Template + AI prompt
// ---------------------------------------------------------------------------

export const CSV_HEADERS = [
  'Topic Name',
  'Question Text',
  'Question Image',
  'Option A',
  'Option B',
  'Option C',
  'Option D',
  'Option A Image',
  'Option B Image',
  'Option C Image',
  'Option D Image',
  'Correct Answer',
  'Difficulty',
  'Solution',
  'Solution Image',
];

const SAMPLE_TRIANGLE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 150' width='220' height='150'>" +
  "<polygon points='20,130 200,130 20,30' fill='#eef2ff' stroke='#1F2A5A' stroke-width='2'/>" +
  "<polyline points='20,110 40,110 40,130' fill='none' stroke='#1F2A5A' stroke-width='1.5'/>" +
  "<text x='100' y='146' font-size='13' fill='#1F2A5A'>12 cm</text>" +
  "<text x='2' y='85' font-size='13' fill='#1F2A5A'>5 cm</text>" +
  "<text x='120' y='70' font-size='13' fill='#1F2A5A'>x</text></svg>";

function toCsvRow(cells: string[]): string {
  return cells.map((c) => (/[",\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',');
}

export function buildCsvTemplate(): string {
  const b64 = typeof btoa === 'function' ? btoa(SAMPLE_TRIANGLE_SVG) : '';
  const rows: string[][] = [
    // 1) Plain text with LaTeX maths, no diagram
    [
      'Algebra',
      'Solve $x^2 - 5x + 6 = 0$',
      '',
      '$x = 2$ or $x = 3$',
      '$x = -2$ or $x = -3$',
      '$x = 1$ or $x = 6$',
      '$x = -1$ or $x = -6$',
      '', '', '', '',
      'A',
      'easy',
      'Factorise: $(x-2)(x-3)=0$ so $x=2$ or $x=3$.',
      '',
    ],
    // 2) Diagram supplied as a Base64 data URI
    [
      'Geometry',
      'In the right-angled triangle shown, find the length x.',
      `data:image/svg+xml;base64,${b64}`,
      '13 cm', '10 cm', '17 cm', '7 cm',
      '', '', '', '',
      'A',
      'medium',
      'By Pythagoras: $x = \\sqrt{5^2 + 12^2} = 13$ cm.',
      '',
    ],
    // 3) Diagram supplied as raw <svg> markup (single quotes inside, so no escaping is needed)
    [
      'Geometry',
      'Which side of the triangle is the hypotenuse?',
      SAMPLE_TRIANGLE_SVG,
      'The side labelled x', 'The side labelled 5 cm', 'The side labelled 12 cm', 'None of them',
      '', '', '', '',
      'A',
      'easy',
      'The hypotenuse is opposite the right angle.',
      '',
    ],
  ];
  return [toCsvRow(CSV_HEADERS), ...rows.map(toCsvRow)].join('\n');
}

export const AI_CSV_PROMPT = `You are generating JAMB-style multiple-choice questions as a CSV file.

OUTPUT: one CSV code block, nothing else. First row is EXACTLY this header:
${CSV_HEADERS.join(',')}

RULES
- Wrap every cell that contains a comma, quote or newline in double quotes, and write a literal double quote as "".
- Topic Name: fill it on EVERY row with the exact topic (e.g. "Quadratic Equations"). Use the same spelling for the same topic. Topics are created automatically, and students' topic performance is built from this column.
- Correct Answer is one letter: A, B, C or D. Difficulty is easy, medium or hard.
- Maths/physics/chemistry: write formulas in LaTeX between dollar signs, e.g. $x^2 - 5x + 6 = 0$, $\\frac{a}{b}$, $\\text{H}_2\\text{SO}_4$.
- Solution: a short worked explanation (use LaTeX where helpful).
- When a question needs a diagram (geometry, circuits, ray diagrams, graphs, biology/chemistry apparatus), put it in the "Question Image" column as a complete, self-contained <svg>...</svg> with a viewBox and xmlns.
  * Use SINGLE quotes for every SVG attribute so no CSV escaping is needed, e.g. <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'>.
  * Keep it clean: black/navy strokes, white or transparent background, readable labels (font-size 12-14), no scripts, no external images.
  * Use "Option A Image" ... "Option D Image" only if the options themselves are pictures (then leave that option's text cell empty or a short label).
- If you can run code, you may instead output PNG diagrams as Base64 data URIs (data:image/png;base64,...) — keep each under 500 KB.
- Leave image cells empty when no diagram is needed.

Generate {N} questions for {SUBJECT} on the topic "{TOPIC}" at {DIFFICULTY} difficulty, in the style of the JAMB UTME syllabus.`;
