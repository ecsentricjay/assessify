// ============================================================================
// app/admin/users/page.tsx - MAIN USER MANAGEMENT PAGE
// ============================================================================
'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { UsersTable } from '@/components/admin/users-table'
import { UsersFilters } from '@/components/admin/users-filters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllUsers } from '@/lib/actions/admin-users.actions'
import { useDebounce } from '@/hooks/use-debounce'
import { ChevronLeft, ChevronRight, Download, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const debouncedSearch = useDebounce(search, 500)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const result = await getAllUsers({
        page,
        limit: 20,
        search: debouncedSearch,
        role,
        status
      })

      if (result.success && result.data) {
        setUsers(result.data.users)
        setTotalPages(result.data.totalPages)
        setTotal(result.data.total)
      } else {
        toast.error(result.error || 'Failed to fetch users')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, debouncedSearch, role, status])

  const handleExportCSV = () => {
    if (users.length === 0) {
      toast.error('No users to export')
      return
    }

    const headers = ['Name', 'Email', 'Role', 'ID Number', 'Department', 'Status', 'Joined']
    const rows = users.map(user => [
      `${user.first_name} ${user.last_name}`,
      user.email,
      user.role,
      user.matric_number || user.staff_id || '-',
      user.department || '-',
      user.is_active ? 'Active' : 'Inactive',
      new Date(user.created_at).toLocaleDateString()
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()

    toast.success('Users exported successfully')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all platform users</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-2xl">{total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Showing</CardDescription>
                <CardTitle className="text-2xl">{users.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Current Page</CardDescription>
                <CardTitle className="text-2xl">{page} / {totalPages}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Filters Active</CardDescription>
                <CardTitle className="text-2xl">
                  {(role !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0) + (search ? 1 : 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <UsersFilters
                search={search}
                role={role}
                status={status}
                onSearchChange={setSearch}
                onRoleChange={setRole}
                onStatusChange={setStatus}
              />
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Loading users...</p>
                </div>
              ) : (
                <UsersTable users={users} onRefresh={fetchUsers} />
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// PLACEHOLDER PAGES (Keep existing ones)
// ============================================================================

// app/admin/finances/page.tsx - Keep as is
// app/admin/content/page.tsx - Keep as is
// app/admin/partners/page.tsx - Keep as is
// app/admin/reports/page.tsx - Keep as is
// app/admin/settings/page.tsx - Keep as is