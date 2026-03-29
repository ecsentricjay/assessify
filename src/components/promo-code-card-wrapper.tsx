// Wrapper component that fetches promo code data server-side
// then passes it to the client component for rendering

import { getMyPromoCode, getMyPromoStats } from '@/lib/actions/promo-codes.actions'
import { PromoCodeCardClient } from '@/components/promo-code-card-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function PromoCodeCardServer() {
  try {
    // Fetch data server-side
    const [codeRes, statsRes] = await Promise.all([
      getMyPromoCode(),
      getMyPromoStats(),
    ])

    // Prepare data for client component
    const code = codeRes.success && codeRes.code ? codeRes.code.promo_code : null
    const stats = statsRes.success && statsRes.stats ? statsRes.stats : { totalUses: 0, totalEarnings: 0 }

    return (
      <PromoCodeCardClient code={code} stats={stats} />
    )
  } catch (error) {
    console.error('[PromoCodeCardServer] Error:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Promo Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-2">Unable to load promo code</p>
            <p className="text-xs text-gray-500">Please refresh the page and try again</p>
          </div>
        </CardContent>
      </Card>
    )
  }
}
