// src/components/admin/withdrawals-table.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Eye,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import WithdrawalActionsModal from './withdrawal-actions-modal'
import type { Withdrawal } from '@/types/withdrawal.types'

interface Props {
  withdrawals: any[] // Accept any[] and transform
  type: 'lecturer' | 'partner'
}

export default function WithdrawalsTable({ withdrawals, type }: Props) {
  const router = useRouter()
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'mark-paid' | 'view' | null>(null)

  // Transform and normalize withdrawals
  const normalizedWithdrawals: Withdrawal[] = withdrawals.map(w => ({
    id: w.id,
    amount: w.amount,
    status: w.status || 'pending',
    bank_name: w.bank_name,
    account_number: w.account_number,
    account_name: w.account_name,
    created_at: w.created_at || null,
    requested_at: w.requested_at || null,
    notes: w.notes || null,
    request_notes: w.request_notes || null,
    lecturer: w.lecturer || null,
    partner: w.partner || null,
    payment_reference: w.payment_reference || null,
    reviewed_at: w.reviewed_at || null,
    paid_at: w.paid_at || null,
    rejection_reason: w.rejection_reason || null,
    review_notes: w.review_notes || null,
  }))

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive', className: string }> = {
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' },
      approved: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
      rejected: { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-200' },
      paid: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-200' },
    }
    const { variant, className } = config[status] || config.pending
    return (
      <Badge variant={variant} className={className}>
        {status}
      </Badge>
    )
  }

  const handleAction = (withdrawal: Withdrawal, action: 'approve' | 'reject' | 'mark-paid' | 'view') => {
    setSelectedWithdrawal(withdrawal)
    setModalAction(action)
  }

  const handleClose = () => {
    setSelectedWithdrawal(null)
    setModalAction(null)
    router.refresh()
  }

  if (normalizedWithdrawals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No withdrawal requests found</p>
        <p className="text-sm mt-1">Requests will appear here when submitted</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requested</TableHead>
              <TableHead>{type === 'lecturer' ? 'Lecturer' : 'Partner'}</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Bank Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {normalizedWithdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                {/* Requested Date */}
                <TableCell className="text-sm">
                  {withdrawal.created_at || withdrawal.requested_at ? (
                    <>
                      <p className="font-medium">
                        {new Date(withdrawal.created_at || withdrawal.requested_at!).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(withdrawal.created_at || withdrawal.requested_at!), { addSuffix: true })}
                      </p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Lecturer/Partner Info */}
                <TableCell>
                  {type === 'lecturer' && withdrawal.lecturer ? (
                    <div className="text-sm">
                      <p className="font-medium">
                        {withdrawal.lecturer.first_name} {withdrawal.lecturer.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {withdrawal.lecturer.email}
                      </p>
                    </div>
                  ) : type === 'partner' && withdrawal.partner ? (
                    <div className="text-sm">
                      <p className="font-medium">{withdrawal.partner.business_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {withdrawal.partner.partner_code}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Amount */}
                <TableCell className="text-right">
                  <span className="font-bold text-lg">
                    ₦{Number(withdrawal.amount).toLocaleString()}
                  </span>
                </TableCell>

                {/* Bank Details */}
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

                {/* Status */}
                <TableCell>
                  {getStatusBadge(withdrawal.status)}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* View Details */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(withdrawal, 'view')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Pending: Can Approve or Reject */}
                    {withdrawal.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAction(withdrawal, 'approve')}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(withdrawal, 'reject')}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Reject
                        </Button>
                      </>
                    )}

                    {/* Approved: Can Mark as Paid */}
                    {withdrawal.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleAction(withdrawal, 'mark-paid')}
                      >
                        <DollarSign className="mr-1 h-3 w-3" />
                        Mark as Paid
                      </Button>
                    )}

                    {/* Paid or Rejected: View Only */}
                    {(withdrawal.status === 'paid' || withdrawal.status === 'rejected') && (
                      <Badge variant="secondary" className="text-xs">
                        {withdrawal.status === 'paid' ? 'Completed' : 'Closed'}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions Modal */}
      {selectedWithdrawal && modalAction && (
        <WithdrawalActionsModal
          withdrawal={selectedWithdrawal}
          action={modalAction}
          type={type}
          onClose={handleClose}
        />
      )}
    </>
  )
}