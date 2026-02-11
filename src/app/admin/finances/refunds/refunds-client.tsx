// app/admin/finances/refunds/refunds-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Search, Plus, Loader2, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { processRefund, searchUsersForRefund } from '@/lib/actions/admin-refunds.actions'
import { toast } from 'sonner'
import type { RefundRecord } from '@/lib/actions/admin-refunds.actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface RefundsClientProps {
  initialRefunds: RefundRecord[]
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialStatus: string
}

export default function RefundsClient({
  initialRefunds,
  initialTotal,
  initialPage,
  initialSearch,
  initialStatus
}: RefundsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Create refund state
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    router.push(`/admin/finances/refunds?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    router.push('/admin/finances/refunds')
  }

  const handleSearchUsers = async () => {
    if (!userSearch.trim()) return
    
    setIsSearching(true)
    try {
      const result = await searchUsersForRefund(userSearch)
      if (result.success) {
        setSearchResults(result.users || [])
      } else {
        toast.error(result.error || 'Failed to search users')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    setSearchResults([])
    setUserSearch('')
  }

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) {
      toast.error('Please select a user')
      return
    }

    const amountValue = parseFloat(amount)
    if (!amountValue || amountValue <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await processRefund({
        user_id: selectedUser.id,
        amount: amountValue,
        reason: reason.trim(),
        refund_type: refundType
      })

      if (result.success) {
        toast.success(result.message)
        setIsCreateOpen(false)
        resetForm()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to process refund')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setUserSearch('')
    setSearchResults([])
    setSelectedUser(null)
    setAmount('')
    setReason('')
    setRefundType('full')
  }

  const totalPages = Math.ceil(initialTotal / 20)
  const hasFilters = search || status !== 'all'

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Refund History ({initialTotal})</CardTitle>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Process Refund
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={applyFilters}>Apply</Button>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>Clear</Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {initialRefunds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No refunds found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {initialRefunds.map((refund) => (
                <div
                  key={refund.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-full bg-red-100">
                      <DollarSign className="h-5 w-5 text-red-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{refund.user.first_name} {refund.user.last_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {refund.refund_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {refund.reason}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Processed by {refund.admin.first_name} {refund.admin.last_name} • {format(new Date(refund.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      ₦{refund.amount.toLocaleString()}
                    </p>
                    <Badge variant={refund.status === 'completed' ? 'default' : 'secondary'}>
                      {refund.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {initialPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={initialPage <= 1}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (search) params.set('search', search)
                    if (status !== 'all') params.set('status', status)
                    params.set('page', String(initialPage - 1))
                    router.push(`/admin/finances/refunds?${params.toString()}`)
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={initialPage >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (search) params.set('search', search)
                    if (status !== 'all') params.set('status', status)
                    params.set('page', String(initialPage + 1))
                    router.push(`/admin/finances/refunds?${params.toString()}`)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Refund Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund money back to a student&apos;s wallet
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRefund} className="space-y-4">
            {/* User Search */}
            {!selectedUser ? (
              <div className="space-y-2">
                <Label>Search User</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSearchUsers()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleSearchUsers} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full p-3 hover:bg-muted/50 text-left transition-colors flex items-center gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {`${user.first_name[0]}${user.last_name[0]}`.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.role} • ID: {user.id.substring(0, 8)}...
                          </p>
                        </div>
                        {user.wallets?.[0] && (
                          <Badge variant="outline">₦{user.wallets[0].balance.toLocaleString()}</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.role} • ID: {selectedUser.id.substring(0, 12)}...
                    </p>
                    {selectedUser.wallets?.[0] && (
                      <p className="text-sm mt-1">Current Balance: <span className="font-semibold">₦{selectedUser.wallets[0].balance.toLocaleString()}</span></p>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                    Change
                  </Button>
                </div>
              </div>
            )}

            {selectedUser && (
              <>
                {/* Refund Type */}
                <div className="space-y-2">
                  <Label>Refund Type</Label>
                  <RadioGroup value={refundType} onValueChange={(value) => setRefundType(value as 'full' | 'partial')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id="full" />
                      <Label htmlFor="full">Full Refund</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id="partial" />
                      <Label htmlFor="partial">Partial Refund</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Required)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain the reason for this refund..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={3}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedUser} className="bg-red-600 hover:bg-red-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process Refund'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}