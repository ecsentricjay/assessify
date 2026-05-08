// app/api/wallet/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get wallet
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance, total_funded, total_spent')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Wallet doesn't exist yet
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          balance: 0,
          total_funded: 0,
          total_spent: 0,
          wallet_exists: false
        });
      }
      
      throw error;
    }

    return NextResponse.json({
      success: true,
      balance: wallet.balance || 0,
      total_funded: wallet.total_funded || 0,
      total_spent: wallet.total_spent || 0,
      wallet_exists: true
    });
  } catch (error) {
    console.error('[wallet/balance] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch wallet balance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}