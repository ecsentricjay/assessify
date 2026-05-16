'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth.actions'
import { initializePaystackTransaction, verifyPaystackTransaction, formatAmountToKobo } from '@/lib/services/paystack.service'

function createServiceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstitutionLicenseStatus {
  isActive: boolean
  isInstitutional: boolean
  expiresAt: string | null
  daysRemaining: number | null
  lecturerEarningPerSubmission: number
  institutionId: string
  institutionName: string
}

export interface InstitutionAdminDashboard {
  institution: any
  licenseStatus: InstitutionLicenseStatus
  studentCount: number
  lecturerCount: number
  totalSubmissions: number
  recentPayments: any[]
}

// ─── License Checks ───────────────────────────────────────────────────────────

/**
 * Check if a student's institution has an active license
 * Called by processSubmissionPayment before charging student
 */
export async function checkInstitutionalCoverage(studentId: string): Promise<{
  isCovered: boolean
  isExpired: boolean
  hasInstitution: boolean
  institutionId: string | null
  lecturerEarning: number
  institutionName: string | null
}> {
  const adminClient = createServiceClient()

  try {
    // Get student's institution_id from profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('institution_id')
      .eq('id', studentId)
      .single()

    if (profileError || !profile?.institution_id) {
      return {
        isCovered: false,
        isExpired: false,
        hasInstitution: false,
        institutionId: null,
        lecturerEarning: 0,
        institutionName: null,
      }
    }

    // Get institution license details
    const { data: institution, error: instError } = await adminClient
      .from('institutions')
      .select('id, name, subscription_plan, subscription_expires_at, lecturer_earning_per_submission, is_active')
      .eq('id', profile.institution_id)
      .single()

    if (instError || !institution) {
      return {
        isCovered: false,
        isExpired: false,
        hasInstitution: true,
        institutionId: profile.institution_id,
        lecturerEarning: 0,
        institutionName: null,
      }
    }

    const isInstitutional = institution.subscription_plan === 'institutional'
    const isActive = institution.is_active === true
    const now = new Date()
    const expiresAt = institution.subscription_expires_at
      ? new Date(institution.subscription_expires_at)
      : null
    const isExpired = isInstitutional && (!expiresAt || now > expiresAt)
    const isCovered = isInstitutional && isActive && !isExpired

    return {
      isCovered,
      isExpired: isInstitutional && isExpired,
      hasInstitution: true,
      institutionId: institution.id,
      lecturerEarning: Number(institution.lecturer_earning_per_submission) || 0,
      institutionName: institution.name,
    }
  } catch (error) {
    console.error('checkInstitutionalCoverage error:', error)
    return {
      isCovered: false,
      isExpired: false,
      hasInstitution: false,
      institutionId: null,
      lecturerEarning: 0,
      institutionName: null,
    }
  }
}

/**
 * Get full license status for an institution
 */
export async function getInstitutionLicenseStatus(
  institutionId: string
): Promise<InstitutionLicenseStatus> {
  const adminClient = createServiceClient()

  const { data: institution } = await adminClient
    .from('institutions')
    .select('id, name, subscription_plan, subscription_expires_at, lecturer_earning_per_submission, is_active')
    .eq('id', institutionId)
    .single()

  if (!institution) {
    return {
      isActive: false,
      isInstitutional: false,
      expiresAt: null,
      daysRemaining: null,
      lecturerEarningPerSubmission: 0,
      institutionId,
      institutionName: '',
    }
  }

  const isInstitutional = institution.subscription_plan === 'institutional'
  const now = new Date()
  const expiresAt = institution.subscription_expires_at
    ? new Date(institution.subscription_expires_at)
    : null
  const isExpired = isInstitutional && expiresAt ? now > expiresAt : false
  const daysRemaining = expiresAt && !isExpired
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return {
    isActive: isInstitutional && !isExpired && institution.is_active,
    isInstitutional,
    expiresAt: institution.subscription_expires_at,
    daysRemaining,
    lecturerEarningPerSubmission: Number(institution.lecturer_earning_per_submission) || 0,
    institutionId: institution.id,
    institutionName: institution.name,
  }
}

