// app/partner/layout.tsx
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import PartnerSidebar from '@/components/partner/partner-sidebar'
import PartnerHeader from '@/components/partner/partner-header'
import { SidebarProvider } from '@/lib/context/sidebar-context'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Allow unauthenticated users (they're accessing public routes like register/login)
  if (!user) {
    return children
  }

  // Allow users who are NOT partners (register/login pages are public)
  // The individual pages (register, login) handle their own logic
  // The dashboard pages will redirect if user is not a partner
  if (user.profile?.role !== 'partner') {
    return children
  }

  // Only partners see the dashboard layout with sidebar/header
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <PartnerSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <PartnerHeader user={user} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}