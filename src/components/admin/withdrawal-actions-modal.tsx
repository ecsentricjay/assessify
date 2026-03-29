// src/components/admin/withdrawal-actions-modal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Withdrawal } from '@/types/withdrawal.types'

// Import admin actions
import { 
  approveLecturerWithdrawal,
  rejectLecturerWithdrawal,
  markLecturerWithdrawalAsPaid
} from '@/lib/actions/admin-withdrawals.actions'
import {
  approvePartnerWithdrawal,
  rejectPartnerWithdrawal,
  markPartnerWithdrawalAsPaid
} from '@/lib/actions/partner-withdrawals.actions'

interface Props {
  withdrawal: Withdrawal
  action: 'approve' | 'reject' | 'mark-paid' | 'view'
  type: 'lecturer' | 'partner'
  onClose: () => void
}

export default function WithdrawalActionsModal({ 
  withdrawal, 
  action, 
  type,
  onClose 
}: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    reviewNotes: '',
    rejectionReason: '',
    paymentReference: '',
  })

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const result = type === 'lecturer'
        ? await approveLecturerWithdrawal(withdrawal.id, {
            reviewNotes: formData.reviewNotes
          })
        : await approvePartnerWithdrawal(withdrawal.id, {
            reviewNotes: formData.reviewNotes
          })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Withdrawal approved successfully!')
        onClose()
      }
    } catch (error) {
      toast.error('Failed to approve withdrawal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!formData.rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setIsSubmitting(true)
    try {
      const result = type === 'lecturer'
        ? await rejectLecturerWithdrawal(withdrawal.id, {
            rejectionReason: formData.rejectionReason,
            reviewNotes: formData.reviewNotes
          })
        : await rejectPartnerWithdrawal(withdrawal.id, {
            rejectionReason: formData.rejectionReason,
            reviewNotes: formData.reviewNotes
          })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Withdrawal rejected')
        onClose()
      }
    } catch (error) {
      toast.error('Failed to reject withdrawal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!formData.paymentReference.trim()) {
      toast.error('Please provide a payment reference')
      return
    }

    setIsSubmitting(true)
    try {
      const result = type === 'lecturer'
        ? await markLecturerWithdrawalAsPaid(withdrawal.id, {
            paymentReference: formData.paymentReference
          })
        : await markPartnerWithdrawalAsPaid(withdrawal.id, {
            paymentReference: formData.paymentReference
          })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Withdrawal marked as paid!')
        onClose()
      }
    } catch (error) {
      toast.error('Failed to mark as paid')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitle = () => {
    switch (action) {
      case 'approve': return 'Approve Withdrawal'
      case 'reject': return 'Reject Withdrawal'
      case 'mark-paid': return 'Mark as Paid'
      case 'view': return 'Withdrawal Details'
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      pending: { className: 'bg-yellow-100 text-yellow-800' },
      approved: { className: 'bg-blue-100 text-blue-800' },
      rejected: { className: 'bg-red-100 text-red-800' },
      paid: { className: 'bg-green-100 text-green-800' },
    }
    const { className } = config[status] || config.pending
    return (
      <Badge className={className}>
        {status}
      </Badge>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'approve' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {action === 'reject' && <XCircle className="h-5 w-5 text-red-600" />}
            {action === 'mark-paid' && <DollarSign className="h-5 w-5 text-blue-600" />}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {type === 'lecturer' ? 'Lecturer' : 'Partner'} withdrawal request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Withdrawal Details Card */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-700">Request Details</h3>
              {getStatusBadge(withdrawal.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 text-xs">Amount</p>
                <p className="font-bold text-xl text-green-600">
                  ₦{Number(withdrawal.amount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Requested</p>
                <p className="font-medium">
                  {withdrawal.created_at || withdrawal.requested_at 
                    ? new Date(withdrawal.created_at || withdrawal.requested_at!).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="border-t pt-3">
              <p className="text-gray-600 text-xs mb-1">
                {type === 'lecturer' ? 'Lecturer' : 'Partner'} Information
              </p>
              {type === 'lecturer' && withdrawal.lecturer ? (
                <div>
                  <p className="font-medium">
                    {withdrawal.lecturer.first_name} {withdrawal.lecturer.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{withdrawal.lecturer.email}</p>
                </div>
              ) : type === 'partner' && withdrawal.partner ? (
                <div>
                  <p className="font-medium">{withdrawal.partner.business_name}</p>
                  <p className="text-sm text-gray-600 font-mono">
                    {withdrawal.partner.partner_code}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Bank Details */}
            <div className="border-t pt-3">
              <p className="text-gray-600 text-xs mb-1">Bank Details</p>
              <div className="space-y-1">
                <p className="font-medium">{withdrawal.bank_name}</p>
                <p className="font-mono text-sm">{withdrawal.account_number}</p>
                <p className="text-sm text-gray-600">{withdrawal.account_name}</p>
              </div>
            </div>

            {/* Request Notes */}
            {(withdrawal.notes || withdrawal.request_notes) && (
              <div className="border-t pt-3">
                <p className="text-gray-600 text-xs mb-1">Request Notes</p>
                <p className="text-sm">{withdrawal.notes || withdrawal.request_notes}</p>
              </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
              <div className="border-t pt-3 bg-red-50 -m-4 p-4 rounded-b-lg">
                <p className="text-red-700 text-xs mb-1 font-semibold">Rejection Reason</p>
                <p className="text-sm text-red-900">{withdrawal.rejection_reason}</p>
              </div>
            )}

            {/* Payment Reference (if paid) */}
            {withdrawal.status === 'paid' && withdrawal.payment_reference && (
              <div className="border-t pt-3 bg-green-50 -m-4 p-4 rounded-b-lg">
                <p className="text-green-700 text-xs mb-1 font-semibold">Payment Reference</p>
                <p className="text-sm font-mono text-green-900">{withdrawal.payment_reference}</p>
              </div>
            )}
          </div>

          {/* Action-specific Forms */}
          {action === 'approve' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  ⚠️ By approving, you confirm that this withdrawal request is valid and will be processed. 
                  After approval, you'll need to manually transfer ₦{Number(withdrawal.amount).toLocaleString()} 
                  to the bank account above, then mark it as paid.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add any notes about this approval..."
                  rows={3}
                  value={formData.reviewNotes}
                  onChange={(e) => setFormData({ ...formData, reviewNotes: e.target.value })}
                />
              </div>
            </div>
          )}

          {action === 'reject' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why this withdrawal is being rejected..."
                  rows={3}
                  value={formData.rejectionReason}
                  onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be shown to the {type}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Additional Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Internal notes..."
                  rows={2}
                  value={formData.reviewNotes}
                  onChange={(e) => setFormData({ ...formData, reviewNotes: e.target.value })}
                />
              </div>
            </div>
          )}

          {action === 'mark-paid' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-900 font-medium mb-2">
                  ✅ Payment Confirmation
                </p>
                <p className="text-sm text-green-800">
                  Confirm that you have successfully transferred ₦{Number(withdrawal.amount).toLocaleString()} 
                  to {withdrawal.account_name} ({withdrawal.bank_name} - {withdrawal.account_number}).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentReference">Payment Reference / Transaction ID *</Label>
                <Input
                  id="paymentReference"
                  placeholder="e.g., TXN202501234567"
                  value={formData.paymentReference}
                  onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the bank transfer reference or transaction ID
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {action !== 'view' && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {action === 'approve' && (
                <Button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Withdrawal
                    </>
                  )}
                </Button>
              )}

              {action === 'reject' && (
                <Button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  variant="destructive"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Withdrawal
                    </>
                  )}
                </Button>
              )}

              {action === 'mark-paid' && (
                <Button
                  onClick={handleMarkPaid}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Confirm Payment
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {action === 'view' && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}