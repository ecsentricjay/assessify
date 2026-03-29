// app/partner/withdrawals/create/page.tsx
export const dynamic = 'force-dynamic'

import { getMyPartnerProfile } from '@/lib/actions/partner.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import CreateWithdrawalForm from '@/components/partner/create-withdrawal-form'

export default async function CreateWithdrawalPage() {
  const profileResult = await getMyPartnerProfile()
  const partner = profileResult.data

  if (!partner) {
    return <div>Partner not found</div>
  }

  const availableBalance = Number(partner.pending_earnings || 0)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/partner/withdrawals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Request Withdrawal</h1>
          <p className="text-muted-foreground mt-1">
            Withdraw your earnings to your bank account
          </p>
        </div>
      </div>

      {/* Available Balance Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">Available Balance</CardTitle>
          <CardDescription className="text-green-700">
            Amount you can withdraw right now
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-600">
            ₦{availableBalance.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
          <CardDescription>
            Enter the amount and confirm your bank details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWithdrawalForm 
            partner={partner} 
            availableBalance={availableBalance}
          />
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
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
  )
}