// app/admin/finances/transactions/transactions-client.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Search, Download, ArrowDownCircle, ArrowUpCircle, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { exportTransactionsToCSV } from '@/lib/actions/admin-transactions.actions'
import { toast } from 'sonner'
import type { TransactionWithUser } from '@/lib/actions/admin-transactions.actions'

interface TransactionsClientProps {
  initialTransactions: TransactionWithUser[]
  initialTotal: number
  initialFilters: {
    search: string
    type: string
    purpose: string
    startDate?: string
    endDate?: string
    page: number
  }
  purposes: string[]
}

export default function TransactionsClient({
  initialTransactions,
  initialTotal,
  initialFilters,
  purposes
}: TransactionsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialFilters.search)
  const [type, setType] = useState(initialFilters.type)
  const [purpose, setPurpose] = useState(initialFilters.purpose)
  const [startDate, setStartDate] = useState(initialFilters.startDate || '')
  const [endDate, setEndDate] = useState(initialFilters.endDate || '')
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithUser | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type !== 'all') params.set('type', type)
    if (purpose !== 'all') params.set('purpose', purpose)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    router.push(`/admin/finances/transactions?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setType('all')
    setPurpose('all')
    setStartDate('')
    setEndDate('')
    router.push('/admin/finances/transactions')
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportTransactionsToCSV({
        search,
        type: type as any,
        purpose: purpose === 'all' ? undefined : purpose,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      })

      if (result.success && result.csv) {
        // Download CSV
        const blob = new Blob([result.csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename || 'transactions.csv'
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Transactions exported successfully')
      } else {
        toast.error(result.error || 'Failed to export')
      }
    } catch (error) {
      toast.error('An error occurred while exporting')
    } finally {
      setIsExporting(false)
    }
  }

  const viewDetails = (transaction: TransactionWithUser) => {
    setSelectedTransaction(transaction)
    setIsDetailsOpen(true)
  }

  const totalPages = Math.ceil(initialTotal / 20)
  const hasFilters = search || type !== 'all' || purpose !== 'all' || startDate || endDate

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transactions ({initialTotal})</CardTitle>
            <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mt-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reference, user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>

            {/* Purpose Filter */}
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger>
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                {purposes.map(p => (
                  <SelectItem key={p} value={p}>
                    {p.replace(/_/g, ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex gap-2 lg:col-span-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 lg:col-span-3">
              <Button onClick={applyFilters} className="flex-1">Apply Filters</Button>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>Clear</Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {initialTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {initialTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => viewDetails(tx)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-full ${tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'credit' ? (
                        <ArrowDownCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tx.wallets.profiles.first_name} {tx.wallets.profiles.last_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {tx.purpose.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {tx.reference} • {format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status */}
                  <div className="text-right">
                    <p className={`text-lg font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                    </p>
                    <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {tx.status}
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
                Page {initialFilters.page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={initialFilters.page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (search) params.set('search', search)
                    if (type !== 'all') params.set('type', type)
                    if (purpose !== 'all') params.set('purpose', purpose)
                    if (startDate) params.set('startDate', startDate)
                    if (endDate) params.set('endDate', endDate)
                    params.set('page', String(initialFilters.page - 1))
                    router.push(`/admin/finances/transactions?${params.toString()}`)
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={initialFilters.page >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (search) params.set('search', search)
                    if (type !== 'all') params.set('type', type)
                    if (purpose !== 'all') params.set('purpose', purpose)
                    if (startDate) params.set('startDate', startDate)
                    if (endDate) params.set('endDate', endDate)
                    params.set('page', String(initialFilters.page + 1))
                    router.push(`/admin/finances/transactions?${params.toString()}`)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>Reference: {selectedTransaction.reference}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedTransaction.wallets.profiles.first_name} {selectedTransaction.wallets.profiles.last_name}</p>
                  <p className="text-xs text-muted-foreground">ID: {selectedTransaction.wallets.user_id.substring(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className={`text-xl font-bold ${selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTransaction.type === 'credit' ? '+' : '-'}₦{selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge className={selectedTransaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {selectedTransaction.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{selectedTransaction.status}</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Purpose</p>
                <p className="font-medium">{selectedTransaction.purpose.replace(/_/g, ' ').toUpperCase()}</p>
              </div>

              {selectedTransaction.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedTransaction.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm">{format(new Date(selectedTransaction.created_at), 'MMMM d, yyyy h:mm:ss a')}</p>
              </div>

              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Additional Information</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}