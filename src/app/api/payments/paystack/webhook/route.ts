// app/api/payments/paystack/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validatePaystackWebhookSignature } from '@/lib/services/paystack.service'
import { handlePaystackWebhook } from '@/lib/actions/payment.actions'

/**
 * POST /api/payments/paystack/webhook
 * Webhook endpoint for Paystack events
 * 
 * Paystack will POST to this endpoint when events occur:
 * - charge.success: Payment successful
 * - charge.failed: Payment failed
 * - etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    
    // Get signature from headers
    const signature = request.headers.get('x-paystack-signature')
    
    if (!signature) {
      console.log('No webhook signature provided')
      return NextResponse.json(
        { success: false, message: 'No signature provided' },
        { status: 400 }
      )
    }

    // Validate signature
    const isValid = validatePaystackWebhookSignature(body, signature)
    
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 403 }
      )
    }

    // Parse body
    const event = JSON.parse(body)

    console.log(`Received Paystack webhook event: ${event.event}`, {
      reference: event.data?.reference,
      amount: event.data?.amount,
    })

    // Process webhook
    const result = await handlePaystackWebhook(event)

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook error:', message)
    
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    )
  }
}
