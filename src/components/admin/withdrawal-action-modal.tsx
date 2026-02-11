// components/admin/withdrawal-action-modal.tsx
'use client'

import { useState } from 'react'
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
import {
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalAsPaid
} from '@/lib/actions/admin-financial.actions'
import { toast } from 'sonner'
import { CheckCircle, XCircle, DollarSign } from 'lucide-react'

interface WithdrawalActionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  type: 'approve' | 'reject' | 'paid'
  request: any
}

export function WithdrawalActionModal({
  open,
  onClose,
  onSuccess,
  type,
  request
}: WithdrawalActionModalProps) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [paymentReference, setPaymentReference] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (type === 'reject' && !notes.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    if (type === 'paid' && !paymentReference.trim()) {
      toast.error('Please enter payment reference')
      return
    }

    setLoading(true)
    try {
      let result

      if (type === 'approve') {
        result = await approveWithdrawal(request.id, notes)
      } else if (type === 'reject') {
        result = await rejectWithdrawal(request.id, notes)
      } else {
        result = await markWithdrawalAsPaid(request.id, paymentReference)
      }

      if (result.success) {
        toast.success(
          type === 'approve'
            ? 'Withdrawal approved successfully'
            : type === 'reject'
            ? 'Withdrawal rejected'
            : 'Marked as paid successfully'
        )
        onSuccess()
      } else {
        toast.error(result.error || 'Operation failed')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getModalContent = () => {
    switch (type) {
      case 'approve':
        return {
          title: 'Approve Withdrawal',
          description: `Approve withdrawal request for ₦${request.amount.toLocaleString()} to ${request.lecturer?.first_name} ${request.lecturer?.last_name}?`,
          icon: <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />,
          buttonText: 'Approve',
          buttonClass: 'bg-green-600 hover:bg-green-700'
        }
      case 'reject':
        return {
          title: 'Reject Withdrawal',
          description: `Reject withdrawal request for ₦${request.amount.toLocaleString()}? This action cannot be undone.`,
          icon: <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />,
          buttonText: 'Reject',
          buttonClass: 'bg-red-600 hover:bg-red-700'
        }
      case 'paid':
        return {
          title: 'Mark as Paid',
          description: `Confirm payment of ₦${request.amount.toLocaleString()} has been made to ${request.lecturer?.first_name} ${request.lecturer?.last_name}?`,
          icon: <DollarSign className="h-12 w-12 text-blue-500 mx-auto mb-4" />,
          buttonText: 'Mark as Paid',
          buttonClass: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  const content = getModalContent()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {content.icon}

            {/* Request Details */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Lecturer:</span>
                <span className="font-medium">
                  {request.lecturer?.first_name} {request.lecturer?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-lg">₦{request.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bank:</span>
                <span className="font-medium">{request.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account:</span>
                <span className="font-medium">{request.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-medium">{request.account_name}</span>
              </div>
            </div>

            {/* Payment Reference (for paid) */}
            {type === 'paid' && (
              <div className="space-y-2">
                <Label htmlFor="payment_reference">
                  Payment Reference <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payment_reference"
                  placeholder="e.g., TXN123456789"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Enter the bank transfer reference or transaction ID
                </p>
              </div>
            )}

            {/* Notes (approve/reject) */}
            {(type === 'approve' || type === 'reject') && (
              <div className="space-y-2">
                <Label htmlFor="notes">
                  {type === 'reject' ? 'Reason for Rejection' : 'Notes (Optional)'}
                  {type === 'reject' && <span className="text-red-500"> *</span>}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    type === 'reject'
                      ? 'Explain why this request is being rejected...'
                      : 'Add any additional notes...'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required={type === 'reject'}
                  disabled={loading}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={content.buttonClass}
            >
              {loading ? 'Processing...' : content.buttonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}