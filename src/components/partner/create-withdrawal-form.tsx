'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { createWithdrawalRequest } from '@/lib/actions/partner-withdrawals.actions'
import { Loader2 } from 'lucide-react'

interface Props {
  partner: any
  availableBalance: number
}

export default function CreateWithdrawalForm({ partner, availableBalance }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useSavedDetails, setUseSavedDetails] = useState(true)
  const [formData, setFormData] = useState({
    amount: '',
    bankName: partner.bank_name || '',
    accountNumber: partner.account_number || '',
    accountName: partner.account_name || '',
    requestNotes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createWithdrawalRequest({
        amount: parseFloat(formData.amount),
        bankName: useSavedDetails ? undefined : formData.bankName,
        accountNumber: useSavedDetails ? undefined : formData.accountNumber,
        accountName: useSavedDetails ? undefined : formData.accountName,
        requestNotes: formData.requestNotes,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Withdrawal request submitted!')
        router.push('/partner/withdrawals')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₦) *</Label>
        <Input
          id="amount"
          type="number"
          min="1000"
          max={availableBalance}
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          Min: ₦1,000 • Available: ₦{availableBalance.toLocaleString()}
        </p>
      </div>

      {/* Use Saved Bank Details */}
      {partner.bank_name && (
        <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
          <Checkbox
            id="useSaved"
            checked={useSavedDetails}
            onCheckedChange={(checked) => setUseSavedDetails(checked as boolean)}
          />
          <div className="flex-1">
            <Label htmlFor="useSaved" className="font-normal cursor-pointer">
              Use saved bank details
            </Label>
            <p className="text-sm text-muted-foreground">
              {partner.bank_name} • {partner.account_number}
            </p>
          </div>
        </div>
      )}

      {/* Bank Details (if not using saved) */}
      {!useSavedDetails && (
        <>
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              required={!useSavedDetails}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              maxLength={10}
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
              required={!useSavedDetails}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name *</Label>
            <Input
              id="accountName"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              required={!useSavedDetails}
            />
          </div>
        </>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          rows={3}
          value={formData.requestNotes}
          onChange={(e) => setFormData({ ...formData, requestNotes: e.target.value })}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </div>
    </form>
  )
}