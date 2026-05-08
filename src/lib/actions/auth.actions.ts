'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendWelcomeEmail } from './email.actions'
import { createAndAssignDVA } from '@/lib/services/paystack.service'
import crypto from 'crypto'

// Create admin client for bypassing RLS
function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function signUp(formData: {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'student' | 'lecturer'
  title?: string
  institutionId: string
  matricNumber?: string
  staffId?: string
  department: string
  faculty: string
  level?: number
  phone: string
  referralCode?: string
}) {
  const supabase = await createClient()
  const adminClient = createServiceClient()

  // Validate referral code if provided (lecturers only)
  let partnerId: string | null = null
  if (formData.role === 'lecturer' && formData.referralCode) {
    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .select('id, status')
      .eq('partner_code', formData.referralCode.toUpperCase())
      .single()

    if (partnerError || !partner) {
      return { error: 'Invalid referral code' }
    }

    if (partner.status !== 'active') {
      return { error: 'This referral code is no longer active' }
    }

    partnerId = partner.id
  }

  // Sign up the user in Supabase Auth
  // NOTE: This triggers on_auth_user_created which creates the skeleton profile + wallet
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
      },
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  // CHANGED: upsert instead of insert — trigger already created the skeleton row,
  // so we update it with the real profile data from the form
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      institution_id: formData.institutionId,
      first_name: formData.firstName,
      last_name: formData.lastName,
      role: formData.role,
      title: formData.title,
      matric_number: formData.matricNumber,
      staff_id: formData.staffId,
      department: formData.department,
      faculty: formData.faculty,
      level: formData.level,
      phone: formData.phone,
      email_verified: false,
      referred_by_partner: partnerId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id',
    })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    return { error: profileError.message }
  }

  // Create Dedicated Virtual Account for all users
  // Done here at signup so we have guaranteed access to form data
  try {
    const dvaResult = await createAndAssignDVA({
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      preferred_bank: 'wema-bank',
      country: 'NG',
    })

    if (!dvaResult.success) {
      console.error('DVA creation failed (non-blocking):', dvaResult.error)
    } else if (dvaResult.pending) {
      // Paystack is processing — webhook will save the account when ready
      console.log('DVA creation in progress for user:', authData.user.id)
      // Store a pending record so we can match the webhook to this user
      await adminClient.from('virtual_accounts').insert({
        user_id: authData.user.id,
        paystack_customer_code: '',
        paystack_customer_id: 0,
        paystack_account_id: 0,
        account_number: 'pending',
        account_name: formData.firstName + ' ' + formData.lastName,
        bank_name: 'Wema Bank',
        bank_slug: 'wema-bank',
        bank_id: 0,
        currency: 'NGN',
        is_active: false, // inactive until webhook confirms
      })
    } else if (dvaResult.dva) {
      // Immediate response — save now
      const dva = dvaResult.dva
      const account = dva.dedicated_account || dva
      const customer = dva.customer || {}

      await adminClient.from('virtual_accounts').insert({
        user_id: authData.user.id,
        paystack_customer_code: customer.customer_code || '',
        paystack_customer_id: customer.id || 0,
        paystack_account_id: account.id || 0,
        account_number: account.account_number || '',
        account_name: account.account_name || '',
        bank_name: account.bank?.name || 'Wema Bank',
        bank_slug: account.bank?.slug || 'wema-bank',
        bank_id: account.bank?.id || 0,
        currency: 'NGN',
        is_active: true,
      })
    }
  } catch (dvaError) {
    console.error('DVA creation error (non-blocking):', dvaError)
  }

  // Create referral entry if lecturer was referred by a partner
  if (formData.role === 'lecturer' && partnerId && formData.referralCode) {
    const { error: referralError } = await adminClient
      .from('referrals')
      .insert({
        partner_id: partnerId,
        referred_lecturer_id: authData.user.id,
        referral_code: formData.referralCode.toUpperCase(),
        status: 'active',
      })

    if (referralError) {
      console.error('Failed to create referral entry:', referralError)
    } else {
      const { error: incrementError } = await adminClient
        .rpc('increment_partner_referrals', {
          partner_uuid: partnerId
        })

      if (incrementError) {
        console.error('Failed to increment partner referrals:', incrementError)
      }
    }
  }

  // REMOVED: student wallet creation block — the trigger now creates the wallet
  // for all users with the ₦1000 signup bonus, so this is no longer needed here

  // Send welcome email
  try {
    await sendWelcomeEmail(
      formData.email,
      formData.firstName,
      formData.lastName,
      formData.role
    )
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError)
  }

  revalidatePath('/', 'layout')
  return {
    success: true,
    message: formData.referralCode
      ? 'Account created successfully with referral! Please check your email to verify your account.'
      : 'Account created successfully! Please check your email to verify your account.'
  }
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error)
    return { error: error.message }
  }

  if (!data.user) {
    return { error: 'Login failed' }
  }

  // Get user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    return { error: 'Failed to fetch user profile' }
  }

  if (!profile) {
    return { error: 'User profile not found' }
  }

  revalidatePath('/', 'layout')
  
  // Redirect based on role
  // Note: redirect() throws an error, which is expected behavior
  if (profile.role === 'student') {
    redirect('/student/dashboard')
  } else if (profile.role === 'lecturer') {
    redirect('/lecturer/dashboard')
  } else if (profile.role === 'admin') {
    redirect('/admin')
  } else if (profile.role === 'partner') {
    redirect('/partner')
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Request password reset - Generate token and send email
 */
export async function resetPassword(email: string) {
  const adminClient = createServiceClient()

  try {
    console.log(`🔐 Reset password request for: ${email}`)
    
    // 1. Get user from auth.users by email
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()
    const authUser = authUsers?.users?.find((user: any) => user.email === email)

    // Don't reveal if email exists (security)
    if (!authUser) {
      console.log(`⚠️ No user found for email: ${email}`)
      return { 
        success: true, 
        message: 'If an account with that email exists, you will receive a password reset email shortly.' 
      }
    }

    const userId = authUser.id
    console.log(`✅ Found auth user: ${userId}`)

    // 2. Get user profile by user_id
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, first_name')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.log(`⚠️ No profile found for user: ${userId}`)
      return { 
        success: true, 
        message: 'If an account with that email exists, you will receive a password reset email shortly.' 
      }
    }

    const firstName = profile.first_name || 'User'
    console.log(`✅ Found user profile: ${userId}, name: ${firstName}`)

    // 2. Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex')
    console.log(`✅ Generated reset token: ${resetToken.substring(0, 10)}...`)

    // 3. Store token in database (expires in 1 hour)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    const { error: tokenError } = await adminClient
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (tokenError) {
      console.error('❌ Token creation error:', tokenError)
      return { 
        success: true, 
        message: 'If an account with that email exists, you will receive a password reset email shortly.' 
      }
    }
    console.log(`✅ Stored reset token in database`)

    // 4. Send reset email via Resend
    try {
      console.log(`📧 About to send password reset email...`)
      const { sendPasswordResetEmail } = await import('./email.actions')
      
      const emailResult = await sendPasswordResetEmail(
        email,
        firstName,
        resetToken
      )

      if (!emailResult.success) {
        console.error('❌ Email service returned error:', emailResult.error)
        
        // Clean up token if email fails
        await adminClient
          .from('password_reset_tokens')
          .delete()
          .eq('token', resetToken)
        
        return { 
          error: 'Failed to send reset email. Please try again later.' 
        }
      }

      console.log('✅ Password reset email sent to:', email, 'Message ID:', emailResult.messageId)
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError)
      
      // Clean up token if email fails
      await adminClient
        .from('password_reset_tokens')
        .delete()
        .eq('token', resetToken)
      
      return { 
        error: 'Failed to send reset email. Please try again.' 
      }
    }

    return { 
      success: true, 
      message: 'If an account with that email exists, you will receive a password reset email shortly.' 
    }
  } catch (error) {
    console.error('❌ Reset password error:', error)
    return { 
      success: true, 
      message: 'If an account with that email exists, you will receive a password reset email shortly.' 
    }
  }
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(token: string) {
  const adminClient = createServiceClient()

  try {
    const { data: resetToken, error } = await adminClient
      .from('password_reset_tokens')
      .select('user_id, token, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !resetToken) {
      console.log(`⚠️ Token verification failed:`, error)
      return { 
        valid: false, 
        error: 'Invalid or expired reset link. Please request a new one.' 
      }
    }

    console.log(`✅ Token verified for user: ${resetToken.user_id}`)
    return {
      valid: true,
      userId: resetToken.user_id
    }
  } catch (error) {
    console.error('Verify token error:', error)
    return { 
      valid: false, 
      error: 'Invalid reset link. Please request a new one.' 
    }
  }
}

