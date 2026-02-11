// app/admin/finances/withdrawals/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { getWithdrawalRequests } from '@/lib/actions/admin-financial.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, CheckCircle, XCircle, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { WithdrawalActionModal } from '@/components/admin/withdrawal-action-modal'
import { toast } from 'sonner'

export default function WithdrawalsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionModal, setActionModal] = useState<{
    open: boolean
    type: 'approve' | 'reject' | 'paid'
    request: any
  } | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const result = await getWithdrawalRequests({
        status,
        page,
        limit: 20
      })

      if (result.success && result.data) {
        setRequests(result.data.requests)
        setTotalPages(result.data.totalPages)
        setTotal(result.data.total)
      } else {
        toast.error(result.error || 'Failed to fetch requests')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [status, page])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      pending: { variant: 'secondary', color: 'bg-yellow-100 text-yellow-700' },
      approved: { variant: 'default', color: 'bg-blue-100 text-blue-700' },
      rejected: { variant: 'secondary', color: 'bg-red-100 text-red-700' },
      paid: { variant: 'default', color: 'bg-green-100 text-green-700' }
    }
    
    const { color } = variants[status] || variants.pending
    
    return (
      <Badge className={color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleActionComplete = () => {
    setActionModal(null)
    fetchRequests()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Link href="/admin/finances">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finances
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Review and process lecturer payouts</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Showing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{requests.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Current Page</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{page} / {totalPages}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Filter Active</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{status !== 'all' ? 'Yes' : 'No'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Requests List */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Loading withdrawal requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No withdrawal requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        {/* Lecturer Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                              {request.lecturer?.first_name?.[0]}{request.lecturer?.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {request.lecturer?.first_name} {request.lecturer?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">Lecturer ID: {request.lecturer_id.slice(0, 8)}...</p>
                            </div>
                          </div>

                          {/* Request Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-500">Amount</p>
                              <p className="font-semibold text-lg">₦{request.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Bank</p>
                              <p className="font-medium">{request.bank_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Account Number</p>
                              <p className="font-medium">{request.account_number}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Account Name</p>
                              <p className="font-medium">{request.account_name}</p>
                            </div>
                          </div>

                          {/* Request Notes */}
                          {request.request_notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <p className="text-gray-500 text-xs">Request Notes:</p>
                              <p className="text-gray-700">{request.request_notes}</p>
                            </div>
                          )}

                          {/* Review Notes */}
                          {request.review_notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                              <p className="text-gray-500 text-xs">Admin Notes:</p>
                              <p className="text-gray-700">{request.review_notes}</p>
                              {request.reviewed_by_admin && (
                                <p className="text-xs text-gray-500 mt-1">
                                  By {request.reviewed_by_admin.first_name} {request.reviewed_by_admin.last_name}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Payment Reference */}
                          {request.payment_reference && (
                            <div className="mt-3 p-3 bg-green-50 rounded text-sm">
                              <p className="text-gray-500 text-xs">Payment Reference:</p>
                              <p className="font-mono font-medium">{request.payment_reference}</p>
                            </div>
                          )}

                          <p className="text-xs text-gray-400 mt-3">
                            Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col items-end gap-2 ml-4">
                          {getStatusBadge(request.status)}
                          
                          {request.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => setActionModal({ open: true, type: 'approve', request })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setActionModal({ open: true, type: 'reject', request })}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {request.status === 'approved' && (
                            <Button
                              size="sm"
                              className="mt-2 bg-green-600 hover:bg-green-700"
                              onClick={() => setActionModal({ open: true, type: 'paid', request })}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Mark as Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} requests
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      {actionModal && (
        <WithdrawalActionModal
          open={actionModal.open}
          onClose={() => setActionModal(null)}
          onSuccess={handleActionComplete}
          type={actionModal.type}
          request={actionModal.request}
        />
      )}
    </div>
  )
}