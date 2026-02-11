// app/admin/content/tests/page.tsx
import { Suspense } from 'react'
import { getAllTests } from '@/lib/actions/admin-content.actions'
import TestsClient from './tests-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, CheckCircle, Clock, Users } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function TestsManagementPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ''
  const status = (params.status as 'all' | 'published' | 'unpublished') || 'all'
  const page = parseInt(params.page || '1')

  const testsResult = await getAllTests({ search, status, page, limit: 20 })

  const tests = testsResult.success ? (testsResult.tests ?? []) : []
  const total: number = testsResult.success ? (testsResult.total ?? 0) : 0

  // Calculate statistics
  const publishedTests = tests.filter(t => t.is_published).length
  const standaloneTests = tests.filter(t => t.is_standalone).length
  const totalAttempts = tests.reduce((sum, t) => sum + (t._count?.attempts || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Test Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage all platform tests and quizzes
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              {publishedTests} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standalone</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{standaloneTests}</div>
            <p className="text-xs text-muted-foreground">
              With access codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attempts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {total > 0 ? Math.round(totalAttempts / total) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per test
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tests Table */}
      <Suspense fallback={<TestsTableSkeleton />}>
        <TestsClient
          initialTests={tests}
          initialTotal={total}
          initialPage={page}
          initialSearch={search}
          initialStatus={status}
        />
      </Suspense>
    </div>
  )
}

function TestsTableSkeleton() {
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