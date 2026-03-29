import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Assessify Features - AI Grading, Assignment Submission, CBT Practice',
  description: 'Discover Assessify\'s powerful features: AI-powered grading, duplicate detection, JAMB/WAEC practice, continuous assessment tracking, and real exam conditions.',
  keywords: [
    'AI grading system',
    'assignment submission',
    'plagiarism detection',
    'exam practice',
    'continuous assessment',
    'online testing',
    'student dashboard',
    'lecturer tools',
    'institutional management',
  ],
  path: '/features',
})
