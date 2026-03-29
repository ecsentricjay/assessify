import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getMyStudentWithdrawals } from '@/lib/actions/student-withdrawals.actions'
import { AlertCircle, ChevronRight, FilterX } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function StudentWithdrawalsPage() {
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
          <p>Only students can view withdrawal history</p>
        </div>
      </div>
    )
  }

  // Get withdrawals
  const withdrawalsResult = await getMyStudentWithdrawals({
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 50,
  })

  const withdrawals = withdrawalsResult.data?.data || []
  const total = withdrawalsResult.data?.total || 0

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-slate-100 text-slate-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Withdrawal Requests</h1>
          <p className="text-slate-600">View and manage your withdrawal requests</p>
        </div>
        <Link href="/student/wallet/withdrawals/create">
          <Button className="bg-blue-600 hover:bg-blue-700">Request Withdrawal</Button>
        </Link>
      </div>

      {/* Withdrawals List */}
      {withdrawals.length > 0 ? (
        <div className="space-y-4">
          {withdrawals.map((withdrawal: any) => (
            <Card key={withdrawal.id} className="border-slate-200 hover:border-slate-300 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Left Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">₦{Number(withdrawal.amount).toLocaleString()}</p>
                        <p className="text-sm text-slate-600">{withdrawal.bank_name}</p>
                      </div>
                      <Badge className={getStatusColor(withdrawal.status)}>
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Account: {withdrawal.account_name}</p>
                      <p>Number: {withdrawal.account_number.slice(-4).padStart(10, '*')}</p>
                    </div>

                    <p className="text-xs text-slate-500">
                      {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    {withdrawal.request_notes && (
                      <p className="text-sm italic text-slate-600">Note: {withdrawal.request_notes}</p>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center">
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More Info */}
          {withdrawals.length < total && (
            <p className="text-center text-sm text-slate-600">
              Showing {withdrawals.length} of {total} withdrawal requests
            </p>
          )}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <FilterX className="h-12 w-12 text-slate-400" />
            <div className="text-center space-y-2">
              <p className="font-semibold text-slate-900">No Withdrawal Requests Yet</p>
              <p className="text-sm text-slate-600">Start earning and request your first withdrawal</p>
            </div>
            <Link href="/student/wallet/withdrawals/create">
              <Button className="bg-blue-600 hover:bg-blue-700">Make First Request</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-base">Withdrawal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>
            <span className="font-semibold">Pending:</span> Your withdrawal request is being reviewed
          </p>
          <p>
            <span className="font-semibold">Approved:</span> Your request has been approved and is being processed
          </p>
          <p>
            <span className="font-semibold">Paid:</span> Your withdrawal has been successfully transferred
          </p>
          <p>
            <span className="font-semibold">Rejected:</span> Your request was declined. Contact support for details
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
