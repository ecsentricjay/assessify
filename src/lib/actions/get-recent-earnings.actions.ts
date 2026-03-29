'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

// Get recent promo code earnings for the current user
export async function getMyRecentEarnings(limit: number = 10) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    // Fetch recent earnings from bundle_promo_earnings table
    const { data: earnings, error } = await supabase
      .from('bundle_promo_earnings')
      .select(`
        *,
        referred_student:profiles!bundle_promo_earnings_referred_student_id_fkey(
          first_name,
          last_name
        ),
        bundle:cbt_subscription_bundles(
          bundle_name
        )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getMyRecentEarnings] Error:', error);
      return { success: false, error: error.message };
    }

    // Format the earnings
    const formattedEarnings = (earnings || []).map((earning) => {
      // Handle bundle data - could be array or object
      const bundleData = Array.isArray(earning.bundle) ? earning.bundle[0] : earning.bundle;
      const bundleName = bundleData?.bundle_name || 'Unknown Bundle';
      
      // Handle student data - could be array or object
      const studentData = Array.isArray(earning.referred_student) 
        ? earning.referred_student[0] 
        : earning.referred_student;
      const studentName = studentData 
        ? `${studentData.first_name} ${studentData.last_name}`
        : 'Unknown Student';

      return {
        id: earning.id,
        amount: earning.commission_amount,
        promoCode: earning.promo_code,
        bundleName,
        studentName,
        date: earning.created_at,
        status: earning.status,
      };
    });

    return { 
      success: true, 
      earnings: formattedEarnings 
    };
  } catch (error: any) {
    console.error('[getMyRecentEarnings] Exception:', error);
    return { success: false, error: error.message };
  }
}

// Alternative: Get earnings from transactions table
export async function getMyRecentEarningsFromTransactions(limit: number = 10) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    // Fetch commission transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('source', 'bundle_promo_commission')
      .eq('type', 'credit')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[getMyRecentEarningsFromTransactions] Error:', error);
      return { success: false, error: error.message };
    }

    // Format the earnings from transactions
    const formattedEarnings = (transactions || []).map((txn) => {
      const metadata = txn.metadata || {};
      return {
        id: txn.id,
        amount: txn.amount,
        promoCode: metadata.promo_code || 'N/A',
        description: txn.description || 'Commission',
        date: txn.created_at,
        balanceBefore: txn.balance_before,
        balanceAfter: txn.balance_after,
      };
    });

    return { 
      success: true, 
      earnings: formattedEarnings 
    };
  } catch (error: any) {
    console.error('[getMyRecentEarningsFromTransactions] Exception:', error);
    return { success: false, error: error.message };
  }
}

// Combined approach: Get from both sources
export async function getMyRecentEarningsCombined(limit: number = 10) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    // Fetch from bundle_promo_earnings (preferred source - has more detail)
    const { data: earnings, error: earningsError } = await supabase
      .from('bundle_promo_earnings')
      .select(`
        id,
        commission_amount,
        promo_code,
        referred_student_id,
        bundle_id,
        status,
        created_at,
        referred_student:profiles!bundle_promo_earnings_referred_student_id_fkey(
          first_name,
          last_name
        ),
        bundle:cbt_subscription_bundles(
          bundle_name
        )
      `)
      .eq('referrer_id', user.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (earningsError) {
      console.error('[getMyRecentEarningsCombined] Earnings error:', earningsError);
    }

    // If no earnings found, return empty array
    if (!earnings || earnings.length === 0) {
      return { 
        success: true, 
        earnings: [],
        count: 0
      };
    }

    // Format the results
    const formattedEarnings = earnings.map((earning) => {
      // Handle bundle data - could be array or object
      const bundleData = Array.isArray(earning.bundle) ? earning.bundle[0] : earning.bundle;
      const bundleName = bundleData?.bundle_name || 'Unknown Bundle';
      
      // Handle student data - could be array or object
      const studentData = Array.isArray(earning.referred_student) 
        ? earning.referred_student[0] 
        : earning.referred_student;
      const studentName = studentData 
        ? `${studentData.first_name} ${studentData.last_name}`
        : 'Unknown';

      return {
        id: earning.id,
        amount: Number(earning.commission_amount || 0),
        promoCode: earning.promo_code,
        bundleName,
        studentName,
        date: earning.created_at,
        status: earning.status,
      };
    });

    return { 
      success: true, 
      earnings: formattedEarnings,
      count: formattedEarnings.length
    };
  } catch (error: any) {
    console.error('[getMyRecentEarningsCombined] Exception:', error);
    return { success: false, error: error.message };
  }
}