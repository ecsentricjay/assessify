'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getPaymentHistory } from '@/lib/actions/payment.actions'
import { PaystackPaymentButton } from '@/components/paystack-payment-button'
import { Card } from '@/components/ui/card'
import { Loader2, Wallet, TrendingUp, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
}

interface Payment {
  id: string
  reference: string
  amount: number
  status: string
  created_at: string
  description: string
}

/**
 * Wallet Funding Page
 * Allows users to view and manage their wallet balance
 */
export default function WalletPage() {
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
        setUser(currentUser)

        // Fetch wallet data (this would be from an actual endpoint)
        // For now, we'll load payment history
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
      <div className="min-h-screen flex items-center justify-center">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
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
            <div className="mb-4">
              <p className="text-3xl font-bold mb-1">
                ₦0.00
              </p>
              <p className="text-blue-100 text-sm">
                Available for assignments and tests
              </p>
            </div>
            <PaystackPaymentButton 
              variant="secondary"
              className="w-full bg-white text-blue-600 hover:bg-gray-100"
              onSuccess={(newBalance) => {
                // Reload page to show new balance
                window.location.reload()
              }}
            />
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Funded</p>
                  <p className="text-2xl font-bold text-gray-900">₦0.00</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </Card>

            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">₦0.00</p>
                </div>
                <div className="w-6 h-6 text-red-600">📤</div>
              </div>
            </Card>
          </div>
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
              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-4 gap-4 pb-3 border-b font-semibold text-sm text-gray-700">
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div>Reference</div>
                </div>

                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid sm:grid-cols-4 gap-4 py-3 px-2 border-b text-sm hover:bg-gray-50 rounded"
                  >
                    <div className="text-gray-900">
                      {new Date(payment.created_at).toLocaleDateString('en-NG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="font-semibold text-green-600">
                      +₦{payment.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs truncate">
                      {payment.reference}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Help Info */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3">How Wallet Works</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>💰 Add funds to submit assignments and take tests</li>
            <li>🔒 Your wallet is secure and backed by Paystack</li>
            <li>📊 Track all transactions in your payment history</li>
            <li>⚡ Instant processing for most payments</li>
            <li>❓ <a href="/contact" className="text-blue-600 hover:underline">Contact support</a> if you have questions</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
