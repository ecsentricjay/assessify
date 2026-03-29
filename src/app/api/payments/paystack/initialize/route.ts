// app/api/payments/paystack/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentLink } from '@/lib/actions/payment.actions'

/**
 * POST /api/payments/paystack/initialize
 * Initialize a Paystack payment
 * 
 * Request body:
 * {
 *   amount: number (in NGN)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   authorizationUrl?: string
 *   reference?: string
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, callbackUrl: clientCallbackUrl } = body

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Amount is required and must be a number' },
        { status: 400 }
      )
    }

    // Use provided callback URL or default to /wallet/payment-success
    const callbackUrl = clientCallbackUrl || '/wallet/payment-success'

    // Create payment link
    const result = await createPaymentLink(amount, callbackUrl)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Payment initialization error:', message)
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