// ─── Institution Admin: Dashboard ─────────────────────────────────────────────

/**
 * Get institution admin dashboard data
 */
export async function getInstitutionAdminDashboard(): Promise<{
  success: boolean
  data?: InstitutionAdminDashboard
  error?: string
}> {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'institution_admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = createServiceClient()
  const institutionId = user.profile?.institution_id

  if (!institutionId) {
    return { success: false, error: 'No institution linked to your account' }
  }

  // Get institution details
  const { data: institution, error: instError } = await adminClient
    .from('institutions')
    .select('*')
    .eq('id', institutionId)
    .single()

  if (instError || !institution) {
    return { success: false, error: 'Institution not found' }
  }

  const licenseStatus = await getInstitutionLicenseStatus(institutionId)

  // Count students
  const { count: studentCount } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .eq('role', 'student')

  // Count lecturers
  const { count: lecturerCount } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .eq('role', 'lecturer')

  // Count total submissions covered by institution
  const { count: totalSubmissions } = await adminClient
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('institution_id', institutionId)

  // Recent license payments
  const { data: recentPayments } = await adminClient
    .from('institutional_license_payments')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    success: true,
    data: {
      institution,
      licenseStatus,
      studentCount: studentCount || 0,
      lecturerCount: lecturerCount || 0,
      totalSubmissions: totalSubmissions || 0,
      recentPayments: recentPayments || [],
    },
  }
}

// ─── Institution Admin: User Management ───────────────────────────────────────

/**
 * Get all students in institution
 */
export async function getInstitutionStudents(page = 1, limit = 20) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'institution_admin') {
    return { success: false, error: 'Unauthorized', students: [] }
  }

  const adminClient = createServiceClient()
  const institutionId = user.profile?.institution_id
  const offset = (page - 1) * limit

  const { data: students, error, count } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, department, faculty, level, matric_number, is_active, created_at', { count: 'exact' })
    .eq('institution_id', institutionId)
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return { success: false, error: error.message, students: [] }
  }

  return { success: true, students: students || [], total: count || 0 }
}

/**
 * Get all lecturers in institution
 */
export async function getInstitutionLecturers(page = 1, limit = 20) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'institution_admin') {
    return { success: false, error: 'Unauthorized', lecturers: [] }
  }

  const adminClient = createServiceClient()
  const institutionId = user.profile?.institution_id
  const offset = (page - 1) * limit

  const { data: lecturers, error, count } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, department, faculty, staff_id, title, is_active, created_at', { count: 'exact' })
    .eq('institution_id', institutionId)
    .eq('role', 'lecturer')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return { success: false, error: error.message, lecturers: [] }
  }

  return { success: true, lecturers: lecturers || [], total: count || 0 }
}

/**
 * Invite a user (student or lecturer) to the institution via email
 */
