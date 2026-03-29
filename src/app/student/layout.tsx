// app/student/layout.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { FooterContent } from '@/components/footer/footer-content'

export const metadata = {
  title: 'Student Dashboard | Assessify',
  description: 'Assessify Student platform for assignments, tests, and continuous assessment',
}

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Redirect if not authenticated or not a student
  if (!user || user.profile?.role !== 'student') {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <FooterContent userType="student" />
    </div>
  )
}
