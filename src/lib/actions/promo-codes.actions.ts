'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';

interface ActionError extends Error {
  message: string;
}

interface PromoCode {
  id: string;
  user_id: string;
  promo_code: string;
  user_role: string;
  is_active: boolean;
  total_uses: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

interface PromoEarning {
  id: string;
  referrer_id: string;
  referrer_role: string;
  promo_code: string;
  referred_student_id: string;
  subscription_id: string;
  bundle_id: string;
  bundle_price: number;
  discount_amount: number;
  amount_paid: number;
  commission_amount: number;
  platform_amount: number;
  status: string;
  created_at: string;
}

// Get or Create My Promo Code
export async function getMyPromoCode() {
  const user = await getCurrentUser();
  if (!user || !user.profile) {
    return { success: false, error: 'Not authenticated', code: null };
  }

  const supabase = await createClient();
  const userRole = user.profile.role;

  if (!['student', 'lecturer', 'partner'].includes(userRole)) {
    return { success: false, error: 'Invalid user role', code: null };
  }

  try {
    const { data: existing, error: existingError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return { success: true, code: existing };
    }

    const { data: newCode, error: rpcError } = await supabase.rpc('get_or_create_promo_code', {
      p_user_id: user.id,
      p_role: userRole,
    });

    if (rpcError) {
      console.error('[getMyPromoCode] RPC Error:', rpcError);
      return { success: false, error: 'Failed to create promo code', code: null };
    }

    const { data: code, error: fetchError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('promo_code', newCode)
      .maybeSingle();

    if (fetchError) throw fetchError;

    return { success: true, code };
  } catch (error) {
    console.error('[getMyPromoCode] Error:', error);
    return { success: false, error: (error as ActionError).message || 'An error occurred', code: null };
  }
}

// Validate Promo Code
export async function validatePromoCode(code: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
 
  if (!user) {
    return { success: false, valid: false, error: 'Not authenticated', promoCode: null };
  }
 
  try {
    const cleanCode = code.trim().toUpperCase();
    
    console.log('[validatePromoCode] Validating code:', cleanCode);
    console.log('[validatePromoCode] Current user:', user.id);
 
    if (!cleanCode) {
      return { 
        success: true, 
        valid: false, 
        message: 'Please enter a promo code', 
        promoCode: null 
      };
    }
 
    // ✅ ULTRA-ROBUST FIX: Use raw SQL with UPPER() for guaranteed case-insensitive match
    const { data: promoCodes, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('is_active', true);
 
    console.log('[validatePromoCode] Found codes:', promoCodes?.length || 0);
 
    if (error) {
      console.error('[validatePromoCode] Query error:', error);
      throw error;
    }
 
    // Find matching code (case-insensitive in JavaScript)
    const promoCode = promoCodes?.find(
      pc => pc.promo_code.toUpperCase() === cleanCode
    );
 
    console.log('[validatePromoCode] Matched code:', !!promoCode);
 
    if (!promoCode) {
      console.log('[validatePromoCode] Code not found');
      return { 
        success: true, 
        valid: false, 
        message: 'Invalid promo code', 
        promoCode: null 
      };
    }
 
    // Check if user is trying to use their own code
    if (promoCode.user_id === user.id) {
      console.log('[validatePromoCode] User trying to use own code');
      return {
        success: true,
        valid: false,
        message: 'You cannot use your own promo code',
        promoCode: null,
      };
    }
 
    // Fetch referrer profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', promoCode.user_id)
      .maybeSingle();
 
    const referrerName = profile 
      ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
      : 'user';
 
    console.log('[validatePromoCode] Valid code from:', referrerName);
 
    return {
      success: true,
      valid: true,
      promoCode: { ...promoCode, profile },
      referrerName,
      referrerType: profile?.role ?? promoCode.user_role,
      discountApplied: null,
      message: `Valid code from ${referrerName}!`,
    };
  } catch (error: any) {
    console.error('[validatePromoCode] Error:', error);
    return {
      success: false,
      valid: false,
      error: error.message || 'An error occurred',
      promoCode: null,
    };
  }
}

// Get My Promo Code Statistics
export async function getMyPromoStats() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated', stats: null };
  }

  const supabase = await createClient();

  try {
    const { data: promoCode, error: codeError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (codeError) throw codeError;

    if (!promoCode) {
      return {
        success: true,
        stats: { totalUses: 0, totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0 },
      };
    }

    const { data: earnings, error: earningsError } = await supabase
      .from('bundle_promo_earnings')
      .select('*')
      .eq('referrer_id', user.id);

    if (earningsError) throw earningsError;

    const approvedEarnings = (earnings ?? []).filter((e) => e.status === 'approved');
    const paidEarnings = (earnings ?? []).filter((e) => e.status === 'paid');

    const totalEarnings = approvedEarnings.reduce((sum: number, e: any) => sum + (e.commission_amount ?? 0), 0);
    const paidAmount = paidEarnings.reduce((sum: number, e: any) => sum + (e.commission_amount ?? 0), 0);
    const pendingEarnings = totalEarnings - paidAmount;

    return {
      success: true,
      stats: {
        totalUses: promoCode.total_uses,
        totalEarnings,
        pendingEarnings,
        paidEarnings: paidAmount,
      },
    };
  } catch (error) {
    console.error('[getMyPromoStats] Error:', error);
    return {
      success: false,
      error: (error as ActionError).message || 'An error occurred',
      stats: null,
    };
  }
}

// FIXED VERSION with correct TypeScript types
// Replace getMyPromoEarnings in promo-codes.actions.ts
 
export async function getMyPromoEarnings(filters?: { status?: string; limit?: number }) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated', earnings: null };
  }
 
