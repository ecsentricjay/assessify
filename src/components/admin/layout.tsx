// app/admin/layout.tsx
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { requireAdmin } from '@/lib/actions/admin-auth.actions'
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        <div className="flex-1 overflow-auto w-full">
          {children}
        </div>
      </div>
    </div>
  )
}