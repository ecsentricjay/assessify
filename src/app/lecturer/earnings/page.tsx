'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp, Download, Eye, EyeOff } from 'lucide-react'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getUserSubmissionTransactions } from '@/lib/actions/transaction.actions'
import { getWalletSummary } from '@/lib/actions/wallet.actions'
import Link from 'next/link'

interface Transaction {
  id: string
  wallet_id: string
  type: 'credit' | 'debit'
  purpose: string
  amount: number
  balance_before: number
  balance_after: number
  description: string
  status: string
  created_at: string
  reference: string
  metadata?: any
}

export default function LecturerEarningsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [showBalance, setShowBalance] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [submissionEarnings, setSubmissionEarnings] = useState(0)
  const [testEarnings, setTestEarnings] = useState(0)
  const [filter, setFilter] = useState<'all' | 'submission' | 'test'>('all')

  useEffect(() => {
    async function loadData() {
      try {
        console.log('📊 Loading earnings data...')
        
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          console.error('❌ No user found')
          setLoading(false)
          return
        }
        console.log('✅ User loaded:', currentUser.id)
        setUser(currentUser)

        const walletResult = await getWalletSummary(currentUser.id)
        console.log('💰 Wallet result:', walletResult)
        
        if (walletResult.success && walletResult.summary) {
          setWalletBalance(walletResult.summary.currentBalance)
          console.log('✅ Wallet balance:', walletResult.summary.currentBalance)
        }

        const result = await getUserSubmissionTransactions(currentUser.id)
        console.log('📋 Transactions result:', result)
        
        if (result.success && result.transactions) {
          const txs = result.transactions as Transaction[]
          setTransactions(txs)
          console.log('✅ Loaded', txs.length, 'transactions')

          let total = 0
          let submission = 0
          let test = 0

          txs.forEach(tx => {
            if (tx.type === 'credit') {
              const amount = Number(tx.amount)
              total += amount
              
              if (tx.purpose === 'assignment_payment') {
                submission += amount
              } else if (tx.purpose === 'test_payment') {
                test += amount
              }
              
              console.log(`Transaction: ${tx.purpose} = ₦${amount}`)
            }
          })

          console.log('💵 Total earnings:', total)
          console.log('📝 Submission earnings:', submission)
          console.log('✅ Test earnings:', test)

          setTotalEarnings(total)
          setSubmissionEarnings(submission)
          setTestEarnings(test)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredTransactions = transactions.filter(tx => {
    if (tx.type !== 'credit') return false
    if (filter === 'all') return true
    if (filter === 'submission') return tx.purpose === 'assignment_payment'
    if (filter === 'test') return tx.purpose === 'test_payment'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading earnings...</p>
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
                  <p className="text-sm text-red-800 mt-1">Please log in to view your earnings.</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your earnings from assignments and tests</p>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Wallet Balance Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
          <CardHeader>
            <CardTitle className="text-lg">Available Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Current Wallet Balance</p>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-5xl font-bold">
                    {showBalance ? `₦${walletBalance.toLocaleString()}` : '••••••'}
                  </p>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="opacity-75 hover:opacity-100"
                  >
                    {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <TrendingUp className="h-16 w-16 opacity-20" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button asChild className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href="/lecturer/withdrawals">
                  Withdraw
                </Link>
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-blue-600" disabled>
                View Transactions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">₦{totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-2">Across all sources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Assignment Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600">₦{submissionEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-2">From student submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Test Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600">₦{testEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-2">From test attempts</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Earnings Breakdown</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'submission' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('submission')}
                >
                  Assignments
                </Button>
                <Button
                  variant={filter === 'test' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('test')}
                >
                  Tests
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Source</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold">Balance</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-3 px-4">
                          {new Date(tx.created_at).toLocaleDateString()} {' '}
                          <span className="text-gray-500">
                            {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            tx.purpose === 'assignment_payment'
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }>
                            {tx.purpose === 'assignment_payment' ? 'Assignment' : 'Test'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{tx.description}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          +₦{(Number(tx.amount)).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          ₦{(Number(tx.balance_after)).toLocaleString()}
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
                        No earnings found for this filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/lecturer/withdrawals/create">
                  Request Withdrawal
                </Link>
              </Button>
              <Link href="/lecturer/assignments" className="w-full">
                <Button variant="outline" className="w-full">
                  View Assignments
                </Button>
              </Link>
              <Link href="/lecturer/dashboard" className="w-full">
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">💡 How Earnings Work</p>
                <ul className="list-disc list-inside space-y-1 ml-0">
                  <li>You earn <strong>35%</strong> of submission costs from your assignments</li>
                  <li>The platform takes the remaining percentage</li>
                  <li>Earnings are credited instantly when students submit</li>
              <li>You can withdraw your balance anytime via the Withdrawals page</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}