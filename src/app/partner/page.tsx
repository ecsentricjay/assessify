// app/partner/page.tsx
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { getMyPartnerProfile, getPartnerOverview } from '@/lib/actions/partner.actions'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Wallet,
  ArrowUpRight,
  Copy,
  Share2,
} from 'lucide-react'
import Link from 'next/link'
import ReferralCodeDisplay from '@/components/partner/referral-code-display'
import RecentReferralsList from '@/components/partner/recent-referrals-list'
import RecentEarningsList from '@/components/partner/recent-earnings-list'

export default async function PartnerDashboardPage() {
  const profileResult = await getMyPartnerProfile()

  if (profileResult.error || !profileResult.data) {
    redirect('/')
  }

  const partner = profileResult.data

  // Get full overview
  const overviewResult = await getPartnerOverview(partner.id)
  const overview = overviewResult.data

  const stats = overview?.statistics || {
    total_referrals: 0,
    active_referrals: 0,
    total_submissions: 0,
    total_revenue: 0,
    total_earnings: 0,
    pending_earnings: 0,
    total_withdrawn: 0,
    avg_earnings_per_referral: 0,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Partner Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your referrals and earnings
        </p>
      </div>

      {/* Referral Code Section */}
      <ReferralCodeDisplay partnerCode={partner.partner_code} />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Referrals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_referrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_referrals} active
            </p>
          </CardContent>
        </Card>

        {/* Total Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_submissions}</div>
            <p className="text-xs text-muted-foreground">
              ₦{stats.total_revenue.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{stats.total_earnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {partner.commission_rate}% commission rate
            </p>
          </CardContent>
        </Card>

        {/* Available Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{stats.pending_earnings.toLocaleString()}
            </div>
            <Button size="sm" className="mt-2" asChild>
              <Link href="/partner/withdrawals/create">
                Withdraw
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Referrals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Referrals</CardTitle>
                <CardDescription>
                  Lecturers you&apos;ve referred
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/partner/referrals">
                  View All
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <RecentReferralsList referrals={overview?.recent_referrals || []} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Recent Earnings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Earnings</CardTitle>
                <CardDescription>
                  Your latest commissions
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/partner/earnings">
                  View All
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <RecentEarningsList earnings={overview?.recent_earnings || []} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/partner/referrals">
                <Users className="h-6 w-6 mb-2" />
                <span className="font-medium">View Referrals</span>
                <span className="text-xs text-muted-foreground">
                  {stats.total_referrals} total
                </span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/partner/earnings">
                <TrendingUp className="h-6 w-6 mb-2" />
                <span className="font-medium">View Earnings</span>
                <span className="text-xs text-muted-foreground">
                  ₦{stats.total_earnings.toLocaleString()}
                </span>
              </Link>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/partner/withdrawals/create">
                <Wallet className="h-6 w-6 mb-2" />
                <span className="font-medium">Request Withdrawal</span>
                <span className="text-xs text-muted-foreground">
                  ₦{stats.pending_earnings.toLocaleString()} available
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}