// app/partner/layout.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import PartnerSidebar from '@/components/partner/partner-sidebar'
import PartnerHeader from '@/components/partner/partner-header'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Redirect if not authenticated or not a partner
  if (!user || user.profile?.role !== 'partner') {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <PartnerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <PartnerHeader user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}