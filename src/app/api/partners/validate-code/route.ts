// app/api/partners/validate-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'Code is required' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS policies
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if partner code exists and is active
    const { data: partner, error } = await supabase
      .from('partners')
      .select('id, partner_code, business_name, status')
      .eq('partner_code', code.toUpperCase())
      .eq('status', 'active')
      .single()

    if (error || !partner) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid or inactive referral code',
      })
    }

    // Return partner name for display
    const partnerName = partner.business_name || 'Valid Partner'

    return NextResponse.json({
      valid: true,
      partnerName,
      message: 'Valid referral code',
    })

  } catch (error) {
    console.error('Error validating partner code:', error)
    return NextResponse.json(
      { valid: false, message: 'Failed to validate code' },
      { status: 500 }
    )
  }
}