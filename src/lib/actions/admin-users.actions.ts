// lib/actions/admin-users.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from './admin-auth.actions'

export type UserWithAuth = {
  id: string
  first_name: string
  last_name: string
  role: string
  email: string
  matric_number: string | null
  staff_id: string | null
  department: string | null
  faculty: string | null
  level: number | null
  phone: string | null
  is_active: boolean
  created_at: string
  institution_id: string | null
}

/**
 * Get all users with pagination, search, and filters
 */
export async function getAllUsers({
  page = 1,
  limit = 20,
  search = '',
  role = 'all',
  status = 'all'
}: {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
}) {
  await requireAdmin()
  const supabase = await createClient()

  try {
    // Start building query - use profiles_with_email view if available
    // If view doesn't exist, this will fall back to profiles table
    let query = supabase
      .from('profiles_with_email')
      .select('*', { count: 'exact' })

    // Apply role filter
    if (role !== 'all') {
      query = query.eq('role', role)
    }

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('is_active', status === 'active')
    }

    // Apply search across multiple fields
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,` +
        `last_name.ilike.%${search}%,` +
        `matric_number.ilike.%${search}%,` +
        `staff_id.ilike.%${search}%,` +
        `department.ilike.%${search}%`
      )
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: profiles, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // If we're using the view, profiles already have email
    // If not, we need to fetch emails separately
    let usersWithAuth: UserWithAuth[] = []
    
    // Check if profiles have email field (from view)
    if (profiles && profiles.length > 0 && 'email' in profiles[0]) {
      // Using profiles_with_email view - emails already included
      usersWithAuth = profiles as UserWithAuth[]
    } else {
      // Fallback: fetch emails individually
      usersWithAuth = await Promise.all(
        (profiles || []).map(async (profile) => {
          let email = ''
          try {
            const { data: authData } = await supabase.auth.admin.getUserById(profile.id)
            email = authData?.user?.email || ''
          } catch (error) {
            console.error(`Failed to fetch email for user ${profile.id}`)
          }
          
          return {
            ...profile,
            email
          }
        })
      )
    }

    // If searching by email, filter results
    let filteredUsers = usersWithAuth
    if (search && search.includes('@')) {
      filteredUsers = usersWithAuth.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    return {
      success: true,
      data: {
        users: filteredUsers,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch users'
    }
  }
}

/**
 * Get single user by ID with full details
 */
export async function getUserById(userId: string) {
  await requireAdmin()
  const supabase = await createClient()

  try {
    // Get profile with email from the view
    const { data: profile, error: profileError } = await supabase
      .from('profiles_with_email')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      throw profileError
    }

    if (!profile) {
      throw new Error('User not found')
    }

    // Get wallet (don't fail if it doesn't exist)
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // Get course enrollments count (for students)
    let enrollmentCount = 0
    const { count: enrollCount, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
    
    if (enrollError) {
      console.error('Error counting enrollments:', enrollError)
    } else {
      enrollmentCount = enrollCount || 0
    }

    // Get courses created (for lecturers)
    let coursesCreated = 0
    const { count: courseCount, error: courseError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)
    
    if (courseError) {
      console.error('Error counting courses:', courseError)
    } else {
      coursesCreated = courseCount || 0
    }

    // Get assignment submissions (for students)
    let submissionCount = 0
    const { count: subCount, error: subError } = await supabase
      .from('assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
    
    if (subError) {
      console.error('Error counting submissions:', subError)
    } else {
      submissionCount = subCount || 0
    }

    // Get test attempts (for students)
    let testAttemptCount = 0
    const { count: testCount, error: testError } = await supabase
      .from('test_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
    
    if (testError) {
      console.error('Error counting test attempts:', testError)
    } else {
      testAttemptCount = testCount || 0
    }

    console.log('User stats:', {
      enrollmentCount,
      coursesCreated,
      submissionCount,
      testAttemptCount
    })

    return {
      success: true,
      data: {
        profile: profile, // Email is already included from the view
        wallet: wallet || null,
        stats: {
          enrollments: enrollmentCount,
          coursesCreated: coursesCreated,
          submissions: submissionCount,
          testAttempts: testAttemptCount
        }
      }
    }
  } catch (error: any) {
    console.error('Error fetching user:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    })
    return {
      success: false,
      error: error?.message || 'Failed to fetch user details'
    }
  }
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string, 
  updates: Partial<{
    first_name: string
    last_name: string
    role: string
    department: string
    faculty: string
    level: number
    phone: string
    matric_number: string
    staff_id: string
    is_active: boolean
  }>
) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // Log admin action
    await logAdminAction({
      actionType: 'USER_UPDATE',
      targetType: 'user',
      targetId: userId,
      details: {
        updates,
        admin_id: admin.id
      }
    })

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Error updating user:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update user'
    }
  }
}

/**
 * Deactivate/Activate user
 */
export async function toggleUserStatus(userId: string, isActive: boolean) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // Log admin action
    await logAdminAction({
      actionType: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetType: 'user',
      targetId: userId,
      details: {
        new_status: isActive ? 'active' : 'inactive',
        admin_id: admin.id
      }
    })

    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('Error toggling user status:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update user status'
    }
  }
}

/**
 * Get user activity log
 */
export async function getUserActivity(userId: string, limit = 20) {
  await requireAdmin()
  const supabase = await createClient()

  try {
    // Get admin actions targeting this user
    const { data: adminActions, error: adminError } = await supabase
      .from('admin_actions')
      .select('*, admin:admin_id(first_name, last_name)')
      .eq('target_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Get recent transactions
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single()

    let transactions = []
    if (wallet) {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      transactions = txData || []
    }

    // Get recent enrollments
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('*, course:course_id(course_title)')
      .eq('student_id', userId)
      .order('enrolled_at', { ascending: false })
      .limit(10)

    return {
      success: true,
      data: {
        adminActions: adminActions || [],
        transactions: transactions,
        enrollments: enrollments || []
      }
    }
  } catch (error: any) {
    console.error('Error fetching user activity:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch user activity'
    }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(userId: string) {
  const admin = await requireAdmin()
  const supabase = await createClient()

  try {
    // Get user email
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    
    if (!authUser?.user?.email) {
      throw new Error('User email not found')
    }

    // Send password reset email via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(
      authUser.user.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`
      }
    )

    if (error) throw error

    // Log admin action
    await logAdminAction({
      actionType: 'PASSWORD_RESET_SENT',
      targetType: 'user',
      targetId: userId,
      details: {
        admin_id: admin.id,
        email: authUser.user.email
      }
    })

    return {
      success: true,
      message: 'Password reset email sent'
    }
  } catch (error: any) {
    console.error('Error sending password reset:', error)
    return {
      success: false,
      error: error?.message || 'Failed to send password reset'
    }
  }
}