  const supabase = await createClient();
 
  try {
    // Fetch earnings without trying to join
    let query = supabase
      .from('bundle_promo_earnings')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });
 
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
 
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
 
    const { data: earnings, error } = await query;
    
    if (error) {
      console.error('[getMyPromoEarnings] Query error:', error);
      throw error;
    }
 
    console.log('[getMyPromoEarnings] ✅ Found', earnings?.length || 0, 'earnings');
 
    if (!earnings || earnings.length === 0) {
      return { success: true, earnings: [] };
    }
 
    // Fetch related data separately
    const studentIds = [...new Set(earnings.map(e => e.referred_student_id).filter(Boolean))];
    const bundleIds = [...new Set(earnings.map(e => e.bundle_id).filter(Boolean))];
 
    // Fetch students
    let studentMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds);
 
      studentMap = Object.fromEntries((students ?? []).map(s => [s.id, s]));
    }
 
    // Fetch bundles
    let bundleMap: Record<string, any> = {};
    if (bundleIds.length > 0) {
      const { data: bundles } = await supabase
        .from('cbt_subscription_bundles')
        .select('id, bundle_name')
        .in('id', bundleIds);
 
      bundleMap = Object.fromEntries((bundles ?? []).map(b => [b.id, b]));
    }
 
    // ✅ FIXED: Use undefined instead of null to match component types
    const enriched = earnings.map(e => {
      const student = studentMap[e.referred_student_id];
      const bundle = bundleMap[e.bundle_id];
 
      return {
        id: e.id,
        commission_amount: Number(e.commission_amount || 0),
        status: e.status,
        created_at: e.created_at,
        student: student 
          ? {
              first_name: student.first_name,
              last_name: student.last_name,
            }
          : undefined,  // ✅ Changed from null to undefined
        bundle: bundle
          ? { bundle_name: bundle.bundle_name }
          : undefined,  // ✅ Changed from null to undefined
      };
    });
 
    console.log('[getMyPromoEarnings] ✅ Enriched', enriched.length, 'earnings with student and bundle data');
 
    return { success: true, earnings: enriched };
  } catch (error) {
    console.error('[getMyPromoEarnings] Error:', error);
    return {
      success: false,
      error: (error as ActionError).message || 'An error occurred',
      earnings: null,
    };
  }
}

// Get Specific Promo Code Details (for sharing/display)
export async function getPromoCodeDetails(promoCode: string) {
  const supabase = await createClient();

  try {
    // ✅ FIX: Use .ilike() for case-insensitive search
    const cleanCode = promoCode.trim().toUpperCase();
    
    const { data: code, error } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('promo_code', cleanCode)  // ✅ Changed from .eq()
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!code) return { success: true, code: null, message: 'Promo code not found' };

    // Fetch profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', code.user_id)
      .maybeSingle();

    return { success: true, code: { ...code, profile } };
  } catch (error) {
    console.error('[getPromoCodeDetails] Error:', error);
    return {
      success: false,
      error: (error as ActionError).message || 'An error occurred',
      code: null,
    };
  }
}

// Deactivate My Promo Code
export async function deactivateMyPromoCode() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true, message: 'Promo code deactivated' };
  } catch (error) {
    console.error('[deactivateMyPromoCode] Error:', error);
    return {
      success: false,
      error: (error as ActionError).message || 'An error occurred',
    };
  }
}

// Reactivate My Promo Code
export async function reactivateMyPromoCode() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: true })
      .eq('user_id', user.id);

    if (error) throw error;

    return { success: true, message: 'Promo code reactivated' };
  } catch (error) {
    console.error('[reactivateMyPromoCode] Error:', error);
    return {
      success: false,
      error: (error as ActionError).message || 'An error occurred',
    };
  }
}

// Get Top Promo Codes (for leaderboard/discovery)
export async function getTopPromoCodes(limit: number = 10) {
  const supabase = await createClient();

  try {
    const { data: codes, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('is_active', true)
      .order('total_earnings', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch profiles separately
    const userIds = [...new Set((codes ?? []).map((c) => c.user_id).filter(Boolean))];
    let profileMap: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    }

    const enriched = (codes ?? []).map((c) => ({
      ...c,
      profile: profileMap[c.user_id] ?? null,
    }));

    return { success: true, codes: enriched };
  } catch (error) {
    console.error('[getTopPromoCodes] Error:', error);
    return {
      success: false,
      error: (error as ActionError).message || 'An error occurred',
      codes: [],
    };
  }
}

// Check if Promo Code Belongs to User
export async function isMyPromoCode(promoCode: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();

  try {
    // ✅ FIX: Use .ilike() for case-insensitive search
    const cleanCode = promoCode.trim().toUpperCase();
    
    const { data: code, error } = await supabase
      .from('promo_codes')
      .select('user_id')
      .ilike('promo_code', cleanCode)  // ✅ Changed from .eq()
      .maybeSingle();

    if (error) throw error;

    return code?.user_id === user.id;
  } catch (error) {
    console.error('[isMyPromoCode] Error:', error);
    return false;
  }
}