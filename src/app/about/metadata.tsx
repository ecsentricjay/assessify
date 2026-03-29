import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'About Assessify - Mission to Revolutionize Education in Nigeria',
  description: 'Learn about Assessify: our mission to provide affordable, accessible assessment tools for students, lecturers, and educational institutions across Nigeria.',
  keywords: [
    'about assessify',
    'education platform',
    'Nigerian startup',
    'assessment company',
    'educational mission',
    'edtech solution',
  ],
  path: '/about',
})
