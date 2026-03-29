import { CreateStudentWithdrawalForm } from '@/components/student/create-withdrawal-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getStudentAvailableBalance } from '@/lib/actions/student-withdrawals.actions'
import { AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function CreateWithdrawalPage() {
  // Get current user
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verify user is student
  if (user.profile?.role !== 'student') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>Only students can request withdrawals</p>
        </div>
      </div>
    )
  }

  // Get available balance
  const balanceResult = await getStudentAvailableBalance()

  if (!balanceResult.success) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{balanceResult.error || 'Failed to load wallet information'}</p>
        </div>
      </div>
    )
  }

  const availableBalance = balanceResult.balance || 0

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Request Withdrawal</h1>
        <p className="text-slate-600">Withdraw your earnings to your bank account</p>
      </div>

      {/* Withdrawal Form */}
      <CreateStudentWithdrawalForm availableBalance={availableBalance} />

      {/* Guidelines Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Withdrawal Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-900">Minimum Amount</p>
            <p>You must request a minimum of ₦1,000 per withdrawal</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Processing Time</p>
            <p>Withdrawals are typically processed within 1-3 business days</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Bank Details</p>
            <p>Ensure your bank account details are correct. Incorrect details may result in failed transfers</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Account Verification</p>
            <p>Your account must be verified before withdrawal requests are processed</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Contact Support</p>
            <p>
              If you have questions about your withdrawal, please{' '}
              <a href="/contact" className="text-blue-600 hover:underline">
                contact our support team
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
