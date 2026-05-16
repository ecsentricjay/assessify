import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Institution Admin — Assessify',
  description: 'Manage your institution on Assessify',
}

export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}