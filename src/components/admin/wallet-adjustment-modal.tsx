// components/admin/wallet-adjustment-modal.tsx
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
import { creditWallet, debitWallet } from '@/lib/actions/admin-wallet.actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface WalletAdjustmentModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
  type: 'credit' | 'debit'
  currentBalance: number
}

export function WalletAdjustmentModal({
  open,
  onClose,
  onSuccess,
  userId,
  type,
  currentBalance
}: WalletAdjustmentModalProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = parseFloat(amount)
    
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    if (type === 'debit' && numAmount > currentBalance) {
      toast.error('Amount exceeds current balance')
      return
    }

    setLoading(true)
    try {
      const result = type === 'credit' 
        ? await creditWallet(userId, numAmount, reason)
        : await debitWallet(userId, numAmount, reason)

      if (result.success) {
        toast.success(
          type === 'credit'
            ? `Successfully credited ₦${numAmount.toLocaleString()}`
            : `Successfully debited ₦${numAmount.toLocaleString()}`
        )
        setAmount('')
        setReason('')
        router.refresh()
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

  const handleClose = () => {
    if (!loading) {
      setAmount('')
      setReason('')
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'credit' ? 'Add Funds' : 'Deduct Funds'}
          </DialogTitle>
          <DialogDescription>
            {type === 'credit' 
              ? 'Manually credit funds to this user\'s wallet'
              : 'Manually debit funds from this user\'s wallet'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Current Balance */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold">₦{currentBalance.toLocaleString()}</p>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={type === 'debit' ? currentBalance : undefined}
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
              />
              {type === 'debit' && (
                <p className="text-xs text-gray-500">
                  Maximum: ₦{currentBalance.toLocaleString()}
                </p>
              )}
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for adjustment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={loading}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                This will be logged in the admin actions history
              </p>
            </div>

            {/* Preview */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">New Balance Preview</p>
                <p className="text-xl font-bold text-blue-600">
                  ₦{(
                    type === 'credit'
                      ? currentBalance + parseFloat(amount)
                      : currentBalance - parseFloat(amount)
                  ).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={type === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading 
                ? 'Processing...' 
                : type === 'credit' 
                  ? 'Add Funds' 
                  : 'Deduct Funds'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
export default WalletAdjustmentModal