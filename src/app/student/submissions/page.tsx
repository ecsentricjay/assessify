'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Wallet } from 'lucide-react'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getUserSubmissionTransactions } from '@/lib/actions/transaction.actions'
import { getWalletSummary } from '@/lib/actions/wallet.actions'

interface Transaction {
  id: string
  user_id: string
  type: 'credit' | 'debit'
  purpose: string
  amount: number
  balance_before: number
  balance_after: number
  description: string
  status: string
  created_at: string
  reference: string
}

export default function StudentSubmissionsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          setLoading(false)
          return
        }
        setUser(currentUser)

        // Get wallet summary
        const walletResult = await getWalletSummary(currentUser.id)
        if (walletResult.success && walletResult.summary) {
          setWalletBalance(walletResult.summary.currentBalance)
          setTotalSpent(walletResult.summary.totalSpent)
        }

        // Get submission transactions
        const result = await getUserSubmissionTransactions(currentUser.id)
        if (result.success && result.transactions) {
          const txs = result.transactions as Transaction[]
          // Only show student's debit transactions (submissions they made)
          const submissions = txs.filter(tx => tx.type === 'debit' && tx.purpose === 'payment')
          setTransactions(submissions)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading submissions...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-900">Authentication Required</h3>
                  <p className="text-sm text-red-800 mt-1">Please log in to view your submissions.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="text-gray-600 mt-1">Track your assignment and test submissions and spending history</p>
        </div>

        {/* Wallet Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Wallet Balance</CardTitle>
              <Wallet className="h-8 w-8 opacity-75" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm opacity-90">Available Balance</p>
              <p className="text-4xl font-bold mt-1">₦{walletBalance.toLocaleString()}</p>
            </div>
            <div className="pt-3 border-t border-white/20">
              <p className="text-sm opacity-90">Total Spent on Submissions</p>
              <p className="text-2xl font-semibold mt-1">₦{totalSpent.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Submission History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Submission History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Assignment/Test</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount Paid</th>
                    <th className="text-right py-3 px-4 font-semibold">Balance After</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? (
                    transactions.map(tx => (
                      <tr key={tx.id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-3 px-4 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className="bg-blue-100 text-blue-800">
                            {tx.purpose === 'payment' ? 'Submission' : 'Test'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">{tx.description}</td>
                        <td className="py-3 px-4 text-right font-semibold text-red-600">
                          -₦{Number(tx.amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          ₦{Number(tx.balance_after).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tx.status === 'completed' ? (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-600">
                        No submissions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">💡 About Submissions</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Each assignment submission costs an amount set by your lecturer</li>
                  <li>The cost is deducted from your wallet balance immediately</li>
                  <li>You must have enough balance before submitting</li>
                  <li>All transactions are tracked here for your reference</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
