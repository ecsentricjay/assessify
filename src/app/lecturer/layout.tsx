// app/lecturer/layout.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { FooterContent } from '@/components/footer/footer-content'

export const metadata = {
  title: 'Lecturer Dashboard | Assessify',
  description: 'Assessify Lecturer platform for course management, grading, and assessment creation',
}

export default async function LecturerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Redirect if not authenticated or not a lecturer
  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <FooterContent userType="lecturer" />
    </div>
  )
}
