// app/admin/layout.tsx
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { requireAdmin } from '@/lib/actions/admin-auth.actions'
import { SidebarProvider } from '@/lib/context/sidebar-context'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Admin Dashboard | Assessify',
  description: 'Assessify Administrator control panel',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify admin authentication
  let admin
  try {
    admin = await requireAdmin()
  } catch (error) {
    redirect('/auth/login?redirect=/admin')
  }

  const adminName = `${admin.profile.first_name || ''} ${admin.profile.last_name || ''}`.trim() || 'Admin'
  const adminEmail = admin.email || ''

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          {/* Header */}
          <AdminHeader 
            title="Dashboard"
            adminName={adminName}
            adminEmail={adminEmail}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}