'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, CreditCard } from 'lucide-react'

declare global {
  interface Window {
    PaystackPop: any
  }
}

/**
 * Paystack Payment Button Component
 * Allows users to fund their wallet via Paystack payment gateway
 */
export function PaystackPaymentButton({
  onSuccess,
  onError,
  className = '',
  variant = 'default',
  size = 'default',
}: {
  onSuccess?: (newBalance: number) => void
  onError?: (error: string) => void
  className?: string
  variant?: any
  size?: any
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const paystackRef = useRef(null)

  // Predefined amounts for quick selection
  const quickAmounts = [1000, 5000, 10000, 25000, 50000]

  /**
   * Validate amount input
   */
  const validateAmount = (): boolean => {
    const amountNum = parseFloat(amount)
    
    if (!amount || isNaN(amountNum)) {
      toast.error('Please enter a valid amount')
      return false
    }
    
    if (amountNum < 100) {
      toast.error('Minimum amount is ₦100')
      return false
    }
    
    if (amountNum > 5000000) {
      toast.error('Maximum amount is ₦5,000,000')
      return false
    }
    
    return true
  }

  /**
   * Load Paystack script
   */
  const loadPaystackScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Paystack script'))
      document.body.appendChild(script)
    })
  }

  /**
   * Handle payment initialization
   */
  const handlePayment = async () => {
    if (!validateAmount()) return

    setIsLoading(true)
    try {
      // Load Paystack script
      await loadPaystackScript()

      // Determine correct callback URL based on current location
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/wallet'
      const callbackPath = currentPath.startsWith('/student/wallet')
        ? '/student/wallet/payment-success'
        : '/wallet/payment-success'
      const callbackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${callbackPath}`

      // Initialize payment with backend
      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          callbackUrl: callbackUrl,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || 'Failed to initialize payment')
        if (onError) onError(data.error || 'Failed to initialize payment')
        setIsLoading(false)
        return
      }

      // Redirect to Paystack checkout
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        toast.error('Failed to get payment authorization URL')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(message)
      if (onError) onError(message)
      setIsLoading(false)
    }
  }

  /**
   * Handle quick amount selection
   */
  const handleQuickAmount = (selectedAmount: number) => {
    setAmount(selectedAmount.toString())
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Fund Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund Your Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet to submit assignments and take tests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Amount (NGN)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ₦
                </span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="100"
                  max="5000000"
                  step="100"
                  className="pl-7"
                  disabled={isLoading}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Min: ₦100 • Max: ₦5,000,000
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Select</label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  type="button"
                  variant={amount === qa.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickAmount(qa)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  ₦{qa.toLocaleString('en-NG')}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p>
              <span className="font-semibold">How it works:</span>
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
              <li>Enter the amount you want to add</li>
              <li>Click "Pay with Paystack"</li>
              <li>Complete payment securely</li>
              <li>Your wallet will be credited immediately</li>
            </ol>
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-semibold mb-2">Payment Methods</p>
            <div className="text-xs space-y-1 text-gray-700">
              <p>✓ Debit/Credit Card (Visa, Mastercard, Verve)</p>
              <p>✓ Bank Transfer</p>
              <p>✓ Mobile Money (MTN, Airtel, GLO)</p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handlePayment}
            disabled={!amount || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Processing...' : 'Pay with Paystack'}
          </Button>

          {/* Security Note */}
          <p className="text-xs text-center text-gray-500">
            Secure payment processing powered by Paystack
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PaystackPaymentButton
