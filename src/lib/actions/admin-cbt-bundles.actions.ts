'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { revalidatePath } from 'next/cache';

interface ActionError extends Error {
  message: string;
}

// Admin Access Checker
async function checkAdminAccess() {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== 'admin') {
    return { authorized: false, error: 'Unauthorized access' };
  }
  return { authorized: true, user };
}

// Price Calculation Helper
export async function calculateBundlePricing(
  basePrice: number,
  discountAmount: number,
  commissionAmount: number
) {
  const studentPays = basePrice - discountAmount;
  const platformKeeps = studentPays - commissionAmount;

  return {
    studentPays,
    referrerEarns: commissionAmount,
    platformKeeps,
    valid: platformKeeps >= 0,
  };
}

// BUNDLE Management Functions
/**
 * Create new bundle
 */
/**
 * Create new bundle - Admin controls all pricing
 */
export async function createBundle(data: {
  bundle_name: string
  bundle_description?: string
  course_ids: string[]
  base_price: number
  discount_amount: number      // ✅ Admin sets this
  commission_amount: number     // ✅ Admin sets this
  validity_days?: number
  is_active?: boolean
}) {
  try {
    const supabase = await createClient()
 
    // Validate course_ids
    if (!data.course_ids || data.course_ids.length === 0) {
      return { error: 'At least one course is required' }
    }
 
    // Validate pricing makes sense
    const studentPays = data.base_price - data.discount_amount
    const platformKeeps = studentPays - data.commission_amount
 
    if (studentPays < 0) {
      return { error: 'Discount cannot exceed base price' }
    }
 
    if (platformKeeps < 0) {
      return { error: 'Commission cannot exceed student payment' }
    }
 
    // Calculate promo_price from discount
    const promo_price = data.base_price - data.discount_amount
 
    const { data: bundle, error } = await supabase
      .from('cbt_subscription_bundles')
      .insert({
        bundle_name: data.bundle_name,
        bundle_description: data.bundle_description,
        course_ids: data.course_ids,
        base_price: data.base_price,
        promo_price: promo_price,              // ✅ Calculated from discount
        discount_amount: data.discount_amount,  // ✅ Admin's value
        commission_amount: data.commission_amount, // ✅ Admin's value
        validity_days: data.validity_days || 90,
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
      .select()
      .single()
 
    if (error) {
      console.error('[createBundle] Error:', error)
      return { error: 'Failed to create bundle' }
    }
 
    return { success: true, data: bundle }
  } catch (error) {
    console.error('[createBundle] Error:', error)
    return { error: 'Failed to create bundle' }
  }
}

/**
 * Update bundle - Admin controls all pricing
 */
export async function updateBundle(
  bundleId: string,
  data: {
    bundle_name?: string
    bundle_description?: string
    course_ids?: string[]
    base_price?: number
    discount_amount?: number      // ✅ Admin sets this
    commission_amount?: number     // ✅ Admin sets this
    validity_days?: number
    is_active?: boolean
    // Support camelCase from form
    bundleName?: string
    bundleDescription?: string
    courseIds?: string[]
    basePrice?: number
    discountAmount?: number
    commissionAmount?: number
    validityDays?: number
  }
) {
  try {
    const supabase = await createClient()
 
    // Get current bundle to validate changes
    const { data: currentBundle } = await supabase
      .from('cbt_subscription_bundles')
      .select('base_price, discount_amount, commission_amount')
      .eq('id', bundleId)
      .single()
 
    // Map camelCase to snake_case
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
 
    // Handle both formats
    if (data.bundle_name !== undefined) updateData.bundle_name = data.bundle_name
    else if (data.bundleName !== undefined) updateData.bundle_name = data.bundleName
 
    if (data.bundle_description !== undefined) updateData.bundle_description = data.bundle_description
    else if (data.bundleDescription !== undefined) updateData.bundle_description = data.bundleDescription
 
    if (data.course_ids !== undefined) updateData.course_ids = data.course_ids
    else if (data.courseIds !== undefined) updateData.course_ids = data.courseIds
 
    if (data.base_price !== undefined) updateData.base_price = data.base_price
    else if (data.basePrice !== undefined) updateData.base_price = data.basePrice
 
    if (data.discount_amount !== undefined) updateData.discount_amount = data.discount_amount
    else if (data.discountAmount !== undefined) updateData.discount_amount = data.discountAmount
 
    if (data.commission_amount !== undefined) updateData.commission_amount = data.commission_amount
    else if (data.commissionAmount !== undefined) updateData.commission_amount = data.commissionAmount
 
    if (data.validity_days !== undefined) updateData.validity_days = data.validity_days
    else if (data.validityDays !== undefined) updateData.validity_days = data.validityDays
 
    if (data.is_active !== undefined) updateData.is_active = data.is_active
 
    // Calculate promo_price when base_price or discount_amount changes
    const finalBasePrice = updateData.base_price || currentBundle?.base_price || 0
    const finalDiscount = updateData.discount_amount !== undefined 
      ? updateData.discount_amount 
      : currentBundle?.discount_amount || 0
    const finalCommission = updateData.commission_amount !== undefined
      ? updateData.commission_amount
      : currentBundle?.commission_amount || 0
 
    // Validate pricing
    const studentPays = finalBasePrice - finalDiscount
    const platformKeeps = studentPays - finalCommission
 
    if (studentPays < 0) {
      return { error: 'Discount cannot exceed base price' }
    }
 
    if (platformKeeps < 0) {
      return { error: 'Commission cannot exceed student payment' }
    }
 
    // Update promo_price to stay in sync
    updateData.promo_price = finalBasePrice - finalDiscount
 
    const { data: bundle, error } = await supabase
      .from('cbt_subscription_bundles')
      .update(updateData)
      .eq('id', bundleId)
      .select()
      .single()
 
    if (error) {
      console.error('[updateBundle] Error:', error)
      return { error: 'Failed to update bundle' }
    }
 
    return { success: true, data: bundle }
  } catch (error) {
    console.error('[updateBundle] Error:', error)
    return { error: 'Failed to update bundle' }
  }
}

/**
 * Delete bundle
 */
export async function deleteBundle(bundleId: string) {
  try {
    const supabase = await createClient()

    // Check if bundle has active subscriptions
    const { data: subscriptions } = await supabase
      .from('cbt_student_subscriptions')
      .select('id')
      .eq('bundle_id', bundleId)
      .eq('is_active', true)
      .limit(1)

    if (subscriptions && subscriptions.length > 0) {
      return { 
        error: 'Cannot delete bundle with active subscriptions. Deactivate it instead.' 
      }
    }

    const { error } = await supabase
      .from('cbt_subscription_bundles')
      .delete()
      .eq('id', bundleId)

    if (error) {
      console.error('[deleteBundle] Error:', error)
      return { error: 'Failed to delete bundle' }
    }

    return { success: true }
  } catch (error) {
    console.error('[deleteBundle] Error:', error)
    return { error: 'Failed to delete bundle' }
  }
}

/**
 * Get all bundles with courses
 */
export async function getAllBundles() {
  try {
    const supabase = await createClient()

    // 1. Get all bundles
    const { data: bundles, error: bundlesError } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .order('created_at', { ascending: false })

    if (bundlesError) {
      console.error('[getAllBundles] Error:', bundlesError)
      return { error: 'Failed to fetch bundles' }
    }

    if (!bundles || bundles.length === 0) {
      return { success: true, data: [] }
    }

    // 2. Get all unique course IDs from all bundles
    const allCourseIds = new Set<string>()
    bundles.forEach(bundle => {
      if (bundle.course_ids && Array.isArray(bundle.course_ids)) {
        bundle.course_ids.forEach((id: string) => allCourseIds.add(id))
      }
    })

    // 3. Fetch all courses in one query
    let coursesMap = new Map()
    if (allCourseIds.size > 0) {
      const { data: coursesData, error: coursesError } = await supabase
        .from('cbt_courses')
        .select('*')
        .in('id', Array.from(allCourseIds))

      if (coursesError) {
        console.error('[getAllBundles] Courses error:', coursesError)
      } else if (coursesData) {
        coursesData.forEach(course => {
          coursesMap.set(course.id, course)
        })
      }
    }

    // 4. Attach courses to each bundle
    const bundlesWithCourses = bundles.map(bundle => ({
      ...bundle,
      courses: bundle.course_ids
        ? bundle.course_ids
            .map((id: string) => coursesMap.get(id))
            .filter(Boolean)
        : []
    }))

    return {
      success: true,
      bundles: bundlesWithCourses
    }
  } catch (error) {
    console.error('[getAllBundles] Error:', error)
    return { success: false, error: 'Failed to fetch bundles' }
  }
}

/**
 * Get bundle by ID with courses
 */
export async function getBundleById(bundleId: string) {
  try {
    const supabase = await createClient()

    // 1. Get the bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .eq('id', bundleId)
      .single()

    if (bundleError || !bundle) {
      console.error('[getBundleById] Error:', bundleError)
      return { error: 'Bundle not found' }
    }

    // 2. Fetch courses if bundle has course_ids
    let courses = []
    if (bundle.course_ids && bundle.course_ids.length > 0) {
      const { data: coursesData, error: coursesError } = await supabase
        .from('cbt_courses')
        .select('*')
        .in('id', bundle.course_ids)

      if (coursesError) {
        console.error('[getBundleById] Courses error:', coursesError)
      } else {
        courses = coursesData || []
      }
    }

    return {
      success: true,
      bundle: {
        ...bundle,
        courses: courses
      }
    }
  } catch (error) {
    console.error('[getBundleById] Error:', error)
    return { error: 'Failed to fetch bundle' }
  }
}

/**
 * Get all available courses for bundle creation
 */
export async function getAvailableCourses() {
  try {
    const supabase = await createClient()

    const { data: courses, error } = await supabase
      .from('cbt_courses')
      .select('id, course_code, course_title, level, semester')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('course_code', { ascending: true })

    if (error) {
      console.error('[getAvailableCourses] Error:', error)
      return { error: 'Failed to fetch courses' }
    }

    return { success: true, data: courses || [] }
  } catch (error) {
    console.error('[getAvailableCourses] Error:', error)
    return { error: 'Failed to fetch courses' }
  }
}

export async function toggleBundleStatus(bundleId: string) {
  const client = await createClient();
  try {
    const access = await checkAdminAccess();
    if (!access.authorized || !access.user) {
      return { success: false, error: access.error };
    }

    const { data: bundle, error: fetchError } = await client
      .from('cbt_subscription_bundles')
      .select('is_active')
      .eq('id', bundleId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!bundle) return { success: false, error: 'Bundle not found' };

    const { error: updateError } = await client
      .from('cbt_subscription_bundles')
      .update({ is_active: !bundle.is_active })
      .eq('id', bundleId);

    if (updateError) throw updateError;

    revalidatePath('/admin/cbt/bundles');
    return { success: true };
  } catch (error) {
    console.log('[toggleBundleStatus]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function getBundleStats(bundleId: string) {
  const client = await createClient();
  try {
    const { data: subscriptions, error: subError } = await client
      .from('cbt_student_subscriptions')
      .select('id, amount_paid, is_active')
      .eq('bundle_id', bundleId);

    if (subError) throw subError;

    const totalSubscribers = subscriptions?.length ?? 0;
    // FIX: was filtering by 'status' — correct column is 'is_active'
    const activeSubscribers = (subscriptions ?? []).filter((s) => s.is_active).length;
    const totalRevenue = (subscriptions ?? []).reduce((sum, s) => sum + (s.amount_paid ?? 0), 0);

    return {
      success: true,
      stats: {
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers: totalSubscribers - activeSubscribers,
        totalRevenue,
      },
    };
  } catch (error) {
    console.log('[getBundleStats]', error);
    return { success: false, error: (error as ActionError).message };
  }
}