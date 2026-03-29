'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { getMyEarningsBreakdown } from '@/lib/actions/earnings.actions'
import { toast } from 'sonner'

interface EarningsData {
  submissionRevenue?: number
  lecturerReferrals?: number
  bundleCommissions?: number
  totalBalance: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount)
}

export function EarningsBreakdown({ userRole }: { userRole: string }) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEarnings()
  }, [])

  async function loadEarnings() {
    try {
      const result = await getMyEarningsBreakdown()

      if (result.success && result.data) {
        setEarnings(result.data)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Failed to load earnings:', error)
      toast.error('Failed to load earnings data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Earnings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    )
  }

  if (!earnings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Earnings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-center text-gray-600">
          Unable to load earnings data. Please try again.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-100">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Wallet className="w-5 h-5" />
          My Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Total Balance */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-700 mb-1">Total Balance</p>
          <p className="text-3xl font-bold text-green-900">
            {formatCurrency(earnings.totalBalance)}
          </p>
          <p className="text-xs text-green-600 mt-2">Available for withdrawal</p>
        </div>

        {/* Earnings Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Breakdown by Source:</p>

          {/* Lecturer: Submission Revenue */}
          {userRole === 'lecturer' && earnings.submissionRevenue !== undefined && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Assignment/Test Revenue</p>
                  <p className="text-xs text-blue-700">From student submissions</p>
                </div>
              </div>
              <p className="font-semibold text-blue-900">
                {formatCurrency(earnings.submissionRevenue)}
              </p>
            </div>
          )}

          {/* Partner: Lecturer Referrals */}
          {userRole === 'partner' && earnings.lecturerReferrals !== undefined && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Lecturer Referrals</p>
                  <p className="text-xs text-purple-700">Commission from referrals</p>
                </div>
              </div>
              <p className="font-semibold text-purple-900">
                {formatCurrency(earnings.lecturerReferrals)}
              </p>
            </div>
          )}

          {/* Everyone: Bundle Commissions */}
          {earnings.bundleCommissions !== undefined && earnings.bundleCommissions > 0 && (
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Bundle Commissions</p>
                  <p className="text-xs text-amber-700">From referral purchases</p>
                </div>
              </div>
              <p className="font-semibold text-amber-900">
                {formatCurrency(earnings.bundleCommissions)}
              </p>
            </div>
          )}

          {/* Empty state if no earnings */}
          {(!earnings.submissionRevenue ||
            earnings.submissionRevenue === 0) &&
            (!earnings.lecturerReferrals ||
              earnings.lecturerReferrals === 0) &&
            (!earnings.bundleCommissions || earnings.bundleCommissions === 0) && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  No earnings yet. {userRole === 'lecturer' ? 'Create assignments to earn money.' : 'Share your referral code to start earning.'}
                </p>
              </div>
            )}
        </div>

        {/* Withdraw Button */}
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          asChild
        >
          <Link href="/withdrawals">Withdraw Funds</Link>
        </Button>

        {/* View History Link */}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/earnings-history">View History</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
