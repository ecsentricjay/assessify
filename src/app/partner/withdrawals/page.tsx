// app/partner/withdrawals/page.tsx
export const dynamic = 'force-dynamic'

import { getMyWithdrawals } from '@/lib/actions/partner-withdrawals.actions'
import { getMyPartnerProfile } from '@/lib/actions/partner.actions'
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

export default async function PartnerWithdrawalsPage() {
  const profileResult = await getMyPartnerProfile()
  const partner = profileResult.data

  if (!partner) {
    return <div>Partner not found</div>
  }

  const withdrawalsResult = await getMyWithdrawals({
    limit: 100,
    sortBy: 'requested_at',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Withdrawals</h1>
          <p className="text-muted-foreground mt-1">
            Manage your withdrawal requests
          </p>
        </div>
        <Button asChild>
          <Link href="/partner/withdrawals/create">
            <Plus className="mr-2 h-4 w-4" />
            Request Withdrawal
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{Number(partner.pending_earnings || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Can withdraw now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₦{pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {withdrawals.filter(w => w.status === 'pending').length} request(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₦{approvedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {withdrawals.filter(w => w.status === 'approved').length} request(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{paidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {withdrawals.filter(w => w.status === 'paid').length} payment(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>
            All your withdrawal requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No withdrawal requests yet</p>
              <p className="text-sm mt-1 mb-4">
                You have ₦{Number(partner.pending_earnings || 0).toLocaleString()} available to withdraw
              </p>
              <Button asChild>
                <Link href="/partner/withdrawals/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Request Your First Withdrawal
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requested Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="text-sm">
                        {withdrawal.requested_at ? (
                          <>
                            {new Date(withdrawal.requested_at).toLocaleDateString()}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {new Date(withdrawal.requested_at).toLocaleTimeString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₦{Number(withdrawal.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{withdrawal.bank_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {withdrawal.account_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {withdrawal.account_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status || 'pending')}</TableCell>
                      <TableCell className="text-sm font-mono">
                        {withdrawal.payment_reference || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {withdrawal.status === 'rejected' && withdrawal.rejection_reason ? (
                          <div className="text-red-600">
                            <span className="font-medium">Rejected: </span>
                            {withdrawal.rejection_reason}
                          </div>
                        ) : withdrawal.review_notes ? (
                          withdrawal.review_notes
                        ) : withdrawal.request_notes ? (
                          withdrawal.request_notes
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {withdrawals.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Total requests: {withdrawals.length}
                </p>
                <div className="flex gap-6">
                  <div>
                    <span className="text-muted-foreground">Pending: </span>
                    <span className="font-medium text-yellow-600">
                      ₦{pendingAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Paid: </span>
                    <span className="font-medium text-green-600">
                      ₦{paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium">
                      ₦{totalRequested.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}