export async function inviteInstitutionUser(data: {
  email: string
  role: 'student' | 'lecturer'
}) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'institution_admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = createServiceClient()
  const institutionId = user.profile?.institution_id

  if (!institutionId) {
    return { success: false, error: 'No institution linked to your account' }
  }

  // Check license is active before allowing more users
  const licenseStatus = await getInstitutionLicenseStatus(institutionId)
  if (!licenseStatus.isActive) {
    return { success: false, error: 'Your institution license is not active. Please renew to invite users.' }
  }

  // Check if already invited
  const { data: existing } = await adminClient
    .from('institution_invitations')
    .select('id, status')
    .eq('institution_id', institutionId)
    .eq('email', data.email.toLowerCase())
    .eq('status', 'pending')
    .single()

  if (existing) {
    return { success: false, error: 'An invitation has already been sent to this email' }
  }

  // Create invitation
  const { data: invitation, error: inviteError } = await adminClient
    .from('institution_invitations')
    .insert({
      institution_id: institutionId,
      invited_by: user.id,
      email: data.email.toLowerCase(),
      role: data.role,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (inviteError || !invitation) {
    console.error('Invitation creation error:', inviteError)
    return { success: false, error: 'Failed to create invitation' }
  }

  // TODO: Send invitation email with invite_code
  // await sendInstitutionInviteEmail(data.email, invitation.invite_code, licenseStatus.institutionName)

  revalidatePath('/institution/students')
  revalidatePath('/institution/lecturers')
  return { success: true, invitation }
}

/**
 * Remove a user from the institution
 */
export async function removeInstitutionUser(userId: string) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'institution_admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = createServiceClient()
  const institutionId = user.profile?.institution_id

  // Verify the user belongs to this institution
  const { data: targetProfile } = await adminClient
    .from('profiles')
    .select('id, institution_id, role')
    .eq('id', userId)
    .single()

  if (!targetProfile || targetProfile.institution_id !== institutionId) {
    return { success: false, error: 'User not found in your institution' }
  }

  if (targetProfile.role === 'institution_admin') {
    return { success: false, error: 'Cannot remove an institution admin' }
  }

  // Remove institution link (don't delete the user)
  const { error } = await adminClient
    .from('profiles')
    .update({ institution_id: null })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/institution/students')
  revalidatePath('/institution/lecturers')
  return { success: true }
}

// ─── License Payment ───────────────────────────────────────────────────────────

/**
 * Calculate license price for given student count and billing cycle
 */
export async function calculateLicensePrice(
  institutionId: string,
  studentCount: number,
  billingCycle: 'quarterly' | 'yearly'
): Promise<{ pricePerStudent: number; totalAmount: number; periodMonths: number }> {
  const adminClient = createServiceClient()

  const { data: institution } = await adminClient
    .from('institutions')
    .select('price_per_student, plan_billing_cycle')
    .eq('id', institutionId)
    .single()

  const pricePerStudent = Number(institution?.price_per_student) || 0
  const periodMonths = billingCycle === 'quarterly' ? 3 : 12

  // Yearly gets 15% discount
  const discount = billingCycle === 'yearly' ? 0.85 : 1
  const totalAmount = pricePerStudent * studentCount * periodMonths * discount

  return { pricePerStudent, totalAmount, periodMonths }
}

/**
 * Initialize license payment via Paystack
 */
