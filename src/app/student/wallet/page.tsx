'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getPaymentHistory } from '@/lib/actions/payment.actions'
import { PaystackPaymentButton } from '@/components/paystack-payment-button'
import { Card } from '@/components/ui/card'
import { Loader2, Wallet, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface User {
  id: string
  email?: string
  profile: {
    first_name: string
    last_name: string
  }
}

interface WalletInfo {
  balance: number
  totalFunded: number
  totalSpent: number
}

interface Payment {
  id: string
  reference: string
  amount: number
  status: string
  created_at: string
  description: string
  type?: 'debit' | 'credit'
  purpose?: string
}

/**
 * Student Wallet Page
 * Allows students to view and manage their wallet balance
 */
export default function StudentWalletPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/auth/login')
          return
        }

        // Check if user is a student
        if (currentUser.profile?.role !== 'student') {
          router.push('/')
          return
        }

        setUser(currentUser)

        // Fetch wallet data
        const response = await fetch('/api/student/wallet')
        if (response.ok) {
          const data = await response.json()
          setWallet(data.wallet)
        }

        // Fetch payment history
        const history = await getPaymentHistory(10)
        if (history.success) {
          setPayments(history.payments)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading wallet data:', error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/dashboard">
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <p className="text-gray-600">
            Manage your wallet balance and payment history
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current Balance */}
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Wallet Balance</h2>
              <Wallet className="w-6 h-6 opacity-80" />
            </div>
            <div className="mb-6">
              <p className="text-4xl font-bold mb-1">
                ₦{(wallet?.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-blue-100 text-sm">
                Available for assignments and tests
              </p>
            </div>
            <PaystackPaymentButton 
              variant="secondary"
              className="w-full bg-white text-blue-600 hover:bg-gray-100"
              onSuccess={(newBalance) => {
                // Update wallet balance
                setWallet(prev => prev ? { ...prev, balance: newBalance } : null)
              }}
            />
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Funded</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{(wallet?.totalFunded || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </Card>

            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{(wallet?.totalSpent || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-6 h-6 text-red-600">📤</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/student/assignments/access" className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Submit Assignment</h3>
                <p className="text-sm text-gray-600">Submit your work now</p>
              </div>
            </Link>
          </Card>

          <Card className="p-4 border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/student/tests" className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Take a Test</h3>
                <p className="text-sm text-gray-600">Answer test questions</p>
              </div>
            </Link>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="border-0 shadow-lg">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Payment History
            </h2>

            {payments.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No payment history yet</p>
                <p className="text-sm text-gray-500">
                  Fund your wallet to get started with assignments and tests
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          Amount
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          Reference
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => {
                        // Determine if it's a credit or debit
                        const isCredit = payment.type === 'credit'
                        const isPayment = payment.purpose === 'payment'
                        const isSubmission = payment.purpose === 'payment' || payment.purpose === 'ai_assignment'
                        
                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.created_at).toLocaleDateString('en-NG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                  {isCredit ? '+' : '-'}₦{Number(payment.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                </span>
                                {isSubmission && (
                                  <span className="text-xs text-gray-500">
                                    ({payment.purpose === 'ai_assignment' ? 'AI Writer' : 'Submission'})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  payment.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : payment.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="max-w-xs truncate">
                                {payment.description || payment.reference || 'N/A'}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Help Info */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">How Your Wallet Works</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>💰 <span className="font-medium">Add funds</span> to submit assignments and take tests</li>
            <li>🔒 <span className="font-medium">Secure payments</span> backed by Paystack</li>
            <li>📊 <span className="font-medium">Track transactions</span> in your payment history</li>
            <li>⚡ <span className="font-medium">Instant processing</span> for most payments</li>
            <li>❓ <span className="font-medium">Questions?</span> <Link href="/help" className="text-blue-600 hover:underline">See help</Link> or <Link href="/contact" className="text-blue-600 hover:underline">contact support</Link></li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
