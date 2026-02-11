// app/admin/finances/page.tsx
import { requireAdmin } from '@/lib/actions/admin-auth.actions'
import { getFinancialOverview } from '@/lib/actions/admin-financial.actions'
import { AdminHeader } from '@/components/admin/admin-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function FinancesPage() {
  const admin = await requireAdmin()
  const overviewResult = await getFinancialOverview()

  const overview = overviewResult.success ? overviewResult.data : null

  return (
    <div className="flex flex-col h-full">
      <AdminHeader 
        title="Financial Management" 
        description="Manage platform finances and withdrawals"
        adminName={`${admin.profile.first_name} ${admin.profile.last_name}`}
        adminEmail={admin.email || ''}
      />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Button */}
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{overview?.platformRevenue.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  27% of all payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Wallet Balance</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{overview?.totalWalletBalance.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all user wallets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                <TrendingDown className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{overview?.totalPaidOut.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completed withdrawals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.transactions.total || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview?.transactions.credits || 0} credits • {overview?.transactions.debits || 0} debits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-700">
                  {overview?.pendingWithdrawals.count || 0}
                </div>
                <p className="text-sm text-yellow-600 mt-1">
                  ₦{overview?.pendingWithdrawals.amount.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved (Awaiting Payment)</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  {overview?.approvedWithdrawals.count || 0}
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  ₦{overview?.approvedWithdrawals.amount.toLocaleString() || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  ₦{overview?.totalPaidOut.toLocaleString() || 0}
                </div>
                <p className="text-sm text-green-600 mt-1">
                  All completed payouts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/finances/withdrawals">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Withdrawal Requests</p>
                      <p className="text-sm text-gray-500">Review & approve</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/finances/transactions">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">All Transactions</p>
                      <p className="text-sm text-gray-500">View history</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/finances/wallets">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Wallet className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Wallet Management</p>
                      <p className="text-sm text-gray-500">View all wallets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/finances/reports">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Financial Reports</p>
                      <p className="text-sm text-gray-500">Analytics & exports</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}