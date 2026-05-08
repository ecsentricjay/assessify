// app/api/study-aid/purchase-from-wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

interface PurchaseRequest {
  attempts: number;
  amount: number;
  packageName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json();
    const { attempts, amount, packageName } = body;

    // Validate input
    if (!attempts || attempts <= 0 || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid purchase details' },
        { status: 400 }
      );
    }

    // Validate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (user.profile?.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can purchase attempts' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // 1. Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // 2. Check balance
    if (wallet.balance < amount) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient wallet balance',
          currentBalance: wallet.balance,
          required: amount,
          needsFunding: true
        },
        { status: 400 }
      );
    }

    // 3. Calculate balances
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;
    const reference = `STUDY_${Date.now()}_${user.id.substring(0, 8)}`;

    // 4. Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: 'debit',
        purpose: 'study_aid',
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        reference: reference,
        description: `Study Aid - ${packageName}`,
        status: 'completed',
        metadata: {
          attempts_purchased: attempts,
          price_per_attempt: amount / attempts,
          package_name: packageName,
          feature: 'study_aid'
        }
      })
      .select()
      .single();

    if (txError) {
      console.error('[Purchase] Transaction error:', txError);
      return NextResponse.json(
        { success: false, error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // 5. Update wallet
    const { error: balanceError } = await supabase
      .from('wallets')
      .update({ 
        balance: balanceAfter,
        total_spent: wallet.total_spent + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (balanceError) {
      console.error('[Purchase] Balance update error:', balanceError);
      
      // Rollback transaction
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);
        
      return NextResponse.json(
        { success: false, error: 'Failed to update wallet balance' },
        { status: 500 }
      );
    }

    // 6. Credit attempts using database function
    const { data: creditResult, error: creditError } = await supabase.rpc(
      'purchase_study_attempts_from_wallet',
      {
        p_student_id: user.id,
        p_attempts: attempts,
        p_amount: amount,
        p_transaction_id: transaction.id,
        p_wallet_reference: reference,
      }
    );

    if (creditError || !creditResult || creditResult.length === 0) {
      console.error('[Purchase] Credit error:', creditError);
      
      // Rollback wallet
      await supabase
        .from('wallets')
        .update({ 
          balance: balanceBefore,
          total_spent: wallet.total_spent
        })
        .eq('id', wallet.id);
        
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);
        
      return NextResponse.json(
        { success: false, error: 'Failed to credit attempts' },
        { status: 500 }
      );
    }

    const result = creditResult[0];

    // 7. Return success
    return NextResponse.json({
      success: true,
      message: result.message || `Successfully purchased ${attempts} attempts`,
      attemptsPurchased: attempts,
      amountPaid: amount,
      newBalance: balanceAfter,
      newTotalAttempts: result.new_attempts || 0,
      reference: reference,
      transaction: {
        id: transaction.id,
        reference: reference,
        created_at: transaction.created_at
      }
    });

  } catch (error) {
    console.error('[Purchase] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}