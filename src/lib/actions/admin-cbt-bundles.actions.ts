// lib/actions/admin-cbt-bundles.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from './admin-auth.actions'

export interface BundleWithDetails {
  id: string
  bundle_name: string
  bundle_description: string | null
  course_ids: string[]
  base_price: number
  promo_price: number | null
  referrer_commission: number
  platform_revenue: number | null
  validity_days: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  discount_amount: number
  commission_amount: number
  // Computed
  effective_price: number
  is_free: boolean
  total_subscriptions?: number
  active_subscriptions?: number
  total_revenue?: number
}

export interface BundleFormData {
  bundle_name: string
  bundle_description?: string
  course_ids: string[]
  base_price: number
  promo_price?: number | null
  referrer_commission?: number
  validity_days?: number
  is_active?: boolean
}

/**
 * Get all bundles with statistics
 */
export async function getAllBundles() {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { data: bundles, error } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get subscription counts for each bundle
    const bundlesWithStats = await Promise.all(
      (bundles || []).map(async (bundle) => {
        const { count: totalSubs } = await supabase
          .from('cbt_student_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('bundle_id', bundle.id)

        const { count: activeSubs } = await supabase
          .from('cbt_student_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('bundle_id', bundle.id)
          .eq('is_active', true)
          .gt('expiry_date', new Date().toISOString())

        const { data: revenue } = await supabase
          .from('cbt_student_subscriptions')
          .select('amount_paid')
          .eq('bundle_id', bundle.id)

        const totalRevenue = revenue?.reduce((sum, sub) => sum + sub.amount_paid, 0) || 0

        return {
          ...bundle,
          effective_price: bundle.promo_price ?? bundle.base_price,
          is_free: (bundle.promo_price ?? bundle.base_price) === 0,
          total_subscriptions: totalSubs || 0,
          active_subscriptions: activeSubs || 0,
          total_revenue: totalRevenue,
        }
      })
    )

    return {
      success: true,
      bundles: bundlesWithStats as BundleWithDetails[],
    }
  } catch (error: any) {
    console.error('[getAllBundles] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch bundles',
    }
  }
}

/**
 * Get single bundle by ID
 */
export async function getBundleById(bundleId: string) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { data: bundle, error } = await supabase
      .from('cbt_subscription_bundles')
      .select('*')
      .eq('id', bundleId)
      .single()

    if (error) throw error

    return {
      success: true,
      bundle: {
        ...bundle,
        effective_price: bundle.promo_price ?? bundle.base_price,
        is_free: (bundle.promo_price ?? bundle.base_price) === 0,
      },
    }
  } catch (error: any) {
    console.error('[getBundleById] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch bundle',
    }
  }
}

/**
 * Create new bundle
 */
export async function createBundle(formData: BundleFormData) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    // Validate
    if (!formData.bundle_name || !formData.bundle_name.trim()) {
      throw new Error('Bundle name is required')
    }

    if (!formData.course_ids || formData.course_ids.length === 0) {
      throw new Error('At least one course is required')
    }

    if (formData.base_price < 0) {
      throw new Error('Base price cannot be negative')
    }

    if (formData.promo_price !== null && formData.promo_price !== undefined) {
      if (formData.promo_price < 0) {
        throw new Error('Promo price cannot be negative')
      }
      if (formData.promo_price > formData.base_price) {
        throw new Error('Promo price cannot exceed base price')
      }
    }

    // Check for duplicate bundle name
    const { data: existing } = await supabase
      .from('cbt_subscription_bundles')
      .select('id')
      .eq('bundle_name', formData.bundle_name)
      .maybeSingle()

    if (existing) {
      throw new Error('A bundle with this name already exists. Please use a different name.')
    }

    const isFree = (formData.promo_price ?? formData.base_price) === 0

    // Create bundle with all required fields
    const insertData = {
      bundle_name: formData.bundle_name,
      bundle_description: formData.bundle_description || null,
      course_ids: formData.course_ids,
      base_price: formData.base_price,
      promo_price: formData.promo_price ?? null,
      referrer_commission: isFree ? 0 : (formData.referrer_commission || 0),
      validity_days: formData.validity_days || 90,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      created_by: admin.id,
      discount_amount: 0, // Set default
      commission_amount: isFree ? 0 : (formData.referrer_commission || 0), // Match referrer_commission
    }

    console.log('[createBundle] Inserting:', insertData)

    const { data: bundle, error } = await supabase
      .from('cbt_subscription_bundles')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[createBundle] Error:', error)
      
      // Handle specific error codes
      if (error.code === '23505') {
        throw new Error('A bundle with this name already exists')
      } else if (error.code === '23514') {
        throw new Error('Database constraint violation. Please check all values are valid.')
      }
      
      throw error
    }

    // Log admin action
    await logAdminAction({
      actionType: 'BUNDLE_CREATE',
      targetType: 'cbt_bundle',
      targetId: bundle.id,
      details: {
        bundle_name: formData.bundle_name,
        base_price: formData.base_price,
        promo_price: formData.promo_price,
        is_free: isFree,
        course_count: formData.course_ids.length,
      },
    })

    return {
      success: true,
      bundle,
      message: `Bundle "${formData.bundle_name}" created${isFree ? ' as FREE' : ''} successfully`,
    }
  } catch (error: any) {
    console.error('[createBundle] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to create bundle',
    }
  }
}

/**
 * Update existing bundle
 */
