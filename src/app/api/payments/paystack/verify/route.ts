// app/api/payments/paystack/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentAndCreditWallet } from '@/lib/actions/payment.actions'

/**
 * GET /api/payments/paystack/verify?reference=ASS-xxxx-xxxx
 * Verification endpoint called after user completes payment at Paystack
 * 
 * This endpoint:
 * 1. Verifies the payment with Paystack
 * 2. Credits the user's wallet
 * 3. Returns success/error status
 */
export async function GET(request: NextRequest) {
  try {
    // Get reference from query params
    const reference = request.nextUrl.searchParams.get('reference')
    
    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Payment reference is required' },
        { status: 400 }
      )
    }

    // Verify payment and credit wallet
    const result = await verifyPaymentAndCreditWallet(reference)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      walletId: result.walletId,
      newBalance: result.newBalance,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Verification endpoint error:', message)
    
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    )
  }
}
