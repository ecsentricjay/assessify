// app/admin/content/assignments/page.tsx
import { Suspense } from 'react'
import { getAllAssignments } from '@/lib/actions/admin-content.actions'
import AssignmentsClient from './assignments-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CheckCircle, Clock, Send } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function AssignmentsManagementPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ''
  const status = (params.status as 'all' | 'published' | 'unpublished') || 'all'
  const page = parseInt(params.page || '1')

  const assignmentsResult = await getAllAssignments({ search, status, page, limit: 20 })

  const assignments = assignmentsResult.success ? (assignmentsResult.assignments ?? []) : []
  const total = assignmentsResult.success ? (assignmentsResult.total ?? 0) : 0

  // Calculate statistics
  const publishedAssignments = (assignments ?? []).filter(a => a.is_published).length
  const standaloneAssignments = (assignments ?? []).filter(a => a.is_standalone).length
  const totalSubmissions = (assignments ?? []).reduce((sum, a) => sum + (a._count?.submissions || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Assignment Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all platform assignments
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              {publishedAssignments} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standalone</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{standaloneAssignments}</div>
            <p className="text-xs text-muted-foreground">
              With access codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Submissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {total > 0 ? Math.round(totalSubmissions / total) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Suspense fallback={<AssignmentsTableSkeleton />}>
        <AssignmentsClient
          initialAssignments={assignments}
          initialTotal={total}
          initialPage={page}
          initialSearch={search}
          initialStatus={status}
        />
      </Suspense>
    </div>
  )
}

function AssignmentsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}