/**
 * The public URL of the app, used for every link that leaves the app (emails, share links, callbacks).
 * Env values pointing at localhost are ignored so a dev .env can never leak localhost links into emails.
 */
export const PRODUCTION_URL = 'https://assessify.ng'

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(url.trim())

export function getSiteUrl(): string {
  // Literal property access so Next.js can inline NEXT_PUBLIC_* values in client bundles too
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
  ]
  const found = candidates.find((v): v is string => !!v && v.trim() !== '' && !isLocal(v))
  return (found ?? PRODUCTION_URL).trim().replace(/\/+$/, '')
}
