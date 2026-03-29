// app/api/student/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/student/wallet
 * Get student's wallet information
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is a student
    if (user.profile?.role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get wallet information
    const supabase = await createClient()
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If wallet doesn't exist, create one
      if (error.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            total_funded: 0,
            total_spent: 0,
          })
          .select('*')
          .single()

        if (createError) {
          return NextResponse.json(
            { success: false, message: 'Failed to create wallet' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          wallet: {
            balance: newWallet.balance,
            totalFunded: newWallet.total_funded,
            totalSpent: newWallet.total_spent,
          },
        })
      }

      return NextResponse.json(
        { success: false, message: 'Failed to fetch wallet' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        totalFunded: wallet.total_funded,
        totalSpent: wallet.total_spent,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Wallet fetch error:', message)
    
    return NextResponse.json(
      { success: false, message: message },
      { status: 500 }
    )
  }
}
