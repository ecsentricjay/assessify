import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Assessify Pricing - Affordable Assessment Platform for Nigerian Students',
  description: 'Transparent pricing for assignment submission, CBT bundles, and continuous assessment. Pay-as-you-go or bundle options. No hidden fees.',
  keywords: [
    'assessment pricing',
    'CBT bundle prices',
    'student payment',
    'affordable exam prep',
    'pricing plans',
    'subscription options',
    'commission structure',
  ],
  path: '/pricing',
})
