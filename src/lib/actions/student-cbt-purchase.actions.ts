'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { revalidatePath } from 'next/cache';

interface ActionError extends Error {
  message: string;
}

// Main Bundle Purchase Function
export async function purchaseBundle(input: {
  bundleId: string;
  paymentMethod: 'wallet' | 'paystack';
  promoCode?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    console.log('[purchaseBundle] Starting purchase for bundle:', input.bundleId);
    console.log('[purchaseBundle] User:', user.id, 'Payment method:', input.paymentMethod);

    // ============================================
    // 1. GET BUNDLE
    // ============================================
    const { data: bundle, error: bundleError } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .eq('id', input.bundleId)
      .eq('is_active', true)
      .maybeSingle();

    if (bundleError || !bundle) {
      console.error('[purchaseBundle] Bundle error:', bundleError);
      return { success: false, error: 'Bundle not found or inactive' };
    }

    console.log('[purchaseBundle] Bundle found:', bundle.bundle_name);
    console.log('[purchaseBundle] Courses:', bundle.course_ids);

    // ============================================
    // 2. CHECK FOR EXISTING ACTIVE SUBSCRIPTIONS
    // ============================================
    const { data: existingSubscriptions } = await supabase
      .from('cbt_student_subscriptions')
      .select('course_id, expiry_date')
      .eq('student_id', user.id)
      .in('course_id', bundle.course_ids || [])
      .eq('is_active', true)
      .gte('expiry_date', new Date().toISOString());

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      console.log('[purchaseBundle] User already has active subscriptions to these courses');
      return { 
        success: false, 
        error: 'You already have an active subscription to one or more courses in this bundle. Please wait for it to expire before purchasing again.' 
      };
    }

    console.log('[purchaseBundle] No existing active subscriptions found');

    // ============================================
    // 3. VALIDATE PROMO CODE (if provided)
    // ============================================
    let referrerId: string | undefined;
    let referrerRole: string | undefined;
    let discountAmount = 0;
    let commissionAmount = 0;

    if (input.promoCode) {
      console.log('[purchaseBundle] Validating promo code:', input.promoCode);
      
      const cleanCode = input.promoCode.trim().toUpperCase();
      
      // Get all active promo codes and match in JavaScript (case-insensitive)
      const { data: allPromoCodes } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_active', true);

      const promo = allPromoCodes?.find(
        pc => pc.promo_code.toUpperCase() === cleanCode
      );

      if (!promo) {
        console.log('[purchaseBundle] Promo code not found');
        return {
          success: false,
          error: 'Invalid promo code',
        };
      }

      if (promo.user_id === user.id) {
        console.log('[purchaseBundle] User trying to use own code');
        return {
          success: false,
          error: 'You cannot use your own promo code',
        };
      }

      // Valid code from someone else
      referrerId = promo.user_id;
      referrerRole = promo.user_role;
      discountAmount = bundle.discount_amount || 0;
      commissionAmount = bundle.commission_amount || 0;
      
      console.log('[purchaseBundle] Promo code valid! Discount:', discountAmount, 'Commission:', commissionAmount);
    }

    // ============================================
    // 4. CALCULATE FINAL PRICE
    // ============================================
    const finalPrice = bundle.base_price - discountAmount;
    console.log('[purchaseBundle] Base price:', bundle.base_price);
    console.log('[purchaseBundle] Discount:', discountAmount);
    console.log('[purchaseBundle] Final price:', finalPrice);

    if (finalPrice <= 0) {
      return { success: false, error: 'Invalid pricing calculation' };
    }

    // ============================================
    // 5. PROCESS PAYMENT
    // ============================================
    if (input.paymentMethod === 'wallet') {
      console.log('[purchaseBundle] Processing wallet payment...');
      
      // ✅ FIX 1: Get wallet balance BEFORE deducting
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        console.error('[purchaseBundle] Wallet not found:', walletError);
        return { success: false, error: 'Wallet not found. Please contact support.' };
      }

      const currentBalance = Number(wallet.balance || 0);
      console.log('[purchaseBundle] Current wallet balance:', currentBalance);
      console.log('[purchaseBundle] Amount needed:', finalPrice);

      // ✅ FIX 2: Check if balance is sufficient
      if (currentBalance < finalPrice) {
        console.log('[purchaseBundle] Insufficient balance');
        return { 
          success: false, 
          error: `Insufficient wallet balance. You have ₦${currentBalance.toLocaleString()} but need ₦${finalPrice.toLocaleString()}` 
        };
      }

      // ✅ FIX 3: Deduct from wallet
      const newBalance = currentBalance - finalPrice;
      console.log('[purchaseBundle] New balance will be:', newBalance);

      const { error: deductError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (deductError) {
        console.error('[purchaseBundle] Failed to deduct from wallet:', deductError);
        return { success: false, error: 'Failed to process payment. Please try again.' };
      }

      console.log('[purchaseBundle] ✅ Wallet payment successful. Deducted:', finalPrice);

      // ✅ FIX 4: Create transaction record with balance tracking
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: finalPrice,
          type: 'debit',
          source: 'bundle_purchase',
          purpose: 'cbt_bundle',
          description: `Purchased ${bundle.bundle_name}`,
          balance_before: currentBalance,
          balance_after: newBalance,
          metadata: {
            bundle_id: bundle.id,
            bundle_name: bundle.bundle_name,
            promo_code: input.promoCode,
            discount_applied: discountAmount,
          },
        });

      if (transactionError) {
        console.error('[purchaseBundle] Transaction record error:', transactionError);
        // Don't fail the whole purchase, just log it
      }

    } else {
      // Paystack integration here
      console.log('[purchaseBundle] Paystack not yet implemented');
      return { success: false, error: 'Paystack integration pending' };
    }

    // ============================================
    // 6. CALCULATE EXPIRY DATE
    // ============================================
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (bundle.validity_days || 90));
    console.log('[purchaseBundle] Subscription will expire on:', expiryDate.toISOString());

    // ============================================
    // 7. CREATE SUBSCRIPTIONS FOR EACH COURSE
    // ============================================
    const courseIds = bundle.course_ids || [];
    if (courseIds.length === 0) {
      console.error('[purchaseBundle] No courses in bundle!');
      
      // Refund wallet
      const { data: refundWallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (refundWallet) {
        await supabase
          .from('wallets')
          .update({ balance: Number(refundWallet.balance) + finalPrice })
          .eq('user_id', user.id);
      }

      return { success: false, error: 'Bundle has no courses. Payment refunded.' };
    }

    console.log('[purchaseBundle] Creating', courseIds.length, 'subscription(s)...');

    const subscriptions = [];
    const pricePerCourse = finalPrice / courseIds.length; // Split price
    const commissionPerCourse = commissionAmount / courseIds.length; // Split commission

    for (const courseId of courseIds) {
      console.log('[purchaseBundle] Creating subscription for course:', courseId);
      
      const { data: subscription, error: subError } = await supabase
        .from('cbt_student_subscriptions')
        .insert({
          student_id: user.id,
          bundle_id: bundle.id,
          course_id: courseId,
          original_price: bundle.base_price,
          discount_applied: discountAmount,
          amount_paid: pricePerCourse,
          promo_code_used: input.promoCode?.toUpperCase(),
          referrer_id: referrerId,
          referrer_role: referrerRole,
          commission_paid: commissionPerCourse,
          payment_method: input.paymentMethod,
          expiry_date: expiryDate.toISOString(),
          sessions_taken: 0,
          is_active: true,
        })
        .select()
        .single();

      if (subError) {
        console.error('[purchaseBundle] Subscription creation error:', subError);
        
        // ✅ FIX 5: Refund wallet if subscription fails
        console.log('[purchaseBundle] Refunding wallet...');
        const { data: refundWallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (refundWallet) {
          await supabase
            .from('wallets')
            .update({ balance: Number(refundWallet.balance) + finalPrice })
            .eq('user_id', user.id);
        }

        return { 
          success: false, 
          error: 'Failed to create subscription. Your payment has been refunded to your wallet.' 
        };
      }

      subscriptions.push(subscription);
      console.log('[purchaseBundle] ✅ Subscription created:', subscription.id);
    }

    console.log('[purchaseBundle] ✅ All subscriptions created successfully');

    // ============================================
    // 8. CREDIT REFERRER (if promo code was used)
    // ============================================
    if (referrerId && commissionAmount > 0 && subscriptions.length > 0) {
      console.log('[purchaseBundle] Crediting referrer:', referrerId);
      
      await creditPromoCommission({
        referrerId,
        referrerRole: referrerRole!,
        promoCode: input.promoCode!.toUpperCase(),
        studentId: user.id,
        subscriptionId: subscriptions[0].id,
        bundleId: bundle.id,
        bundlePrice: bundle.base_price,
        discountAmount,
        amountPaid: finalPrice,
        commissionAmount,
      });
    }

    revalidatePath('/student/cbt');
    revalidatePath('/student/wallet');
    
    console.log('[purchaseBundle] ✅✅✅ Purchase completed successfully!');

    return { 
      success: true, 
      message: `Successfully purchased ${bundle.bundle_name}!`,
      subscriptions 
    };

  } catch (error: any) {
    console.error('[purchaseBundle] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

// Credit Promo Commission to Referrer
async function creditPromoCommission(input: {
  referrerId: string;
  referrerRole: string;
  promoCode: string;
  studentId: string;
  subscriptionId: string;
  bundleId: string;
  bundlePrice: number;
  discountAmount: number;
  amountPaid: number;
  commissionAmount: number;
}) {
  const supabase = await createClient();

  try {
    const platformAmount = input.amountPaid - input.commissionAmount;

    console.log('[creditPromoCommission] Creating earnings record...');

    // Create earnings record
    const { error: earningsError } = await supabase
      .from('bundle_promo_earnings')
      .insert({
        referrer_id: input.referrerId,
        referrer_role: input.referrerRole,
        promo_code: input.promoCode,
        referred_student_id: input.studentId,
        subscription_id: input.subscriptionId,
        bundle_id: input.bundleId,
        bundle_price: input.bundlePrice,
        discount_amount: input.discountAmount,
        amount_paid: input.amountPaid,
        commission_amount: input.commissionAmount,
        platform_amount: platformAmount,
        status: 'approved',
      });

    if (earningsError) {
      console.error('[creditPromoCommission] Earnings error:', earningsError);
      return;
    }

    console.log('[creditPromoCommission] ✅ Earnings record created');

    // ✅ FIX 6: Credit referrer's wallet
    const { data: refWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', input.referrerId)
      .single();

    if (refWallet) {
      const currentBalance = Number(refWallet.balance || 0);
      const newBalance = currentBalance + input.commissionAmount;
      
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', input.referrerId);

      console.log('[creditPromoCommission] ✅ Wallet credited:', input.commissionAmount);

      // Create transaction record for referrer with balance tracking
      await supabase
        .from('transactions')
        .insert({
          user_id: input.referrerId,
          amount: input.commissionAmount,
          type: 'credit',
          source: 'bundle_promo_commission',
          purpose: 'referral_commission',
          description: `Commission from promo code ${input.promoCode}`,
          balance_before: currentBalance,
          balance_after: newBalance,
          metadata: {
            promo_code: input.promoCode,
            referred_student_id: input.studentId,
            subscription_id: input.subscriptionId,
          },
        });
    }

    // ✅ FIX 7: Update promo code stats
    const { data: promoData } = await supabase
      .from('promo_codes')
      .select('total_uses, total_earnings')
      .eq('user_id', input.referrerId)
      .maybeSingle();

    if (promoData) {
      await supabase
        .from('promo_codes')
        .update({
          total_uses: (promoData.total_uses || 0) + 1,
          total_earnings: Number(promoData.total_earnings || 0) + input.commissionAmount,
        })
        .eq('user_id', input.referrerId);

      console.log('[creditPromoCommission] ✅ Promo stats updated');
    }

    console.log('[creditPromoCommission] ✅✅ Commission credited successfully');
  } catch (error: any) {
    console.error('[creditPromoCommission] Error:', error);
  }
}

// Get All Active Bundles
export async function getAllActiveBundles(filters?: Record<string, any>) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.ilike('bundle_name', `%${filters.search}%`);
    }
    if (filters?.priceRange) {
      query = query.gte('base_price', filters.priceRange.min).lte('base_price', filters.priceRange.max);
    }

    const { data: bundles, error } = await query;
    if (error) throw error;

    // Remap to camelCase
    const mapped = (bundles || []).map((b) => ({
      id: b.id,
      bundleName: b.bundle_name,
      bundleDescription: b.bundle_description || '',
      basePrice: b.base_price,
      discountAmount: b.discount_amount || 0,
      commissionAmount: b.commission_amount || 0,
      validityDays: b.validity_days,
      maxPracticeSessions: 'Unlimited',
      courseCount: Array.isArray(b.course_ids) ? b.course_ids.length : 0,
      is_active: b.is_active,
    }));

    return { success: true, bundles: mapped };
  } catch (error: any) {
    console.error('[getAllActiveBundles]', error);
    return { success: false, error: error.message };
  }
}

// Get Bundle Details
export async function getBundleDetails(bundleId: string) {
  const supabase = await createClient();

  try {
    const { data: bundle, error } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .eq('id', bundleId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!bundle) return { success: false, error: 'Bundle not found' };

    // Fetch courses
    let courses: any[] = [];
    if (Array.isArray(bundle.course_ids) && bundle.course_ids.length > 0) {
      const { data: courseData } = await supabase
        .from('cbt_courses')
        .select('id, course_title')
        .in('id', bundle.course_ids);

      courses = (courseData || []).map((c) => ({
        id: c.id,
        courseTitle: c.course_title,
      }));
    }

    return {
      success: true,
      bundle: {
        id: bundle.id,
        bundleName: bundle.bundle_name,
        bundleDescription: bundle.bundle_description || '',
        basePrice: bundle.base_price,
        discountAmount: bundle.discount_amount || 0,
        commissionAmount: bundle.commission_amount || 0,
        validityDays: bundle.validity_days,
        maxPracticeSessions: 'Unlimited',
        courseCount: courses.length,
        is_active: bundle.is_active,
        courses,
      },
    };
  } catch (error: any) {
    console.error('[getBundleDetails]', error);
    return { success: false, error: error.message };
  }
}

// Get My Subscriptions
export async function getMySubscriptions() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    const { data: subscriptions, error } = await supabase
      .from('cbt_student_subscriptions')
      .select('*, bundle:cbt_subscription_bundles(*), course:cbt_courses(*)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, subscriptions };
  } catch (error: any) {
    console.error('[getMySubscriptions]', error);
    return { success: false, error: error.message };
  }
}

