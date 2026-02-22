// src/components/lecturer/create-withdrawal-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createLecturerWithdrawalRequest } from '@/lib/actions/lecturer-withdrawals.actions'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  availableBalance: number
}

export default function CreateLecturerWithdrawalForm({ availableBalance }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    requestNotes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    // Client-side validation
    const amount = parseFloat(formData.amount)
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      setIsSubmitting(false)
      return
    }

    if (amount < 1000) {
      setError('Minimum withdrawal amount is ₦1,000')
      setIsSubmitting(false)
      return
    }

    if (amount > availableBalance) {
      setError(`Amount exceeds available balance (₦${availableBalance.toLocaleString()})`)
      setIsSubmitting(false)
      return
    }

    if (!formData.bankName.trim()) {
      setError('Bank name is required')
      setIsSubmitting(false)
      return
    }

    if (!formData.accountNumber.trim() || formData.accountNumber.length !== 10) {
      setError('Please enter a valid 10-digit account number')
      setIsSubmitting(false)
      return
    }

    if (!formData.accountName.trim()) {
      setError('Account name is required')
      setIsSubmitting(false)
      return
    }

    console.log('📤 Submitting withdrawal request:', {
      amount,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      accountName: formData.accountName
    })

    try {
      const result = await createLecturerWithdrawalRequest({
        amount,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        requestNotes: formData.requestNotes || undefined,
      })

      console.log('📥 Server response:', result)

      if (result.error) {
        console.error('❌ Error from server:', result.error)
        setError(result.error)
        toast.error(result.error)
      } else if (result.success) {
        console.log('✅ Withdrawal request created successfully!')
        setSuccess(true)
        toast.success('Withdrawal request submitted successfully!', {
          description: 'Your request is pending review by an administrator.',
          duration: 5000
        })
        
        // ✅ Wait 2 seconds then redirect
        setTimeout(() => {
          router.push('/lecturer/withdrawals')
          router.refresh()
        }, 2000)
      } else {
        console.error('❌ Unexpected response:', result)
        setError('Failed to submit withdrawal request')
        toast.error('Failed to submit withdrawal request')
      }
    } catch (error) {
      console.error('❌ Exception during submission:', error)
      setError('An unexpected error occurred. Please try again.')
      toast.error('Failed to submit withdrawal request')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Show success state
  if (success) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Request Submitted Successfully!
          </h3>
          <p className="text-gray-600">
            Your withdrawal request is now pending review.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to withdrawals page...
          </p>
        </div>
        <Button onClick={() => router.push('/lecturer/withdrawals')}>
          View My Withdrawals
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₦) *</Label>
        <Input
          id="amount"
          type="number"
          min="1000"
          max={availableBalance}
          step="0.01"
          placeholder="Enter amount to withdraw"
          value={formData.amount}
          onChange={(e) => {
            setFormData({ ...formData, amount: e.target.value })
            setError(null)
          }}
          required
          disabled={isSubmitting}
        />
        <p className="text-sm text-muted-foreground">
          Min: ₦1,000 • Available: ₦{availableBalance.toLocaleString()}
        </p>
      </div>

      {/* Bank Name */}
      <div className="space-y-2">
        <Label htmlFor="bankName">Bank Name *</Label>
        <Input
          id="bankName"
          placeholder="e.g., First Bank, GTBank, Access Bank"
          value={formData.bankName}
          onChange={(e) => {
            setFormData({ ...formData, bankName: e.target.value })
            setError(null)
          }}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Account Number */}
      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number *</Label>
        <Input
          id="accountNumber"
          placeholder="10-digit account number"
          maxLength={10}
          value={formData.accountNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '')
            setFormData({ ...formData, accountNumber: value })
            setError(null)
          }}
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          {formData.accountNumber.length}/10 digits
        </p>
      </div>

      {/* Account Name */}
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Name *</Label>
        <Input
          id="accountName"
          placeholder="Account holder name (as it appears on your bank account)"
          value={formData.accountName}
          onChange={(e) => {
            setFormData({ ...formData, accountName: e.target.value })
            setError(null)
          }}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information..."
          rows={3}
          value={formData.requestNotes}
          onChange={(e) => setFormData({ ...formData, requestNotes: e.target.value })}
          disabled={isSubmitting}
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
        <Button
          type="submit"
          disabled={
            isSubmitting || 
            !formData.amount || 
            parseFloat(formData.amount) > availableBalance ||
            parseFloat(formData.amount) < 1000 ||
            !formData.bankName.trim() ||
            !formData.accountNumber.trim() ||
            formData.accountNumber.length !== 10 ||
            !formData.accountName.trim()
          }
          className="flex-1"
        >
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