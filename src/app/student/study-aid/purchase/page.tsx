'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StudyAidHeader from '@/components/study-aid/StudyAidHeader'
import { Wallet, Sparkles, ArrowRight, Check } from 'lucide-react'

interface PricingTier {
  attempts: number
  price: number
  pricePerAttempt: number
  savings?: number
  popular?: boolean
}

const PRICING_TIERS: PricingTier[] = [
  {
    attempts: 1,
    price: 500,
    pricePerAttempt: 500,
  },
  {
    attempts: 5,
    price: 2000,
    pricePerAttempt: 400,
    savings: 500,
    popular: true,
  },
  {
    attempts: 10,
    price: 3500,
    pricePerAttempt: 350,
    savings: 1500,
  },
]

export default function StudyAidPurchasePage() {
  const router = useRouter()
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<number | null>(null)
  const [credits, setCredits] = useState({
    freeRemaining: 0,
    paidRemaining: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      
      // Fetch wallet balance
      const walletResponse = await fetch('/api/wallet/balance')
      
      if (!walletResponse.ok) {
        throw new Error(`Wallet API error: ${walletResponse.status}`)
      }
      
      const walletData = await walletResponse.json()
      
      if (walletData.success) {
        setWalletBalance(walletData.balance || 0)
      } else {
        throw new Error(walletData.error || 'Failed to load wallet')
      }

      // Fetch credits
      const creditsResponse = await fetch('/api/study-aid/credits')
      
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json()
        
        if (creditsData.success) {
          setCredits({
            freeRemaining: creditsData.freeRemaining || 0,
            paidRemaining: creditsData.paidRemaining || 0,
          })
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Failed to load wallet balance. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePurchase(tier: PricingTier) {
    if (walletBalance < tier.price) {
      if (confirm('Insufficient wallet balance. Would you like to fund your wallet?')) {
        router.push('/student/wallet')
      }
      return
    }

    setPurchasing(tier.attempts)

    try {
      const response = await fetch('/api/study-aid/purchase-from-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempts: tier.attempts,
          amount: tier.price,
          packageName: `${tier.attempts} Attempt${tier.attempts !== 1 ? 's' : ''}`,
        }),
      })

      if (!response.ok) {
        throw new Error(`Purchase failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        alert(`✅ Successfully purchased ${tier.attempts} attempt${tier.attempts !== 1 ? 's' : ''}!`)
        await loadData() // Reload balances
        router.push('/student/study-aid')
      } else {
        alert(data.error || 'Purchase failed')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <>
        <StudyAidHeader />
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-gradient-to-br from-[#2E3192] via-[#3F51B5] to-[#2E3192]">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <StudyAidHeader />
      <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-[#2E3192] via-[#3F51B5] to-[#2E3192] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#4FC3F7] rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#2EC4B6] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Purchase Study Attempts
            </h1>
            <p className="text-purple-200 text-lg">
              Choose a package and continue practicing
            </p>
          </div>

          {/* Wallet Balance Card */}
          <div className="mb-12">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-600/50 p-4 rounded-full">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-purple-200 text-sm mb-1">Your Wallet Balance</p>
                    <p className="text-4xl font-bold text-white">
                      ₦{walletBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/student/wallet')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:scale-105 transition text-white"
                >
                  Fund Wallet
                </button>
              </div>
            </div>
          </div>

          {/* Current Credits */}
          <div className="mb-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <p className="text-purple-200 text-center">
                You currently have{' '}
                <span className="font-bold text-white">
                  {credits.freeRemaining + credits.paidRemaining}
                </span>{' '}
                attempt{credits.freeRemaining + credits.paidRemaining !== 1 ? 's' : ''} remaining
                {' '}({credits.freeRemaining} free, {credits.paidRemaining} paid)
              </p>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {PRICING_TIERS.map((tier) => (
            <div
              key={tier.attempts}
              className={`relative bg-white/10 backdrop-blur-xl border-2 rounded-2xl p-8 transition hover:scale-105 ${
                tier.popular
                  ? 'border-pink-400 bg-gradient-to-b from-pink-500/20 to-purple-500/20'
                  : 'border-white/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/50 rounded-full mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.attempts} Attempt{tier.attempts !== 1 ? 's' : ''}
                </h3>
                <div className="text-5xl font-bold text-white mb-2">
                  ₦{tier.price.toLocaleString()}
                </div>
                <p className="text-purple-300 text-sm">
                  ₦{tier.pricePerAttempt} per attempt
                </p>
                {tier.savings && (
                  <p className="text-green-400 text-sm font-semibold mt-2">
                    Save ₦{tier.savings.toLocaleString()}!
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-purple-200">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>{tier.attempts} AI-generated session{tier.attempts !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-purple-200">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>MCQ or Theory format</span>
                </div>
                <div className="flex items-center gap-2 text-purple-200">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Detailed explanations</span>
                </div>
                <div className="flex items-center gap-2 text-purple-200">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Never expires</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(tier)}
                disabled={purchasing === tier.attempts || walletBalance < tier.price}
                className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                  walletBalance < tier.price
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {purchasing === tier.attempts ? (
                  'Processing...'
                ) : walletBalance < tier.price ? (
                  'Insufficient Balance'
                ) : (
                  'Pay from Wallet'
                )}
              </button>
            </div>
          ))}
          </div>

          {/* Info Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              How it works
            </h3>
            <div className="space-y-2 text-purple-200">
              <p>• Select a package above based on how many attempts you need</p>
              <p>• Payment is deducted instantly from your wallet</p>
              <p>• Attempts are added to your account immediately</p>
              <p>• Use attempts anytime - they never expire</p>
              <p>• Each attempt generates 25 MCQs or 10 theory questions with detailed answers</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}