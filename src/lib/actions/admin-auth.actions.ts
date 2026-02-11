// lib/actions/admin-auth.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the current user with their profile
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return null
  }

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    profile
  }
}

/**
 * Require admin authentication
 * Redirects to home if not admin
 * Use this in admin page components
 */
export async function requireAdmin() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login?redirect=/admin')
  }

  if (user.profile?.role !== 'admin') {
    redirect('/')
  }

  return user
}

/**
 * Check if current user is admin
 * Returns boolean without redirecting
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.profile?.role === 'admin'
}

/**
 * Get admin profile with full details
 * Returns null if not admin
 */
export async function getAdminProfile() {
  const user = await getCurrentUser()
  
  if (!user || user.profile?.role !== 'admin') {
    return null
  }

  return user.profile
}

/**
 * Log admin action to audit trail
 * Call this after every admin action
 */
export async function logAdminAction({
  actionType,
  targetType,
  targetId,
  details,
  metadata = {}
}: {
  actionType: string
  targetType?: string
  targetId?: string
  details?: Record<string, any>
  metadata?: Record<string, any>
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const { error } = await supabase
    .from('admin_actions')
    .insert({
      admin_id: user.id,
      action_type: actionType,
      target_type: targetType,
      target_id: targetId,
      details: details || {},
      metadata: metadata || {}
    })

  if (error) {
    console.error('Failed to log admin action:', error)
  }
}

/**
 * Verify admin and log action in one call
 * Use this for admin mutations
 */
export async function verifyAdminAndLog(actionType: string) {
  const admin = await requireAdmin()
  return {
    admin,
    log: async (targetType?: string, targetId?: string, details?: Record<string, any>) => {
      await logAdminAction({ actionType, targetType, targetId, details })
    }
  }
}