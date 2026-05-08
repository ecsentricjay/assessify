import type { Metadata } from 'next'
import { createMetadata, createPageSchema } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Assessify - Online Assessment Platform for Nigerian Students',
  description: 'AI-powered grading, continuous assessment tracking, and exam preparation for Nigerian students.',
  keywords: [
    'CBT platform Nigeria',
    'online exam practice',
    'JAMB preparation',
    'WAEC past questions',
    'NECO exam practice',
    'continuous assessment',
    'student grading platform',
    'assignment submission',
    'online tutorial',
  ],
  path: '/',
})
