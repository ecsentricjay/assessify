// app/admin/finances/reports/page.tsx
import { Suspense } from 'react'
import {
  getFinancialReport,
  getRevenueByPeriod,
  getTopLecturers
} from '@/lib/actions/admin-reports.actions'
import FinancialReportsClient from './financial-reports-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function FinancialReportsPage({
  searchParams
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}) {
  const params = await searchParams
  const startDate = params.startDate
  const endDate = params.endDate

  const [financialResult, revenueResult, lecturersResult] = await Promise.all([
    getFinancialReport({ startDate, endDate }),
    getRevenueByPeriod({ startDate, endDate, groupBy: 'day' }),
    getTopLecturers(5)
  ])

  const financial = (financialResult.success && financialResult.report) ? financialResult.report : null
  const revenueData = (revenueResult.success && revenueResult.data) ? revenueResult.data : []
  const topLecturers = (lecturersResult.success && lecturersResult.lecturers) ? lecturersResult.lecturers : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          Platform revenue, earnings, and financial analytics
        </p>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{financial?.totalRevenue.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₦{financial?.platformEarnings.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              30% of revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecturer Earnings</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₦{financial?.lecturerEarnings.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              70% of revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{financial?.netRevenue.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              After withdrawals & refunds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₦{financial?.totalWithdrawals.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Paid to lecturers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₦{financial?.totalRefunds.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Refunded to students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{financial?.averageTransactionValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financial?.totalTransactions || 0} total transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Details */}
      <Suspense fallback={<ReportsSkeleton />}>
        <FinancialReportsClient
          revenueData={revenueData}
          topLecturers={topLecturers}
          financialReport={financial}
        />
      </Suspense>
    </div>
  )
}

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}