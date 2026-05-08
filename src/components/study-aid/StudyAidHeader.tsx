'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  Wallet, 
  Sparkles, 
  History, 
  Upload, 
  ShoppingCart,
  Loader2 
} from 'lucide-react'

interface StudyAidHeaderProps {
  showBalance?: boolean
  showCredits?: boolean
  showNav?: boolean
}

export default function StudyAidHeader({ 
  showBalance = true,
  showCredits = true,
  showNav = true 
}: StudyAidHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [walletBalance, setWalletBalance] = useState(0)
  const [credits, setCredits] = useState({
    freeRemaining: 0,
    paidRemaining: 0,
    loading: true,
  })

  useEffect(() => {
    if (showBalance || showCredits) {
      loadData()
    }
  }, [showBalance, showCredits])

  async function loadData() {
    try {
      // Load wallet balance
      if (showBalance) {
        const walletResponse = await fetch('/api/wallet/balance')
        if (walletResponse.ok) {
          const walletData = await walletResponse.json()
          if (walletData.success) {
            setWalletBalance(walletData.balance || 0)
          }
        }
      }

      // Load credits
      if (showCredits) {
        const creditsResponse = await fetch('/api/study-aid/credits')
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          if (creditsData.success) {
            setCredits({
              freeRemaining: creditsData.freeRemaining || 0,
              paidRemaining: creditsData.paidRemaining || 0,
              loading: false,
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to load header data:', error)
      setCredits(prev => ({ ...prev, loading: false }))
    }
  }

  const totalRemaining = credits.freeRemaining + credits.paidRemaining

  const navItems = [
    { 
      label: 'Upload', 
      icon: Upload, 
      path: '/student/study-aid',
      active: pathname === '/student/study-aid'
    },
    { 
      label: 'History', 
      icon: History, 
      path: '/student/study-aid/history',
      active: pathname?.startsWith('/student/study-aid/history') || pathname?.startsWith('/student/study-aid/attempt')
    },
    { 
      label: 'Purchase', 
      icon: ShoppingCart, 
      path: '/student/study-aid/purchase',
      active: pathname === '/student/study-aid/purchase'
    },
  ]

  return (
    <div className="bg-gradient-to-r from-[#2E3192] via-[#3F51B5] to-[#2E3192] border-b border-white/10">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4 flex-wrap gap-4">
          {/* Logo & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/student/study-aid')}
          >
            <Image
              src="/images/logo/assessify-logo-icon.png"
              alt="Assessify"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white">AI Study Aid</h1>
              <p className="text-xs text-blue-200">Powered by Assessify</p>
            </div>
          </div>

          {/* Balance & Credits */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Wallet Balance */}
            {showBalance && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#4FC3F7]" />
                <div>
                  <p className="text-xs text-blue-200">Wallet</p>
                  <p className="text-sm font-bold text-white">
                    ₦{walletBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Credits */}
            {showCredits && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2EC4B6]" />
                <div>
                  <p className="text-xs text-blue-200">Attempts</p>
                  {credits.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <p className="text-sm font-bold text-white">
                      {totalRemaining} 
                      <span className="text-xs text-blue-200 ml-1">
                        ({credits.freeRemaining}F, {credits.paidRemaining}P)
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        {showNav && (
          <div className="flex items-center gap-2 pb-4 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                    item.active
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}