/**
 * Update password with reset token
 */
export async function updatePasswordWithToken(token: string, newPassword: string) {
  const adminClient = createServiceClient()

  try {
    // 1. Verify token is valid
    const verification = await verifyResetToken(token)
    
    if (!verification.valid || !verification.userId) {
      return { error: verification.error || 'Invalid reset link' }
    }

    // 2. Validate password
    if (newPassword.length < 6) {
      return { error: 'Password must be at least 6 characters long' }
    }

    // 3. Update user password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      verification.userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return { error: 'Failed to update password. Please try again.' }
    }

    // 4. Mark token as used
    await adminClient
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token)

    console.log('✅ Password updated successfully for user:', verification.userId)

    return { 
      success: true, 
      message: 'Password updated successfully!' 
    }
  } catch (error) {
    console.error('Update password with token error:', error)
    return { error: 'Failed to update password. Please try again.' }
  }
}

/**
 * Clean up expired tokens (run this periodically via cron)
 */
export async function cleanupExpiredTokens() {
  const adminClient = createServiceClient()

  try {
    const { error } = await adminClient
      .from('password_reset_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Cleanup error:', error)
      return { error: 'Failed to cleanup expired tokens' }
    }

    return { success: true, message: 'Expired tokens cleaned up' }
  } catch (error) {
    console.error('Cleanup error:', error)
    return { error: 'Failed to cleanup expired tokens' }
  }
}

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('getCurrentUser: No authenticated user')
    return null
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('getCurrentUser: Profile query error:', profileError)
  }

  if (!profile) {
    console.warn('getCurrentUser: No profile found for user', user.id)
  }

  return { ...user, profile }
}

export async function updateProfile(formData: {
  firstName: string
  lastName: string
  title?: string
  phone: string
  department: string
  faculty: string
  level?: number
  matricNumber?: string
  staffId?: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: formData.firstName,
      last_name: formData.lastName,
      title: formData.title,
      phone: formData.phone,
      department: formData.department,
      faculty: formData.faculty,
      level: formData.level,
      matric_number: formData.matricNumber,
      staff_id: formData.staffId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, message: 'Profile updated successfully!' }
}

export async function changePassword(newPassword: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, message: 'Password changed successfully!' }
}
