// app/partner/referrals/page.tsx
export const dynamic = 'force-dynamic'

import { getMyReferrals } from '@/lib/actions/partner-earnings.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, DollarSign } from 'lucide-react'

export default async function PartnerReferralsPage() {
  const result = await getMyReferrals({
    limit: 100,
    sortBy: 'partner_earnings',
    sortOrder: 'desc',
  })

  const referrals = result.data?.data || []

  // Calculate totals
  const totalSubmissions = referrals.reduce((sum, r) => sum + (r.total_submissions ?? 0), 0)
  const totalRevenue = referrals.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const totalEarnings = referrals.reduce((sum, r) => sum + Number(r.partner_earnings), 0)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary'> = {
      active: 'default',
      pending: 'secondary',
      inactive: 'secondary',
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Referrals</h1>
        <p className="text-muted-foreground mt-1">
          Lecturers you&apos;ve referred to the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lecturers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referrals.length}</div>
            <p className="text-xs text-muted-foreground">
              {referrals.filter(r => r.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              ₦{totalRevenue.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From these referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Referrals</CardTitle>
          <CardDescription>
            Complete list of lecturers you&apos;ve referred
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No referrals yet</p>
              <p className="text-sm mt-1">Share your referral code with lecturers to get started</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lecturer</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                    <TableHead className="text-right">Revenue Generated</TableHead>
                    <TableHead className="text-right">Your Earnings</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.lecturer?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{referral.lecturer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{referral.lecturer?.department}</p>
                          <p className="text-xs text-muted-foreground">{referral.lecturer?.faculty}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.status || 'inactive')}</TableCell>
                      <TableCell className="text-right font-medium">
                        {referral.total_submissions}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{Number(referral.total_revenue).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ₦{Number(referral.partner_earnings).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {referral.created_at ? new Date(referral.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}