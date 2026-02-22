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
import { Users, TrendingUp, DollarSign, FileText, ClipboardCheck } from 'lucide-react'

interface ReferralWithBreakdown {
  id: string
  referral_code?: string
  status?: string
  total_submissions?: number
  total_revenue?: number
  partner_earnings?: number
  assignment_submissions?: number
  test_submissions?: number
  assignment_revenue?: number
  test_revenue?: number
  created_at?: string
  lecturer?: {
    full_name?: string
    email?: string
    department?: string
    faculty?: string
  }
}

export default async function PartnerReferralsPage() {
  const result = await getMyReferrals({
    limit: 100,
    sortBy: 'partner_earnings',
    sortOrder: 'desc',
  })

  const referrals = (result.data?.data || []) as ReferralWithBreakdown[]
  

  // Calculate totals
  const totalSubmissions = referrals.reduce((sum, r) => sum + (r.total_submissions ?? 0), 0)
  const totalRevenue = referrals.reduce((sum, r) => sum + Number(r.total_revenue), 0)
  const totalEarnings = referrals.reduce((sum, r) => sum + Number(r.partner_earnings), 0)
  
  // ✅ NEW: Calculate breakdown by type
  const assignmentSubmissions = referrals.reduce((sum, r) => sum + (r.assignment_submissions ?? 0), 0)
  const testSubmissions = referrals.reduce((sum, r) => sum + (r.test_submissions ?? 0), 0)
  const assignmentRevenue = referrals.reduce((sum, r) => sum + Number(r.assignment_revenue ?? 0), 0)
  const testRevenue = referrals.reduce((sum, r) => sum + Number(r.test_revenue ?? 0), 0)

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
      <div className="grid gap-4 md:grid-cols-4">
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

        {/* ✅ NEW: Assignment Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignmentSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              ₦{assignmentRevenue.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>

        {/* ✅ NEW: Test Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{testSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              ₦{testRevenue.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Summary Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Your Total Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">
            ₦{totalEarnings.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            15% commission from all referral submissions
          </p>
        </CardContent>
      </Card>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Referrals</CardTitle>
          <CardDescription>
            Complete list of lecturers you&apos;ve referred with submission breakdown
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lecturer</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Assignments</TableHead>
                    <TableHead className="text-center">Tests</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
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
                      
                      {/* ✅ NEW: Assignment Submissions Column */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-blue-600">
                            {referral.assignment_submissions || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ₦{Number(referral.assignment_revenue || 0).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>

                      {/* ✅ NEW: Test Submissions Column */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-purple-600">
                            {referral.test_submissions || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ₦{Number(referral.test_revenue || 0).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>

                      {/* Total Submissions */}
                      <TableCell className="text-right font-bold">
                        {referral.total_submissions || 0}
                      </TableCell>

                      {/* Total Revenue */}
                      <TableCell className="text-right font-medium">
                        ₦{Number(referral.total_revenue || 0).toLocaleString()}
                      </TableCell>

                      {/* Partner Earnings */}
                      <TableCell className="text-right font-bold text-green-600">
                        ₦{Number(referral.partner_earnings || 0).toLocaleString()}
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