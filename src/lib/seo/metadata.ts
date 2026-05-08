import type { Metadata } from 'next'

/**
 * Base URL for the application
 */
export const SITE_URL = 'https://assessify.ng'

/**
 * Brand information
 */
export const BRAND = {
  name: 'Assessify',
  description: 'Premium online assessment platform for students, lecturers, and educational institutions. Prepare for exams with AI-powered Study Aid.',
  tagline: 'Continuous Assessment Management Made Easy.',
}

/**
 * Create metadata for a page with OpenGraph and Twitter tags
 */
export function createMetadata({
  title,
  description,
  keywords,
  path = '',
  image = '/images/og-image.png',
}: {
  title: string
  description: string
  keywords?: string[]
  path?: string
  image?: string
}): Metadata {
  const fullUrl = `${SITE_URL}${path}`
  const keywordString = keywords?.join(', ') || ''

  return {
    title: {
      default: title,
      template: `%s | ${BRAND.name}`,
    },
    description,
    keywords: keywordString,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: BRAND.name,
      locale: 'en_NG',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}${image}`],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  }
}

/**
 * JSON-LD Schema Markup
 */
export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo/assessify-logo.png`,
    description: BRAND.description,
    sameAs: [
      'https://facebook.com/assessify',
      'https://twitter.com/assessify',
      'https://linkedin.com/company/assessify',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@assessify.ng',
    },
  }
}

export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function createPageSchema({
  title,
  description,
  path,
  datePublished,
  dateModified,
}: {
  title: string
  description: string
  path: string
  datePublished?: string
  dateModified?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${SITE_URL}${path}`,
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: BRAND.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logo/assessify-logo.png`,
      },
    },
  }
}

export function createProductSchema({
  name,
  description,
  price,
  currency = 'NGN',
  image,
}: {
  name: string
  description: string
  price: string
  currency?: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image ? `${SITE_URL}${image}` : undefined,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
    },
  }
}
