// app/lecturer/withdrawals/page.tsx
export const dynamic = 'force-dynamic'

import { getMyWithdrawals, getLecturerPendingEarnings } from '@/lib/actions/lecturer-withdrawals.actions'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, Plus, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function LecturerWithdrawalsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Please log in to view withdrawals</div>
  }

  const earningsResult = await getLecturerPendingEarnings(user.id)
  const pendingEarnings = earningsResult.data?.pendingEarnings || 0

  const withdrawalsResult = await getMyWithdrawals({
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const withdrawals = withdrawalsResult.data?.data || []

  // Calculate stats
  const totalRequested = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0)
  const pendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Number(w.amount), 0)
  const approvedAmount = withdrawals
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + Number(w.amount), 0)
  const paidAmount = withdrawals
    .filter(w => w.status === 'paid')
    .reduce((sum, w) => sum + Number(w.amount), 0)

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive', className: string }> = {
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      rejected: { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      paid: { variant: 'default', className: 'bg-green-100 text-green-800' },
    }
    const { variant, className } = config[status] || config.pending
    return (
      <Badge variant={variant} className={className}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Withdrawals</h1>
          <p className="text-muted-foreground mt-1">
            Manage your withdrawal requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/lecturer/dashboard">
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/lecturer/withdrawals/create">
              <Plus className="mr-2 h-4 w-4" />
              Request Withdrawal
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-200 hover:border-green-300 transition-colors">
          <CardHeader className="pb-2 border-b border-green-100">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{Number(pendingEarnings || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Can withdraw now
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 hover:border-yellow-300 transition-colors">
          <CardHeader className="pb-2 border-b border-yellow-100">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₦{pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {withdrawals.filter(w => w.status === 'pending').length} request{withdrawals.filter(w => w.status === 'pending').length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-2 border-b border-blue-100">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₦{approvedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Being processed
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 hover:border-green-300 transition-colors">
          <CardHeader className="pb-2 border-b border-green-100">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{paidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals Table */}
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardHeader className="border-b-2 border-slate-200 pb-4">
          <CardTitle className="text-lg">Withdrawal History</CardTitle>
          <CardDescription>
            View all your withdrawal requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length > 0 ? (
                  withdrawals.map(w => (
                    <TableRow key={w.id}>
                      <TableCell className="text-sm">
                        {new Date(w.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        ₦{Number(w.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {w.bank_name}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {w.account_number}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(w.status)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Wallet className="h-8 w-8 opacity-40" />
                        <p>No withdrawal requests yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-2 border-blue-300 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-blue-900">
            <p className="font-semibold">📝 Withdrawal Information</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Minimum withdrawal amount is ₦1,000</li>
              <li>Requests are reviewed within 24-48 hours</li>
              <li>Approved withdrawals are processed within 3-5 business days</li>
              <li>Ensure your bank details are correct to avoid delays</li>
              <li>You&apos;ll receive a notification when your request is processed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
