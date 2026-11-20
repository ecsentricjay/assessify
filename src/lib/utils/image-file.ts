/** Browser-only helpers for turning a picked file into a Base64 data URI the server can store. */

const MAX_DIRECT_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 1400;

function readAsDataUri(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file is not a readable image'));
    img.src = src;
  });
}

/**
 * Picked file -> data URI. Small files and SVGs pass through untouched.
 * Large photos (phone camera shots of a textbook diagram, for example) are scaled down so
 * they stay under the 2MB server limit and load fast on students' mobile data.
 */
export async function fileToDataUri(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (PNG, JPEG, WebP, GIF or SVG)');

  const original = await readAsDataUri(file);
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.size <= MAX_DIRECT_BYTES) return original;

  const img = await loadImage(original);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}
