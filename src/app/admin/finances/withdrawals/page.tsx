// src/app/admin/finances/withdrawals/page.tsx
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { getAllLecturerWithdrawals } from '@/lib/actions/lecturer-withdrawals.actions'
import { getAllPartnerWithdrawals } from '@/lib/actions/partner-withdrawals.actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import WithdrawalsTable from '@/components/admin/withdrawals-table'
import { Skeleton } from '@/components/ui/skeleton'

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || 'lecturers'
  const statusFilter = params.status || 'all'

  // Fetch withdrawals
  const [lecturerResult, partnerResult] = await Promise.all([
    getAllLecturerWithdrawals({ 
      status: statusFilter === 'all' ? undefined : statusFilter as any,
      limit: 100 
    }),
    getAllPartnerWithdrawals({ 
      status: statusFilter === 'all' ? undefined : statusFilter as any,
      limit: 100 
    }),
  ])

  const lecturerWithdrawals = lecturerResult.data?.data || []
  const partnerWithdrawals = partnerResult.data?.data || []

  // Calculate stats for lecturers
  const lecturerStats = {
    pending: lecturerWithdrawals.filter(w => w.status === 'pending').length,
    pendingAmount: lecturerWithdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + Number(w.amount), 0),
    approved: lecturerWithdrawals.filter(w => w.status === 'approved').length,
    approvedAmount: lecturerWithdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + Number(w.amount), 0),
    paid: lecturerWithdrawals.filter(w => w.status === 'paid').length,
    paidAmount: lecturerWithdrawals
      .filter(w => w.status === 'paid')
      .reduce((sum, w) => sum + Number(w.amount), 0),
  }

  // Calculate stats for partners
  const partnerStats = {
    pending: partnerWithdrawals.filter(w => w.status === 'pending').length,
    pendingAmount: partnerWithdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + Number(w.amount), 0),
    approved: partnerWithdrawals.filter(w => w.status === 'approved').length,
    approvedAmount: partnerWithdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + Number(w.amount), 0),
    paid: partnerWithdrawals.filter(w => w.status === 'paid').length,
    paidAmount: partnerWithdrawals
      .filter(w => w.status === 'paid')
      .reduce((sum, w) => sum + Number(w.amount), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
        <p className="text-muted-foreground mt-1">
          Review and process withdrawal requests from lecturers and partners
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="lecturers">
            Lecturers {lecturerStats.pending > 0 && (
              <Badge className="ml-2 bg-yellow-500">{lecturerStats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="partners">
            Partners {partnerStats.pending > 0 && (
              <Badge className="ml-2 bg-yellow-500">{partnerStats.pending}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Lecturer Withdrawals Tab */}
        <TabsContent value="lecturers" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {lecturerStats.pending}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{lecturerStats.pendingAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved (Awaiting Payment)</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {lecturerStats.approved}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{lecturerStats.approvedAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {lecturerStats.paid}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{lecturerStats.paidAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lecturer Withdrawals</CardTitle>
              <CardDescription>
                All withdrawal requests from lecturers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TableSkeleton />}>
                <WithdrawalsTable 
                  withdrawals={lecturerWithdrawals}
                  type="lecturer"
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partner Withdrawals Tab */}
        <TabsContent value="partners" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {partnerStats.pending}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{partnerStats.pendingAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved (Awaiting Payment)</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {partnerStats.approved}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{partnerStats.approvedAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {partnerStats.paid}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ₦{partnerStats.paidAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Withdrawals</CardTitle>
              <CardDescription>
                All withdrawal requests from partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TableSkeleton />}>
                <WithdrawalsTable 
                  withdrawals={partnerWithdrawals}
                  type="partner"
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}