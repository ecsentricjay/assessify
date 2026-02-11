'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Student Payment Success/Callback Page
 * User is redirected here after completing payment at Paystack
 */
export default function StudentPaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get('reference')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [newBalance, setNewBalance] = useState<number | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setStatus('error')
        setMessage('No payment reference provided')
        return
      }

      try {
        // Verify payment with backend
        const response = await fetch(`/api/payments/paystack/verify?reference=${reference}`)
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message || 'Your wallet has been funded successfully!')
          setNewBalance(data.newBalance)
        } else {
          setStatus('error')
          setMessage(data.message || 'Payment verification failed')
        }
      } catch (error) {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      }
    }

    verifyPayment()
  }, [reference])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
              <p className="text-gray-600 mb-4">
                Please wait while we verify your payment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              
              {newBalance !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">New Wallet Balance</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₦{newBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  asChild 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Link href="/student/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full"
                >
                  <Link href="/student/wallet">
                    View Wallet
                  </Link>
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Reference: {reference}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Verification Failed</h1>
              <p className="text-gray-600 mb-4">{message}</p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-red-700 mb-2">What to do:</p>
                <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
                  <li>Check your email for payment confirmation</li>
                  <li>Your fund may be credited within 5-10 minutes</li>
                  <li>Contact support if payment was deducted but not credited</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  asChild 
                  className="w-full"
                >
                  <Link href="/student/wallet">
                    Back to Wallet
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full"
                >
                  <Link href="/contact">
                    Contact Support
                  </Link>
                </Button>
              </div>

              {reference && (
                <p className="text-xs text-gray-500 mt-4">
                  Reference: {reference}
                </p>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
