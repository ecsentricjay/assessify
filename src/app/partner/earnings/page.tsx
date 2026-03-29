// app/partner/earnings/page.tsx
export const dynamic = 'force-dynamic'

import { getMyEarnings, getPartnerEarningsSummary } from '@/lib/actions/partner-earnings.actions'
import { getMyPartnerProfile } from '@/lib/actions/partner.actions'
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
import { DollarSign, FileText, ClipboardCheck, TrendingUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function PartnerEarningsPage() {
  const profileResult = await getMyPartnerProfile()
  const partner = profileResult.data

  if (!partner) {
    return <div>Partner not found</div>
  }

  const earningsResult = await getMyEarnings({
    limit: 100,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const earnings = earningsResult.data?.data || []

  // Get summary for different periods
  const todaySummary = await getPartnerEarningsSummary(partner.id, 'today')
  const weekSummary = await getPartnerEarningsSummary(partner.id, 'week')
  const monthSummary = await getPartnerEarningsSummary(partner.id, 'month')
  const allSummary = await getPartnerEarningsSummary(partner.id, 'all')

  const getSourceIcon = (sourceType: string) => {
    if (sourceType === 'assignment_submission') {
      return <FileText className="h-4 w-4 text-blue-600" />
    }
    return <ClipboardCheck className="h-4 w-4 text-green-600" />
  }

  const getSourceLabel = (sourceType: string) => {
    return sourceType === 'assignment_submission' ? 'Assignment' : 'Test'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Earnings</h1>
        <p className="text-muted-foreground mt-1">
          Track your commission earnings
        </p>
      </div>

      {/* Period Stats Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  ₦{(todaySummary.data?.total || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ₦{(todaySummary.data?.pending || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{todaySummary.data?.count || 0}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="week">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  ₦{(weekSummary.data?.total || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ₦{(weekSummary.data?.pending || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{weekSummary.data?.count || 0}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="month">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  ₦{(monthSummary.data?.total || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ₦{(monthSummary.data?.pending || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{monthSummary.data?.count || 0}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  ₦{(allSummary.data?.total || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ₦{(allSummary.data?.pending || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{allSummary.data?.count || 0}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Earnings</CardTitle>
          <CardDescription>Complete history of your commissions</CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No earnings yet</p>
              <p className="text-sm mt-1">Earnings will appear when your referred lecturers receive submissions</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Submission Fee</TableHead>
                    <TableHead className="text-right">Commission Rate</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((earning) => (
                    <TableRow key={earning.id}>
                      <TableCell className="text-sm">
                        {earning.created_at ? new Date(earning.created_at).toLocaleDateString() : 'N/A'}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {earning.created_at ? new Date(earning.created_at).toLocaleTimeString() : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSourceIcon(earning.source_type)}
                          <span className="text-sm">{getSourceLabel(earning.source_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{Number(earning.source_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{earning.commission_rate}%</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ₦{Number(earning.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={earning.status === 'pending' ? 'secondary' : 'default'}
                          className="capitalize"
                        >
                          {earning.status}
                        </Badge>
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