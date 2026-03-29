'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth.actions'
import { processSubmissionPayment } from './transaction.actions'
import { sendAssignmentSubmittedEmail } from './email.actions'

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

// Generate unique access code
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createStandaloneAssignment(formData: {
  displayCourseCode: string
  displayCourseTitle: string
  title: string
  description: string
  instructions?: string
  assignmentType: string
  maxScore: number
  deadline: string
  lateSubmissionAllowed: boolean
  latePenaltyPercentage: number
  allowedFileTypes: string[]
  maxFileSizeMb: number
  submissionCost: number
  aiGradingEnabled: boolean
  aiRubric?: string | null
  plagiarismCheckEnabled: boolean
}) {
  const user = await getCurrentUser()

  console.log('=== Assignment Creation ===')
  console.log('User:', user?.id)
  console.log('Profile:', user?.profile)
  console.log('Role:', user?.profile?.role)

  if (!user) {
    return { success: false, error: 'Unauthorized access: Not authenticated' }
  }

  if (!user.profile) {
    return { success: false, error: 'Unauthorized access: Profile not found' }
  }

  if (user.profile.role !== 'lecturer') {
    return { success: false, error: `Unauthorized access: You are a ${user.profile.role}, only lecturers can create assignments` }
  }

  const adminClient = createServiceClient()

  // Generate unique access code
  let accessCode = generateAccessCode()
  let codeExists = true
  let attempts = 0

  while (codeExists && attempts < 10) {
    const { data: existing } = await adminClient
      .from('assignments')
      .select('id')
      .eq('access_code', accessCode)
      .single()

    if (!existing) {
      codeExists = false
    } else {
      accessCode = generateAccessCode()
      attempts++
    }
  }

  if (codeExists) {
    return { success: false, error: 'Failed to generate unique access code. Please try again.' }
  }

  // Create standalone assignment
  const { data: assignment, error } = await adminClient
    .from('assignments')
    .insert({
      created_by: user.id,
      is_standalone: true,
      access_code: accessCode,
      display_course_code: formData.displayCourseCode,
      display_course_title: formData.displayCourseTitle,
      title: formData.title,
      description: formData.description,
      instructions: formData.instructions,
      assignment_type: formData.assignmentType,
      max_score: formData.maxScore,
      allocated_marks: formData.maxScore,
      deadline: formData.deadline,
      late_submission_allowed: formData.lateSubmissionAllowed,
      late_penalty_percentage: formData.latePenaltyPercentage,
      allowed_file_types: formData.allowedFileTypes,
      max_file_size_mb: formData.maxFileSizeMb,
      submission_cost: formData.submissionCost,
      ai_grading_enabled: formData.aiGradingEnabled,
      ai_grading_rubric: formData.aiRubric || null,
      plagiarism_check_enabled: formData.plagiarismCheckEnabled,
      is_published: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Standalone assignment creation error:', error)
    return { success: false, error: error.message }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const shareableLink = `${baseUrl}/assignments/${accessCode}`

  revalidatePath('/lecturer/assignments')
  return { 
    success: true, 
    assignment,
    accessCode,
    shareableLink
  }
}

export async function getStandaloneAssignmentByCode(accessCode: string) {
  const supabase = await createClient()

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      *,
      profiles:created_by (
        first_name,
        last_name,
        title
      )
    `)
    .eq('access_code', accessCode.toUpperCase())
    .eq('is_standalone', true)
    .eq('is_published', true)
    .single()

  if (error || !assignment) {
    return { error: 'Assignment not found or access code is invalid' }
  }

  // Get submission count
  const { count } = await supabase
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignment.id)

  return { 
    assignment: {
      ...assignment,
      submissionCount: count || 0
    }
  }
}

export async function submitStandaloneAssignment(formData: {
  assignmentId: string
  submissionText?: string
  fileUrls: string[]
}) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'You must be logged in as a student to submit assignments' }
  }

  const supabase = await createClient()

  console.log('🎯 === STANDALONE SUBMISSION START ===')
  console.log('Assignment ID:', formData.assignmentId)
  console.log('Student ID:', user.id)

  // Get assignment details
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', formData.assignmentId)
    .eq('is_standalone', true)
    .single()

  if (assignmentError || !assignment) {
    console.error('❌ Assignment not found:', assignmentError)
    return { error: 'Assignment not found' }
  }

  console.log('✅ Assignment found:', assignment.title)
  console.log('💰 Submission cost:', assignment.submission_cost)

  // Check deadline
  const deadline = new Date(assignment.deadline)
  const now = new Date()
  const isLate = now > deadline
  const lateDays = isLate ? Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0

  if (isLate && !assignment.late_submission_allowed) {
    return { error: 'The deadline for this assignment has passed' }
  }

  // Check for existing submission
  const { data: existingSubmission } = await supabase
    .from('assignment_submissions')
    .select('id')
    .eq('assignment_id', formData.assignmentId)
    .eq('student_id', user.id)
    .single()

  if (existingSubmission) {
    return { error: 'You have already submitted this assignment' }
  }

  // Get submission cost from assignment, or use default
  const { getDefaultSubmissionCost } = await import('./settings.actions')
  const assignmentCost = Number(assignment.submission_cost) || null
  const submissionCost = assignmentCost !== null && assignmentCost > 0 ? assignmentCost : await getDefaultSubmissionCost()
  console.log('📊 Parsed submission cost:', submissionCost, '(from assignment:', assignmentCost, ')')

  // Check wallet balance BEFORE creating submission
  if (submissionCost > 0) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    console.log('💵 Student wallet balance:', wallet?.balance)

    if (!wallet || Number(wallet.balance) < submissionCost) {
      console.error('❌ Insufficient balance')
      return { 
        error: `Insufficient wallet balance. Required: ₦${submissionCost}, Available: ₦${wallet?.balance || 0}`,
        requiresPayment: true
      }
    }
  }

  // Create submission first
  console.log('📝 Creating submission record...')
  const { data: submission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .insert({
      assignment_id: formData.assignmentId,
      student_id: user.id,
      student_name: `${user.profile?.first_name} ${user.profile?.last_name}`,
      student_email: user.email,
      submission_text: formData.submissionText,
      file_urls: formData.fileUrls,
      is_late: isLate,
      late_days: lateDays,
      status: submissionCost > 0 ? 'payment_pending' : 'submitted',
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (submissionError || !submission) {
    console.error('❌ Submission creation error:', submissionError)
    return { error: 'Failed to submit assignment' }
  }

  console.log('✅ Submission created:', submission.id)

  // Process payment if submission cost > 0
  if (submissionCost > 0) {
    console.log('💳 Processing payment...')
    console.log('Payment details:', {
      studentId: user.id,
      lecturerId: assignment.created_by,
      amount: submissionCost,
      submissionId: submission.id
    })
    
    const paymentResult = await processSubmissionPayment({
      studentId: user.id,
      lecturerId: assignment.created_by,
      submissionAmount: submissionCost,
      sourceType: 'assignment_submission',
      sourceId: assignment.id,
      submissionId: submission.id,
      purpose: `Standalone assignment: ${assignment.title}`
    })

    console.log('💳 Payment result:', paymentResult)

    if (!paymentResult.success) {
      console.error('❌ Payment failed:', paymentResult.error)
      return { 
        error: paymentResult.error || 'Payment processing failed',
        submissionId: submission.id,
        requiresPayment: true
      }
    }

    // Update submission status to submitted after successful payment
    console.log('✅ Payment successful, updating submission status...')
    await supabase
      .from('assignment_submissions')
      .update({ status: 'submitted' })
      .eq('id', submission.id)

    console.log('✅ Payment processed successfully')
  } else {
    console.log('ℹ️ No payment required (cost is 0)')
  }

  // Send email notification
  try {
    await sendAssignmentSubmittedEmail(
      user.email || '',
      user.profile?.first_name || 'Student',
      assignment.display_course_title || 'Course',
      assignment.title,
      new Date().toLocaleDateString(),
      submission.id
    )
  } catch (emailError) {
    console.error('⚠️ Email notification failed:', emailError)
  }

  revalidatePath('/student/assignments')
  
  console.log('🎯 === STANDALONE SUBMISSION COMPLETE ===')
  
  return { 
    success: true, 
    message: isLate 
      ? `Assignment submitted successfully! Note: ${lateDays} day(s) late.`
      : 'Assignment submitted successfully!',
    submission,
    paymentProcessed: submissionCost > 0
  }
}

export async function retryStandaloneSubmissionPayment(submissionId: string) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('*, assignments(*)')
    .eq('id', submissionId)
    .eq('student_id', user.id)
    .single()

  if (!submission) {
    return { error: 'Submission not found' }
  }

  const assignment = submission.assignments

  const { getDefaultSubmissionCost } = await import('./settings.actions')
  const assignmentCost = Number(assignment.submission_cost) || null
  const submissionCost = assignmentCost !== null && assignmentCost > 0 ? assignmentCost : await getDefaultSubmissionCost()

  const paymentResult = await processSubmissionPayment({
    studentId: user.id,
    lecturerId: assignment.created_by,
    submissionAmount: submissionCost,
    sourceType: 'assignment_submission',
    sourceId: assignment.id,
    submissionId: submission.id,
    purpose: `Standalone assignment: ${assignment.title}`
  })

  if (!paymentResult.success) {
    return { 
      error: paymentResult.error || 'Payment processing failed'
    }
  }

  await supabase
    .from('assignment_submissions')
    .update({ status: 'submitted' })
    .eq('id', submission.id)

  revalidatePath('/student/assignments')
  return { success: true, message: 'Payment processed successfully' }
}

export async function getLecturerStandaloneAssignments() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access', assignments: [] }
  }

  const { data: assignments, error } = await supabase
    .from('assignments')
    .select(`
      *,
      profiles:created_by (
        first_name,
        last_name,
        title
      )
    `)
    .eq('created_by', user.id)
    .eq('is_standalone', true)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message, assignments: [] }
  }

  const assignmentsWithCounts = await Promise.all(
    (assignments || []).map(async (assignment) => {
      const { count } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id)

      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('status', 'submitted')

      const totalRevenue = assignment.submission_cost * (submissions?.length || 0)

      return {
        ...assignment,
        submissionCount: count || 0,
        totalRevenue
      }
    })
  )

  return { success: true, assignments: assignmentsWithCounts }
}

export async function getStandaloneAssignmentSubmissions(assignmentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
  }

  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('created_by', user.id)
    .eq('is_standalone', true)
    .single()

  if (!assignment) {
    return { success: false, error: 'Assignment not found or you do not have permission to view it' }
  }

  const { data: submissions, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      profiles:student_id (
        first_name,
        last_name,
        matric_number,
        level,
        department
      )
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  const stats = {
    total: submissions?.length || 0,
    submitted: submissions?.filter(s => s.status === 'submitted').length || 0,
    graded: submissions?.filter(s => s.final_score !== null).length || 0,
    pending_payment: submissions?.filter(s => s.status === 'payment_pending').length || 0,
    total_revenue: assignment.submission_cost * (submissions?.filter(s => s.status === 'submitted').length || 0)
  }

  return { success: true, assignment, submissions, stats }
}

export async function exportStandaloneSubmissions(assignmentId: string, format: 'csv' | 'pdf' = 'csv') {
  const { assignment, submissions, error } = await getStandaloneAssignmentSubmissions(assignmentId)

  if (error || !submissions) {
    return { error: error || 'No submissions to export' }
  }

  if (format === 'csv') {
    const csvRows = [
      ['Student Name', 'Matric Number', 'Email', 'Level', 'Department', 'Submitted At', 'Status', 'Score', 'Late', 'Feedback'],
      ...submissions.map(sub => [
        sub.student_name || 'N/A',
        sub.profiles?.matric_number || 'N/A',
        sub.student_email || 'N/A',
        sub.profiles?.level || 'N/A',
        sub.profiles?.department || 'N/A',
        new Date(sub.submitted_at).toLocaleString(),
        sub.status,
        sub.final_score !== null ? sub.final_score.toString() : 'Not graded',
        sub.is_late ? `Yes (${sub.late_days} days)` : 'No',
        sub.lecturer_feedback || 'No feedback'
      ])
    ]

    const csvContent = csvRows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    return {
      success: true,
      data: csvContent,
      filename: `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_submissions_${new Date().toISOString().split('T')[0]}.csv`
    }
  }

  return { error: 'PDF export not yet implemented' }
}

export async function deleteStandaloneAssignment(
  assignmentId: string, 
  forceDelete: boolean = false
) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
  }

  const supabase = await createClient()
  const adminClient = createServiceClient()

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, created_by, is_standalone, title')
    .eq('id', assignmentId)
    .eq('is_standalone', true)
    .single()

  if (!assignment) {
    return { success: false, error: 'Assignment not found' }
  }

  if (assignment.created_by !== user.id) {
    return { success: false, error: 'You do not have permission to delete this assignment' }
  }

  const { count: submissionCount } = await supabase
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)

  if (submissionCount && submissionCount > 0 && !forceDelete) {
    return { 
      success: false,
      error: 'HAS_SUBMISSIONS',
      submissionCount,
      message: `This assignment has ${submissionCount} submission(s).`
    }
  }

  if (submissionCount && submissionCount > 0 && forceDelete) {
    const { error: submissionDeleteError } = await adminClient
      .from('assignment_submissions')
      .delete()
      .eq('assignment_id', assignmentId)

    if (submissionDeleteError) {
      console.error('Error deleting submissions:', submissionDeleteError)
      return { success: false, error: 'Failed to delete submissions. Please try again.' }
    }
  }

  const { error: deleteError } = await adminClient
    .from('assignments')
    .delete()
    .eq('id', assignmentId)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return { success: false, error: 'Failed to delete assignment. Please try again.' }
  }

  revalidatePath('/lecturer/assignments/standalone')
  return { 
    success: true, 
    message: `Assignment "${assignment.title}" deleted successfully!`
  }
}