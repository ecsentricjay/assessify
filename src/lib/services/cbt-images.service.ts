import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';

export const CBT_IMAGE_BUCKET = 'cbt-question-images';
export const CBT_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2MB per image

type ImageMime = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/svg+xml';

const EXTENSION: Record<ImageMime, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/** Detect the real image type from the file's magic bytes — never trust the claimed MIME. */
function sniffMime(buf: Buffer): ImageMime | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 6 && buf.subarray(0, 3).toString('ascii') === 'GIF') return 'image/gif';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  const head = buf.subarray(0, 600).toString('utf8').trimStart().toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) return 'image/svg+xml';
  return null;
}

/**
 * Strip anything executable from an SVG. Diagrams are rendered through <img>, which
 * never runs scripts, but the file is also publicly reachable by URL, so we clean it anyway.
 */
export function sanitizeSvg(svg: string): string {
  let s = svg.trim();
  s = s
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|xlink:href)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2$2')
    .trim();

  const openTagEnd = s.indexOf('>');
  if (!/^<svg[\s>]/i.test(s) || openTagEnd === -1) {
    throw new Error('Not a valid SVG (must start with <svg>)');
  }
  if (!/xmlns\s*=/.test(s.slice(0, openTagEnd + 1))) {
    s = s.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return s;
}

const BASE64_RE = /^[A-Za-z0-9+/_-]+={0,2}$/;

/** Turn any supported cell value into raw bytes. Returns null when the value is an http(s) URL. */
function decodeImageInput(input: string): { buffer: Buffer } | null {
  const value = input.trim();

  if (/^https?:\/\//i.test(value)) return null;

  // data:image/png;base64,AAAA...   or   data:image/svg+xml;utf8,<svg ...>
  if (/^data:/i.test(value)) {
    const comma = value.indexOf(',');
    if (comma === -1) throw new Error('Malformed data URI (no comma)');
    const meta = value.slice(5, comma).toLowerCase();
    const payload = value.slice(comma + 1);
    if (meta.includes(';base64')) {
      return { buffer: Buffer.from(payload.replace(/\s+/g, ''), 'base64') };
    }
    return { buffer: Buffer.from(decodeURIComponent(payload), 'utf8') };
  }

  // Raw SVG markup pasted straight into the CSV cell
  if (/^(<\?xml|<svg)/i.test(value)) {
    return { buffer: Buffer.from(value, 'utf8') };
  }

  // Bare base64 with no data: prefix
  const compact = value.replace(/\s+/g, '');
  if (compact.length >= 40 && BASE64_RE.test(compact)) {
    return { buffer: Buffer.from(compact.replace(/-/g, '+').replace(/_/g, '/'), 'base64') };
  }

  throw new Error('Unrecognised image value — use a Base64 data URI, raw <svg>, or an https:// link');
}

/**
 * Resolve one image cell to a public URL.
 *  - https:// links are kept as-is
 *  - Base64 / data URIs / raw SVG are validated, sanitised and uploaded to the cbt-question-images bucket
 * Identical images are de-duplicated by content hash (same diagram reused by many questions = one file).
 * Returns null for empty input. Throws a readable Error on bad input.
 */
export async function storeCbtImage(
  input: string | null | undefined,
  courseId: string,
  cache?: Map<string, string>
): Promise<string | null> {
  const value = (input ?? '').trim();
  if (!value) return null;

  const decoded = decodeImageInput(value);
  if (!decoded) {
    if (value.length > 2048) throw new Error('Image URL is too long');
    return value;
  }

  let { buffer } = decoded;
  if (buffer.length === 0) throw new Error('Image is empty');
  if (buffer.length > CBT_IMAGE_MAX_BYTES) {
    throw new Error(`Image is too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB, max 2MB)`);
  }

  const mime = sniffMime(buffer);
  if (!mime) throw new Error('Unsupported image — use PNG, JPEG, WebP, GIF or SVG');

  if (mime === 'image/svg+xml') {
    buffer = Buffer.from(sanitizeSvg(buffer.toString('utf8')), 'utf8');
  }

  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 40);
  const path = `${courseId}/${hash}.${EXTENSION[mime]}`;

  const cached = cache?.get(path);
  if (cached) return cached;

  const service = createServiceClient();
  const { error } = await service.storage.from(CBT_IMAGE_BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
    cacheControl: '31536000',
  });
  if (error) {
    throw new Error(
      /bucket/i.test(error.message)
        ? 'Image storage is not set up — run the CBT migration SQL first'
        : `Image upload failed: ${error.message}`
    );
  }

  const { data } = service.storage.from(CBT_IMAGE_BUCKET).getPublicUrl(path);
  cache?.set(path, data.publicUrl);
  return data.publicUrl;
}
