// components/admin/partner-withdrawals-list.tsx
import { getAllPartnerWithdrawals } from '@/lib/actions/partner-withdrawals.actions'
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
import { Wallet, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface PartnerWithdrawalsListProps {
  partnerId: string
}

export default async function PartnerWithdrawalsList({ partnerId }: PartnerWithdrawalsListProps) {
  const result = await getAllPartnerWithdrawals({
    partnerId,
    limit: 50,
    sortBy: 'requested_at',
    sortOrder: 'desc',
  })

  const withdrawals = result.data?.data || []

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive', color: string }> = {
      pending: { variant: 'secondary', color: 'text-yellow-600 bg-yellow-50' },
      approved: { variant: 'default', color: 'text-blue-600 bg-blue-50' },
      rejected: { variant: 'destructive', color: 'text-red-600 bg-red-50' },
      paid: { variant: 'default', color: 'text-green-600 bg-green-50' },
    }
    const config = variants[status] || variants.pending
    return (
      <Badge variant={config.variant} className={`capitalize ${config.color}`}>
        {status}
      </Badge>
    )
  }

  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No withdrawal requests</p>
        <p className="text-sm mt-1">Withdrawal history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewed By</TableHead>
              <TableHead>Payment Ref</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell className="text-sm">
                  {withdrawal.requested_at ? new Date(withdrawal.requested_at).toLocaleDateString() : '—'}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {withdrawal.requested_at ? new Date(withdrawal.requested_at).toLocaleTimeString() : '—'}
                  </span>
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
                <TableCell className="text-sm">
                  {withdrawal.reviewed_by_profile?.full_name || (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {withdrawal.reviewed_at && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(withdrawal.reviewed_at).toLocaleDateString()}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {withdrawal.payment_reference || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/finances/withdrawals?id=${withdrawal.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Total: {withdrawals.length} request{withdrawals.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Pending: </span>
            <span className="font-medium text-yellow-600">
              ₦{withdrawals.filter(w => w.status === 'pending')
                .reduce((sum, w) => sum + Number(w.amount), 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Approved: </span>
            <span className="font-medium text-blue-600">
              ₦{withdrawals.filter(w => w.status === 'approved')
                .reduce((sum, w) => sum + Number(w.amount), 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Paid: </span>
            <span className="font-medium text-green-600">
              ₦{withdrawals.filter(w => w.status === 'paid')
                .reduce((sum, w) => sum + Number(w.amount), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}