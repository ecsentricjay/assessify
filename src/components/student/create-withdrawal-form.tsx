'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createStudentWithdrawalRequest } from '@/lib/actions/student-withdrawals.actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface CreateStudentWithdrawalFormProps {
  availableBalance: number
}

const MINIMUM_WITHDRAWAL = 1000

export function CreateStudentWithdrawalForm({ availableBalance }: CreateStudentWithdrawalFormProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validateForm = (): boolean => {
    setError(null)

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return false
    }

    if (amountNum < MINIMUM_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is ₦${MINIMUM_WITHDRAWAL.toLocaleString()}`)
      return false
    }

    if (amountNum > availableBalance) {
      setError(`Amount exceeds available balance of ₦${availableBalance.toLocaleString()}`)
      return false
    }

    if (!bankName.trim()) {
      setError('Bank name is required')
      return false
    }

    if (!accountNumber.trim() || accountNumber.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit account number')
      return false
    }

    if (!accountName.trim()) {
      setError('Account name is required')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createStudentWithdrawalRequest({
        amount: parseFloat(amount),
        bankName: bankName.trim(),
        accountNumber: accountNumber.replace(/\D/g, ''),
        accountName: accountName.trim(),
        requestNotes: requestNotes.trim() || undefined,
      })

      if (result.success) {
        setSuccess(true)
        toast.success('Withdrawal request created successfully!')
        
        setTimeout(() => {
          router.push('/student/wallet/withdrawals')
        }, 2000)
      } else {
        setError(result.error || 'Failed to create withdrawal request')
        toast.error(result.error || 'Failed to create withdrawal request')
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-semibold">Withdrawal Request Submitted</p>
              <p className="text-sm">Your request has been successfully created. You will be redirected shortly.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
        <CardDescription>Withdraw your available balance to your bank account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance Display */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-700">Available Balance</p>
              <p className="text-2xl font-bold text-amber-900">₦{availableBalance.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Amount Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Amount (₦)</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              min="0"
              step="1"
              className="border-slate-300"
            />
            <p className="text-xs text-slate-500">
              Minimum: ₦{MINIMUM_WITHDRAWAL.toLocaleString()} | Maximum: ₦{availableBalance.toLocaleString()}
            </p>
          </div>

          {/* Bank Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Bank Name</label>
            <Input
              type="text"
              placeholder="e.g., Zenith Bank, First Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              disabled={isSubmitting}
              className="border-slate-300"
            />
          </div>

          {/* Account Number Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Account Number</label>
            <Input
              type="text"
              placeholder="10-digit account number"
              value={accountNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                setAccountNumber(digits)
              }}
              disabled={isSubmitting}
              maxLength={10}
              className="border-slate-300"
            />
            <p className="text-xs text-slate-500">{accountNumber.length}/10 digits</p>
          </div>

          {/* Account Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Account Name</label>
            <Input
              type="text"
              placeholder="Name on bank account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={isSubmitting}
              className="border-slate-300"
            />
          </div>

          {/* Request Notes Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Additional Notes (Optional)</label>
            <Textarea
              placeholder="Add any additional information about this withdrawal request..."
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="border-slate-300"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || availableBalance < MINIMUM_WITHDRAWAL}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              `Request Withdrawal${amount ? ` (₦${parseFloat(amount).toLocaleString()})` : ''}`
            )}
          </Button>

          {availableBalance < MINIMUM_WITHDRAWAL && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient balance. You need at least ₦{MINIMUM_WITHDRAWAL.toLocaleString()} to request a withdrawal.
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
