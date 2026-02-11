// app/admin/finances/wallets/page.tsx
import { Suspense } from 'react'
import { getAllWallets, getWalletStatistics } from '@/lib/actions/admin-wallet.actions'
import WalletsClient from './wallets-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function WalletsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ''
  const page = parseInt(params.page || '1')

  const [walletsResult, statsResult] = await Promise.all([
    getAllWallets({ search, page, limit: 20 }),
    getWalletStatistics()
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Wallet Management</h1>
        <p className="text-muted-foreground">
          View and manage all user wallets across the platform
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{statsResult.success && statsResult.statistics ? statsResult.statistics.totalBalance.toLocaleString() : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all wallets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsResult.success && statsResult.statistics ? statsResult.statistics.totalWallets : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active user accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsResult.success && statsResult.statistics ? statsResult.statistics.activeWallets : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              With balance &gt; ₦0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{statsResult.success && statsResult.statistics ? statsResult.statistics.averageBalance.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per wallet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wallets Table */}
      <Suspense fallback={<WalletsTableSkeleton />}>
        <WalletsClient 
          initialWallets={walletsResult.success ? (walletsResult.wallets ?? []) : []}
          initialTotal={walletsResult.success ? (walletsResult.total ?? 0) : 0}
          initialPage={page}
          initialSearch={search}
        />
      </Suspense>
    </div>
  )
}

function WalletsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}