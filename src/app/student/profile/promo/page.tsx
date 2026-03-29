'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMyPromoCode, getMyPromoStats, getMyPromoEarnings } from '@/lib/actions/promo-codes.actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, TrendingUp, Users, ArrowLeft, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface PromoCode {
  promo_code: string
  total_uses: number
  total_earnings: number
}

interface Earnings {
  id: string
  commission_amount: number
  status: string
  created_at: string
  student?: {
    first_name: string
    last_name: string
  }
  bundle?: {
    bundle_name: string
  }
}

export default function StudentPromoPage() {
  const router = useRouter()
  const [code, setCode] = useState<PromoCode | null>(null)
  const [earnings, setEarnings] = useState<Earnings[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [codeRes, statsRes, earningsRes] = await Promise.all([
        getMyPromoCode(),
        getMyPromoStats(),
        getMyPromoEarnings({ limit: 10 }),
      ])

      if (codeRes.success && codeRes.code) {
        setCode(codeRes.code)
      }

      if (earningsRes.success && earningsRes.earnings) {
        setEarnings(earningsRes.earnings)
      }
    } catch (error) {
      console.error('Failed to load promo data:', error)
      toast.error('Failed to load promo code data')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    if (code?.promo_code) {
      navigator.clipboard.writeText(code.promo_code)
      setCopied(true)
      toast.success('Promo code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function copyLink() {
    if (code?.promo_code && typeof window !== 'undefined') {
      const link = `${window.location.origin}/student/cbt/bundles?ref=${code.promo_code}`
      navigator.clipboard.writeText(link)
      toast.success('Referral link copied!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/student/dashboard" className="text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold">My Promo Code</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/student/dashboard" className="text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">My Promo Code</h1>
            <p className="text-gray-600 mt-1">Share your code with other students and earn commission</p>
          </div>
        </div>

        {/* Main Promo Code Card */}
        {code ? (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Referral Code
              </CardTitle>
              <CardDescription>
                Share this code with other students to earn commission on their CBT bundle purchases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Code Display */}
              <div className="bg-white p-6 rounded-lg border-2 border-blue-300">
                <p className="text-xs text-blue-600 font-medium mb-2 text-center">Share This Code</p>
                <code className="block text-center text-4xl font-mono font-bold text-blue-900 mb-4 tracking-wider">
                  {code.promo_code}
                </code>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={copyCode} className="gap-2" variant={copied ? 'outline' : 'default'}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <Button onClick={copyLink} variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Copy Link
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <Users className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                  <div className="text-3xl font-bold text-gray-900">{code.total_uses || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Times Used</div>
                </div>
                <div className="text-center p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-600" />
                  <div className="text-3xl font-bold text-green-600">
                    ₦{(code.total_earnings || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Earned</div>
                </div>
              </div>

              <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Share this code with classmates on social media, group chats, or WhatsApp to earn more!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg text-gray-600 mb-2">No promo code available</p>
                <p className="text-sm text-gray-500">Try refreshing the page or contact support</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Earnings
              </span>
              {earnings.length > 0 && (
                <Badge variant="outline">{earnings.length} transactions</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Latest commission earnings from your promo code
            </CardDescription>
          </CardHeader>
          <CardContent>
            {earnings.length > 0 ? (
              <div className="space-y-4">
                {earnings.map((earning) => (
                  <div
                    key={earning.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {earning.bundle?.bundle_name || 'Bundle Purchase'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {earning.student?.first_name} {earning.student?.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +₦{earning.commission_amount.toLocaleString()}
                      </p>
                      <Badge
                        variant={
                          earning.status === 'approved'
                            ? 'default'
                            : earning.status === 'paid'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {earning.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No earnings yet</p>
                <p className="text-sm text-gray-500 mt-1">Start sharing your code to earn commission!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
