'use client'

import Head from 'next/head'
import { SITE_URL } from '@/lib/seo/metadata'

interface SEOHeadProps {
  title: string
  description: string
  path: string
  image?: string
  structuredData?: Record<string, any>
}

/**
 * SEO Head component for client-side metadata
 * Note: Next.js metadata export is preferred, but this helps with client components
 */
export function SEOHead({
  title,
  description,
  path,
  image = '/images/og-image.png',
  structuredData,
}: SEOHeadProps) {
  const url = `${SITE_URL}${path}`

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#2563EB" />

      {/* OpenGraph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${SITE_URL}${image}`} />
      <meta property="og:site_name" content="Assessify" />
      <meta property="og:locale" content="en_NG" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}${image}`} />

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </Head>
  )
}