export async function initializeLicensePayment(data: {
  studentCount: number
  billingCycle: 'quarterly' | 'yearly'
}) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'institution_admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = createServiceClient()
  const institutionId = user.profile?.institution_id

  if (!institutionId) {
    return { success: false, error: 'No institution linked to your account' }
  }

  const { pricePerStudent, totalAmount } = await calculateLicensePrice(
    institutionId,
    data.studentCount,
    data.billingCycle
  )

  if (totalAmount <= 0) {
    return { success: false, error: 'Invalid pricing configuration. Contact support.' }
  }

  // Calculate period
  const now = new Date()
  const periodMonths = data.billingCycle === 'quarterly' ? 3 : 12
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + periodMonths)

  const reference = `LIC-${institutionId.substring(0, 8)}-${Date.now()}`

  // Create pending payment record
  const { data: payment, error: paymentError } = await adminClient
    .from('institutional_license_payments')
    .insert({
      institution_id: institutionId,
      paid_by: user.id,
      student_count: data.studentCount,
      price_per_student: pricePerStudent,
      total_amount: totalAmount,
      billing_cycle: data.billingCycle,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
      paystack_reference: reference,
      status: 'pending',
    })
    .select()
    .single()

  if (paymentError || !payment) {
    console.error('License payment record error:', paymentError)
    return { success: false, error: 'Failed to create payment record' }
  }

  // Initialize Paystack transaction
  const result = await initializePaystackTransaction({
    reference,
    amount: formatAmountToKobo(totalAmount),
    email: user.email || '',
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/institution/license/callback`,
    metadata: {
      user_id: user.id,
      transaction_type: 'wallet_funding', // reuse existing type for Paystack
      institution_id: institutionId,
      payment_id: payment.id,
      license_type: 'institutional',
      billing_cycle: data.billingCycle,
      student_count: data.studentCount,
    },
  })

  if (!result.success) {
    return { success: false, error: result.error || 'Failed to initialize payment' }
  }

  return {
    success: true,
    authorizationUrl: result.authorizationUrl,
    reference,
    totalAmount,
    payment,
  }
}

/**
 * Verify and activate license after payment
 * Called from webhook or manual verification
 */
export async function activateInstitutionLicense(paystackReference: string) {
  const adminClient = createServiceClient()

  try {
    // Verify with Paystack
    const verification = await verifyPaystackTransaction(paystackReference)

    if (!verification?.status || verification.data?.status !== 'success') {
      return { success: false, error: 'Payment verification failed' }
    }

    // Get payment record
    const { data: payment, error: paymentError } = await adminClient
      .from('institutional_license_payments')
      .select('*')
      .eq('paystack_reference', paystackReference)
      .single()

    if (paymentError || !payment) {
      return { success: false, error: 'Payment record not found' }
    }

    if (payment.status === 'active') {
      return { success: true, message: 'License already activated' }
    }

    // Activate payment record
    await adminClient
      .from('institutional_license_payments')
      .update({ status: 'active' })
      .eq('id', payment.id)

    // Activate institution license
    await adminClient
      .from('institutions')
      .update({
        subscription_plan: 'institutional',
        subscription_expires_at: payment.period_end,
        student_count: payment.student_count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.institution_id)

    console.log('✅ Institution license activated:', payment.institution_id, 'until', payment.period_end)

    return { success: true, message: 'License activated successfully', payment }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('License activation error:', message)
    return { success: false, error: message }
  }
}

// ─── Self Registration ─────────────────────────────────────────────────────────

/**
 * Validate a self-register code and return institution details
 * Called during signup when a student/lecturer enters an institution code
 */
export async function validateInstitutionCode(code: string): Promise<{
  valid: boolean
  institution?: { id: string; name: string; code: string }
  error?: string
}> {
  const adminClient = createServiceClient()

  const { data: institution, error } = await adminClient
    .from('institutions')
    .select('id, name, code, subscription_plan, subscription_expires_at, self_register_enabled, is_active')
    .eq('self_register_code', code.toUpperCase())
    .single()

  if (error || !institution) {
    return { valid: false, error: 'Invalid institution code' }
  }

  if (!institution.is_active) {
    return { valid: false, error: 'This institution is not active on Assessify' }
  }

  if (!institution.self_register_enabled) {
    return { valid: false, error: 'Self-registration is not enabled for this institution' }
  }

  // Check license is active
  const isInstitutional = institution.subscription_plan === 'institutional'
  const expiresAt = institution.subscription_expires_at
    ? new Date(institution.subscription_expires_at)
    : null
  const isExpired = isInstitutional && (!expiresAt || new Date() > expiresAt)

  if (!isInstitutional || isExpired) {
    return { valid: false, error: 'This institution does not have an active license' }
  }

  return {
    valid: true,
    institution: { id: institution.id, name: institution.name, code: institution.code },
  }
}

// ─── Super Admin: Institution Management ──────────────────────────────────────

/**
 * Configure institution pricing and settings (super admin only)
 */
export async function configureInstitution(
  institutionId: string,
  config: {
    pricePerStudent?: number
    lecturerEarningPerSubmission?: number
    selfRegisterEnabled?: boolean
    planBillingCycle?: 'quarterly' | 'yearly'
  }
) {
  const user = await getCurrentUser()
  if (!user || !['admin', 'super_admin'].includes(user.profile?.role)) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = createServiceClient()

  const { error } = await adminClient
    .from('institutions')
    .update({
      ...(config.pricePerStudent !== undefined && { price_per_student: config.pricePerStudent }),
      ...(config.lecturerEarningPerSubmission !== undefined && {
        lecturer_earning_per_submission: config.lecturerEarningPerSubmission,
      }),
      ...(config.selfRegisterEnabled !== undefined && {
        self_register_enabled: config.selfRegisterEnabled,
      }),
      ...(config.planBillingCycle && { plan_billing_cycle: config.planBillingCycle }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', institutionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/institutions')
  return { success: true }
}

/**
 * Create an institution admin account (super admin only)
 */
export async function createInstitutionAdmin(data: {
  institutionId: string
  email: string
  firstName: string
  lastName: string
  password: string
  phone: string
}) {
  const user = await getCurrentUser()
  if (!user || !['admin', 'super_admin'].includes(user.profile?.role)) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = createServiceClient()

  // Verify institution exists
  const { data: institution } = await adminClient
    .from('institutions')
    .select('id, name')
    .eq('id', data.institutionId)
    .single()

  if (!institution) {
    return { success: false, error: 'Institution not found' }
  }

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      first_name: data.firstName,
      last_name: data.lastName,
      role: 'institution_admin',
    },
  })

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Failed to create user' }
  }

  // Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: authData.user.id,
      institution_id: data.institutionId,
      first_name: data.firstName,
      last_name: data.lastName,
      role: 'institution_admin',
      phone: data.phone,
      email_verified: true,
      is_active: true,
    }, { onConflict: 'id' })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    // Clean up auth user
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: 'Failed to create admin profile' }
  }

  // Create wallet
  await adminClient
    .from('wallets')
    .insert({ user_id: authData.user.id, balance: 0 })
    .select()

  revalidatePath('/admin/institutions')
  return { success: true, userId: authData.user.id }
}

/**
 * Get all institutions with license status (super admin only)
 */
export async function getAllInstitutions() {
  const user = await getCurrentUser()
  if (!user || !['admin', 'super_admin'].includes(user.profile?.role)) {
    return { success: false, error: 'Unauthorized', institutions: [] }
  }

  const adminClient = createServiceClient()

  const { data: institutions, error } = await adminClient
    .from('institutions')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return { success: false, error: error.message, institutions: [] }
  }

  // Enrich with user counts
  const enriched = await Promise.all(
    (institutions || []).map(async (inst) => {
      const { count: studentCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', inst.id)
        .eq('role', 'student')

      const { count: lecturerCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', inst.id)
        .eq('role', 'lecturer')

      const now = new Date()
      const expiresAt = inst.subscription_expires_at
        ? new Date(inst.subscription_expires_at)
        : null
      const licenseActive =
        inst.subscription_plan === 'institutional' &&
        inst.is_active &&
        expiresAt !== null &&
        now < expiresAt

      return {
        ...inst,
        studentCount: studentCount || 0,
        lecturerCount: lecturerCount || 0,
        licenseActive,
      }
    })
  )

  return { success: true, institutions: enriched }
}

// ─── Usage Reports ─────────────────────────────────────────────────────────────

/**
 * Get submission usage report for an institution
 */
export async function getInstitutionUsageReport(period?: { from: string; to: string }) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'institution_admin') {
    return { success: false, error: 'Unauthorized' }
  }

  const adminClient = createServiceClient()
  const institutionId = user.profile?.institution_id

  let query = adminClient
    .from('transactions')
    .select('id, amount, created_at, type, purpose, user_id')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false })

  if (period?.from) query = query.gte('created_at', period.from)
  if (period?.to) query = query.lte('created_at', period.to)

  const { data: transactions, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  const totalSubmissions = transactions?.length || 0
  const totalCost = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0

  return {
    success: true,
    report: {
      totalSubmissions,
      totalCost,
      transactions: transactions || [],
    },
  }
}