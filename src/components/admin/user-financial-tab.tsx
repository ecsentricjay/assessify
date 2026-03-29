// components/admin/user-financial-tab.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Wallet as WalletIcon } from 'lucide-react'
import { WalletAdjustmentModal } from './wallet-adjustment-modal'
import { getUserTransactions } from '@/lib/actions/admin-wallet.actions'
import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface UserFinancialTabProps {
  userId: string
  wallet: any
  userRole: string
}

export function UserFinancialTab({ userId, wallet, userRole }: UserFinancialTabProps) {
  const [adjustmentModal, setAdjustmentModal] = useState<'credit' | 'debit' | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async () => {
    setLoading(true)
    const result = await getUserTransactions(userId, 20)
    if (result.success) {
      setTransactions(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    const loadTransactions = async () => {
      await fetchTransactions()
    }
    loadTransactions()
  }, [userId])

  const handleAdjustmentSuccess = () => {
    fetchTransactions()
    setAdjustmentModal(null)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              Wallet Balance
            </CardTitle>
            <CardDescription>Current available balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-blue-600">
                ₦{wallet?.balance?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">Available Balance</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg font-semibold">
                  ₦{wallet?.total_funded?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500">Total Funded</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  ₦{wallet?.total_spent?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                variant="outline"
                className="text-green-600 hover:text-green-700"
                onClick={() => setAdjustmentModal('credit')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Funds
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => setAdjustmentModal('debit')}
                disabled={!wallet || wallet.balance <= 0}
              >
                <Minus className="h-4 w-4 mr-2" />
                Deduct Funds
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent wallet transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No transactions yet</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'credit' ? 'default' : 'secondary'}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {tx.purpose.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          ₦{tx.balance_after.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tx.status}
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

      {/* Wallet Adjustment Modals */}
      <WalletAdjustmentModal
        open={adjustmentModal === 'credit'}
        onClose={() => setAdjustmentModal(null)}
        onSuccess={handleAdjustmentSuccess}
        userId={userId}
        type="credit"
        currentBalance={wallet?.balance || 0}
      />

      <WalletAdjustmentModal
        open={adjustmentModal === 'debit'}
        onClose={() => setAdjustmentModal(null)}
        onSuccess={handleAdjustmentSuccess}
        userId={userId}
        type="debit"
        currentBalance={wallet?.balance || 0}
      />
    </>
  )
}