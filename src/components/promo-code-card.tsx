'use client'

import { useEffect, useState } from 'react'
import { getMyPromoCode, getMyPromoStats } from '@/lib/actions/promo-codes.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount)
}

export function PromoCodeCard() {
  const [code, setCode] = useState<string>('')
  const [stats, setStats] = useState({ totalUses: 0, totalEarnings: 0 })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [codeRes, statsRes] = await Promise.all([
        getMyPromoCode(),
        getMyPromoStats(),
      ])

      if (codeRes.success && codeRes.code) {
        setCode(codeRes.code.promo_code)
      }

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats)
      }
    } catch (error) {
      console.error('Failed to load promo code data:', error)
      toast.error('Failed to load promo code')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Promo code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function copyLink() {
    if (code && typeof window !== 'undefined') {
      const link = `${window.location.origin}/student/cbt/bundles?ref=${code}`
      navigator.clipboard.writeText(link)
      toast.success('Referral link copied!')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Promo Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!code) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Promo Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-2">No promo code available</p>
            <p className="text-xs text-gray-500">Contact support to get your promo code</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">My Promo Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Promo Code Display */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 font-medium mb-2 text-center">Your Referral Code</p>
          <code className="block text-center text-3xl font-mono font-bold text-blue-900 mb-1">
            {code}
          </code>
          <p className="text-xs text-blue-600 text-center mb-4">Share with students to earn commission</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={copyCode} size="sm" variant="outline" className="gap-2">
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </Button>
            <Button onClick={copyLink} size="sm" className="gap-2">
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <Users className="w-5 h-5 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalUses}</div>
            <div className="text-xs text-gray-600 mt-1">Total Uses</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalEarnings)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Total Earned</div>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center pt-2">
          Share your referral code and link with students to earn commission on bundle purchases
        </p>
      </CardContent>
    </Card>
  )
}