export async function updateBundle(bundleId: string, formData: BundleFormData) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    // Validate
    if (formData.base_price < 0) {
      throw new Error('Base price cannot be negative')
    }

    if (formData.promo_price !== null && formData.promo_price !== undefined) {
      if (formData.promo_price < 0) {
        throw new Error('Promo price cannot be negative')
      }
      if (formData.promo_price > formData.base_price) {
        throw new Error('Promo price cannot exceed base price')
      }
    }

    // Check for duplicate bundle name (excluding current bundle)
    const { data: existing } = await supabase
      .from('cbt_subscription_bundles')
      .select('id')
      .eq('bundle_name', formData.bundle_name)
      .neq('id', bundleId)
      .maybeSingle()

    if (existing) {
      throw new Error('A bundle with this name already exists. Please use a different name.')
    }

    const isFree = (formData.promo_price ?? formData.base_price) === 0

    // Update bundle
    const { data: bundle, error } = await supabase
      .from('cbt_subscription_bundles')
      .update({
        bundle_name: formData.bundle_name,
        bundle_description: formData.bundle_description || null,
        course_ids: formData.course_ids,
        base_price: formData.base_price,
        promo_price: formData.promo_price ?? null,
        referrer_commission: isFree ? 0 : (formData.referrer_commission || 0),
        validity_days: formData.validity_days || 90,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        updated_at: new Date().toISOString(),
        commission_amount: isFree ? 0 : (formData.referrer_commission || 0),
      })
      .eq('id', bundleId)
      .select()
      .single()

    if (error) {
      console.error('[updateBundle] Error:', error)
      
      if (error.code === '23505') {
        throw new Error('A bundle with this name already exists')
      }
      
      throw error
    }

    // Log admin action
    await logAdminAction({
      actionType: 'BUNDLE_UPDATE',
      targetType: 'cbt_bundle',
      targetId: bundleId,
      details: {
        bundle_name: formData.bundle_name,
        base_price: formData.base_price,
        promo_price: formData.promo_price,
        is_free: isFree,
      },
    })

    return {
      success: true,
      bundle,
      message: 'Bundle updated successfully',
    }
  } catch (error: any) {
    console.error('[updateBundle] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to update bundle',
    }
  }
}

/**
 * Toggle bundle active status
 */
export async function toggleBundleStatus(bundleId: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    // Get current status
    const { data: bundle } = await supabase
      .from('cbt_subscription_bundles')
      .select('is_active, bundle_name')
      .eq('id', bundleId)
      .single()

    if (!bundle) throw new Error('Bundle not found')

    const newStatus = !bundle.is_active

    // Update status
    const { error } = await supabase
      .from('cbt_subscription_bundles')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bundleId)

    if (error) throw error

    // Log admin action
    await logAdminAction({
      actionType: 'BUNDLE_STATUS_TOGGLE',
      targetType: 'cbt_bundle',
      targetId: bundleId,
      details: {
        bundle_name: bundle.bundle_name,
        old_status: bundle.is_active,
        new_status: newStatus,
      },
    })

    return {
      success: true,
      message: `Bundle ${newStatus ? 'activated' : 'deactivated'} successfully`,
    }
  } catch (error: any) {
    console.error('[toggleBundleStatus] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to toggle bundle status',
    }
  }
}

/**
 * Delete bundle
 */
export async function deleteBundle(bundleId: string) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    // Check if bundle has active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('cbt_student_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('bundle_id', bundleId)
      .eq('is_active', true)
      .gt('expiry_date', new Date().toISOString())

    if (activeSubscriptions && activeSubscriptions > 0) {
      throw new Error(
        `Cannot delete bundle with ${activeSubscriptions} active subscription(s). Deactivate instead.`
      )
    }

    // Get bundle name for logging
    const { data: bundle } = await supabase
      .from('cbt_subscription_bundles')
      .select('bundle_name')
      .eq('id', bundleId)
      .single()

    // Delete bundle
    const { error } = await supabase
      .from('cbt_subscription_bundles')
      .delete()
      .eq('id', bundleId)

    if (error) throw error

    // Log admin action
    await logAdminAction({
      actionType: 'BUNDLE_DELETE',
      targetType: 'cbt_bundle',
      targetId: bundleId,
      details: {
        bundle_name: bundle?.bundle_name || 'Unknown',
      },
    })

    return {
      success: true,
      message: 'Bundle deleted successfully',
    }
  } catch (error: any) {
    console.error('[deleteBundle] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete bundle',
    }
  }
}

/**
 * Get bundle statistics
 */
export async function getBundleStatistics() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { count: totalBundles } = await supabase
      .from('cbt_subscription_bundles')
      .select('*', { count: 'exact', head: true })

    const { count: activeBundles } = await supabase
      .from('cbt_subscription_bundles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { data: bundles } = await supabase
      .from('cbt_subscription_bundles')
      .select('base_price, promo_price')

    const freeBundles = bundles?.filter(
      (b) => (b.promo_price ?? b.base_price) === 0
    ).length || 0

    const { data: subscriptions } = await supabase
      .from('cbt_student_subscriptions')
      .select('amount_paid')

    const totalRevenue = subscriptions?.reduce((sum, sub) => sum + sub.amount_paid, 0) || 0

    return {
      success: true,
      statistics: {
        totalBundles: totalBundles || 0,
        activeBundles: activeBundles || 0,
        inactiveBundles: (totalBundles || 0) - (activeBundles || 0),
        freeBundles,
        paidBundles: (totalBundles || 0) - freeBundles,
        totalRevenue,
      },
    }
  } catch (error: any) {
    console.error('[getBundleStatistics] Error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch statistics',
    }
  }
}