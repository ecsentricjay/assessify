// app/lecturer/withdrawals/create/page.tsx
export const dynamic = 'force-dynamic'

import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getLecturerPendingEarnings } from '@/lib/actions/lecturer-withdrawals.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import CreateLecturerWithdrawalForm from '@/components/lecturer/create-withdrawal-form'

export default async function CreateLecturerWithdrawalPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Please log in to request a withdrawal</div>
  }

  const earningsResult = await getLecturerPendingEarnings(user.id)
  const availableBalance = earningsResult.data?.pendingEarnings || 0

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/lecturer/withdrawals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Request Withdrawal</h1>
          <p className="text-muted-foreground mt-1">
            Withdraw your earnings to your bank account
          </p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" asChild>
            <Link href="/lecturer/dashboard">
              Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Available Balance Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="border-b-2 border-green-200 pb-4">
          <CardTitle className="text-green-900">Available Balance</CardTitle>
          <CardDescription className="text-green-700">
            Amount you can withdraw right now
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-600">
            ₦{Number(availableBalance).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardHeader className="border-b-2 border-slate-200 pb-4">
          <CardTitle>Withdrawal Details</CardTitle>
          <CardDescription>
            Enter the amount and confirm your bank details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateLecturerWithdrawalForm
            availableBalance={availableBalance}
          />
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-2 border-blue-300 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-blue-900">
            <p className="font-medium">📝 Withdrawal Guidelines:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Minimum withdrawal amount is ₦1,000</li>
              <li>Requests are reviewed within 24-48 hours</li>
              <li>Approved withdrawals are processed within 3-5 business days</li>
              <li>Ensure your bank details are correct to avoid delays</li>
              <li>You&apos;ll receive a notification when your request is processed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