// Check Active Subscription for Course
export async function checkActiveSubscription(courseId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  try {
    const now = new Date().toISOString();

    const { data: subscription, error } = await supabase
      .from('cbt_student_subscriptions')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .gt('expiry_date', now)
      .maybeSingle();

    if (error) throw error;

    return { success: true, hasAccess: !!subscription, subscription };
  } catch (error: any) {
    console.error('[checkActiveSubscription]', error);
    return { success: false, error: error.message };
  }
}

// Get My Active Subscriptions (for dashboard)
export async function getMyActiveSubscriptions() {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
 
  const supabase = await createClient();
 
  try {
    const now = new Date().toISOString();
 
    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase
      .from('cbt_student_subscriptions')
      .select(`
        *,
        bundle:cbt_subscription_bundles(bundle_name),
        course:cbt_courses(course_code, course_title)
      `)
      .eq('student_id', user.id)
      .eq('is_active', true)
      .gt('expiry_date', now)
      .order('expiry_date', { ascending: true });
 
    if (error) throw error;
 
    // For each subscription, calculate stats
    const enrichedSubscriptions = await Promise.all(
      (subscriptions || []).map(async (sub) => {
        // Get completed sessions for this course
        const { data: sessions } = await supabase
          .from('cbt_practice_sessions')
          .select('score_percentage, completed_at')
          .eq('student_id', user.id)
          .eq('course_id', sub.course_id)
          .eq('status', 'completed');
 
        const sessionsCompleted = sessions?.length || 0;
        
        // Calculate average score
        let averageScore = 0;
        if (sessionsCompleted > 0 && sessions) {
          const totalScore = sessions.reduce((sum, s) => sum + (s.score_percentage || 0), 0);
          averageScore = Math.round(totalScore / sessionsCompleted);
        }
 
        // Calculate days remaining
        const expiryDate = new Date(sub.expiry_date);
        const today = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
 
        return {
          id: sub.id,
          course_id: sub.course_id,
          course_code: sub.course?.course_code || '',
          course_title: sub.course?.course_title || '',
          bundle_name: sub.bundle?.bundle_name || '',
          bundle_id: sub.bundle_id,
          sessions_completed: sessionsCompleted,
          average_score: averageScore,
          expiry_date: sub.expiry_date,
          days_remaining: Math.max(0, daysRemaining),
          is_expired: daysRemaining <= 0,
        };
      })
    );
 
    return { success: true, subscriptions: enrichedSubscriptions };
  } catch (error: any) {
    console.error('[getMyActiveSubscriptions]', error);
    return { success: false, error: error.message };
  }
}
// Get Bundles by Course
export async function getBundlesByCourse(courseId: string) {
  const supabase = await createClient();

  try {
    const { data: bundles, error } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .contains('course_ids', [courseId])
      .eq('is_active', true)
      .order('base_price', { ascending: true });

    if (error) throw error;

    return { success: true, bundles };
  } catch (error: any) {
    console.error('[getBundlesByCourse]', error);
    return { success: false, error: error.message };
  }
}