// components/partner/create-withdrawal-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Wallet } from 'lucide-react'
import { createWithdrawalRequest } from '@/lib/actions/partner-withdrawals.actions'
import { toast } from 'sonner'
import { PartnerWithStats } from '@/lib/types/partner.types'

interface CreateWithdrawalFormProps {
  partner: PartnerWithStats
  availableBalance: number
}

const MIN_WITHDRAWAL = 1000

export default function CreateWithdrawalForm({ 
  partner, 
  availableBalance 
}: CreateWithdrawalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    bankName: partner.bank_name || '',
    accountNumber: partner.account_number || '',
    accountName: partner.account_name || '',
    requestNotes: '',
  })

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setFormData({ ...formData, amount: numericValue })
  }

  const setMaxAmount = () => {
    setFormData({ ...formData, amount: availableBalance.toString() })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const amount = Number(formData.amount)

      // Validation
      if (!amount || amount <= 0) {
        toast.error('Please enter a valid amount')
        setLoading(false)
        return
      }

      if (amount < MIN_WITHDRAWAL) {
        toast.error(`Minimum withdrawal amount is ₦${MIN_WITHDRAWAL.toLocaleString()}`)
        setLoading(false)
        return
      }

      if (amount > availableBalance) {
        toast.error('Amount exceeds available balance')
        setLoading(false)
        return
      }

      if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
        toast.error('Please provide complete bank details')
        setLoading(false)
        return
      }

      const result = await createWithdrawalRequest({
        amount,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        requestNotes: formData.requestNotes,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Withdrawal request submitted successfully!')
        router.push('/partner/withdrawals')
        router.refresh()
      }
    } catch (error) {
      console.error('Withdrawal request error:', error)
      toast.error('Failed to submit withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  const amountValue = Number(formData.amount || 0)
  const isValidAmount = amountValue >= MIN_WITHDRAWAL && amountValue <= availableBalance
  const hasRequiredFields = formData.bankName && formData.accountNumber && formData.accountName

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Withdrawal Amount (₦) *</Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ₦
            </span>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="pl-8 text-lg font-semibold"
              required
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={setMaxAmount}
          >
            Max
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Min: ₦{MIN_WITHDRAWAL.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            Available: ₦{availableBalance.toLocaleString()}
          </span>
        </div>
        {amountValue > 0 && !isValidAmount && (
          <p className="text-xs text-red-600">
            {amountValue < MIN_WITHDRAWAL 
              ? `Amount must be at least ₦${MIN_WITHDRAWAL.toLocaleString()}`
              : 'Amount exceeds available balance'
            }
          </p>
        )}
      </div>

      {/* Bank Details */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Bank Details</h3>
          {(partner.bank_name || partner.account_number || partner.account_name) && (
            <p className="text-xs text-muted-foreground">
              Using saved bank details
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankName">Bank Name *</Label>
          <Input
            id="bankName"
            placeholder="e.g., GTBank, Access Bank, Zenith Bank"
            value={formData.bankName}
            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number *</Label>
          <Input
            id="accountNumber"
            type="text"
            inputMode="numeric"
            placeholder="0123456789"
            maxLength={10}
            value={formData.accountNumber}
            onChange={(e) => setFormData({ 
              ...formData, 
              accountNumber: e.target.value.replace(/[^0-9]/g, '') 
            })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountName">Account Name *</Label>
          <Input
            id="accountName"
            placeholder="Account holder name"
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="requestNotes">Additional Notes (Optional)</Label>
        <Textarea
          id="requestNotes"
          placeholder="Any additional information for the admin..."
          value={formData.requestNotes}
          onChange={(e) => setFormData({ ...formData, requestNotes: e.target.value })}
          rows={3}
        />
      </div>

      {/* Summary */}
      {isValidAmount && hasRequiredFields && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="font-medium">Summary:</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">₦{amountValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank:</span>
              <span className="font-medium">{formData.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account:</span>
              <span className="font-medium font-mono">{formData.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{formData.accountName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={loading || !isValidAmount || !hasRequiredFields}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Submit Request
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/partner/withdrawals')}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}