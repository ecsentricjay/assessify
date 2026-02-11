// app/admin/finances/transactions/page.tsx
import { Suspense } from 'react'
import { getAllTransactions, getTransactionStatistics, getTransactionPurposes } from '@/lib/actions/admin-transactions.actions'
import TransactionsClient from './transactions-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function TransactionsPage({
  searchParams
}: {
  searchParams: Promise<{
    search?: string
    type?: string
    purpose?: string
    startDate?: string
    endDate?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const filters = {
    search: params.search || '',
    type: (params.type as 'all' | 'credit' | 'debit') || 'all',
    purpose: params.purpose || 'all',
    startDate: params.startDate,
    endDate: params.endDate,
    page: parseInt(params.page || '1')
  }

  const [transactionsResult, statsResult, purposesResult] = await Promise.all([
    getAllTransactions(filters),
    getTransactionStatistics({ startDate: filters.startDate, endDate: filters.endDate }),
    getTransactionPurposes()
  ])

  const stats = statsResult.success ? statsResult.statistics : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground">
          View and export all platform transactions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{stats?.totalCredit.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Money in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debit</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₦{stats?.totalDebit.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Money out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.netFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₦{stats?.netFlow.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Credit - Debit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingTransactions || 0} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Suspense fallback={<TransactionsTableSkeleton />}>
        <TransactionsClient
          initialTransactions={transactionsResult.success ? (transactionsResult.transactions ?? []) : []}
          initialTotal={transactionsResult.success ? transactionsResult.total ?? 0 : 0}
          initialFilters={filters}
          purposes={purposesResult.success ? purposesResult.purposes ?? [] : []}
        />
      </Suspense>
    </div>
  )
}

function TransactionsTableSkeleton() {
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