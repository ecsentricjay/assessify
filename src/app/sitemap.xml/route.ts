import { SITE_URL } from '@/lib/seo/metadata'

export async function GET() {
  const pages = [
    { path: '', priority: 1.0, changefreq: 'weekly' },
    { path: '/about', priority: 0.8, changefreq: 'monthly' },
    { path: '/features', priority: 0.9, changefreq: 'weekly' },
    { path: '/pricing', priority: 0.9, changefreq: 'weekly' },
    { path: '/faq', priority: 0.7, changefreq: 'monthly' },
    { path: '/contact', priority: 0.6, changefreq: 'monthly' },
    { path: '/legal/privacy', priority: 0.5, changefreq: 'yearly' },
    { path: '/legal/terms', priority: 0.5, changefreq: 'yearly' },
    { path: '/help', priority: 0.6, changefreq: 'monthly' },
    { path: '/guides', priority: 0.7, changefreq: 'weekly' },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages
  .map(
    (page) => `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
