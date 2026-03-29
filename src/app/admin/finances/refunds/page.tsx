// app/admin/finances/refunds/page.tsx
import { Suspense } from 'react'
import { getAllRefunds, getRefundStatistics } from '@/lib/actions/admin-refunds.actions'
import RefundsClient from './refunds-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, CheckCircle, Clock, TrendingDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function RefundsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ''
  const status = params.status || 'all'
  const page = parseInt(params.page || '1')

  const [refundsResult, statsResult] = await Promise.all([
    getAllRefunds({ search, status, page, limit: 20 }),
    getRefundStatistics()
  ])

  const stats = statsResult.success ? statsResult.statistics : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Refund Management</h1>
        <p className="text-muted-foreground">
          Process refunds and view refund history
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₦{stats?.totalAmount.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalRefunds || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedRefunds || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{stats?.thisMonthAmount.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.thisMonthRefunds || 0} refunds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pendingRefunds || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Table */}
      <Suspense fallback={<RefundsTableSkeleton />}>
        <RefundsClient
          initialRefunds={refundsResult.success ? (refundsResult.refunds ?? []) : []}
          initialTotal={refundsResult.success ? (refundsResult.total ?? 0) : 0}
          initialPage={page}
          initialSearch={search}
          initialStatus={status}
        />
      </Suspense>
    </div>
  )
}

function RefundsTableSkeleton() {
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