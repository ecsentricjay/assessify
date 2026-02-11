'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth.actions'

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
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like 0, O, I, 1
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

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  const adminClient = createServiceClient()

  // Generate unique access code
  let accessCode = generateAccessCode()
  let codeExists = true
  let attempts = 0

  // Ensure unique code
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
    return { error: 'Failed to generate unique access code. Please try again.' }
  }

  // Create standalone assignment (no course_id required)
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
      allocated_marks: formData.maxScore, // For standalone, allocated marks = max score
      deadline: formData.deadline,
      late_submission_allowed: formData.lateSubmissionAllowed,
      late_penalty_percentage: formData.latePenaltyPercentage,
      allowed_file_types: formData.allowedFileTypes,
      max_file_size_mb: formData.maxFileSizeMb,
      submission_cost: formData.submissionCost,
      ai_grading_enabled: formData.aiGradingEnabled,
      ai_grading_rubric: formData.aiRubric || null,
      plagiarism_check_enabled: formData.plagiarismCheckEnabled,
      is_published: true, // Auto-publish standalone assignments
    })
    .select()
    .single()

  if (error) {
    console.error('Standalone assignment creation error:', error)
    return { error: error.message }
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
  console.log('🔍 Looking for assignment with code:', accessCode.toUpperCase())

  // First, let's check if ANY standalone assignments exist
  const { data: allStandalone, error: allError } = await supabase
    .from('assignments')
    .select('access_code, title, is_standalone, is_published')
    .eq('is_standalone', true)

  console.log('📋 All standalone assignments:', allStandalone, allError)

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

  console.log('📊 Query result:', { assignment, error })
  console.log('🔑 Full error details:', JSON.stringify(error, null, 2))

  if (error) {
    console.error('❌ Database error:', error)
    
    // Check if it's a "no rows" error vs actual error
    if (error.code === 'PGRST116') {
      console.log('ℹ️ No matching assignment found - likely wrong code or filters')
    }
    
    return { error: 'Assignment not found or access code is invalid' }
  }

  if (!assignment) {
    console.log('❌ No assignment found')
    return { error: 'Assignment not found or access code is invalid' }
  }

  console.log('✅ Assignment found:', assignment.title, assignment.id)

  // Get submission count
  const { count, error: countError } = await supabase
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignment.id)

  console.log('📈 Submission count:', count, countError)

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
  const supabase = await createClient()
  const adminClient = createServiceClient()
  const user = await getCurrentUser()

  // MUST be logged in as student
  if (!user || user.profile?.role !== 'student') {
    return { error: 'You must be logged in as a student to submit assignments' }
  }

  // Get assignment details
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', formData.assignmentId)
    .eq('is_standalone', true)
    .single()

  if (assignmentError || !assignment) {
    return { error: 'Assignment not found' }
  }

  // Check deadline
  const deadline = new Date(assignment.deadline)
  const now = new Date()
  const isLate = now > deadline
  const lateDays = isLate ? Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0

  if (isLate && !assignment.late_submission_allowed) {
    return { error: 'The deadline for this assignment has passed' }
  }

  // Check for existing submission by this student
  const { data: existingSubmission } = await supabase
    .from('assignment_submissions')
    .select('id')
    .eq('assignment_id', formData.assignmentId)
    .eq('student_id', user.id)
    .single()

  if (existingSubmission) {
    return { error: 'You have already submitted this assignment' }
  }

  // Handle payment if needed
  if (assignment.submission_cost > 0) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .single()

    if (!wallet) {
      return { error: 'Wallet not found' }
    }

    if (wallet.balance < assignment.submission_cost) {
      return { error: `Insufficient balance. You need ₦${assignment.submission_cost} to submit.` }
    }

    // Deduct from wallet
    const { data: currentWallet } = await adminClient
      .from('wallets')
      .select('total_spent')
      .eq('id', wallet.id)
      .single()

    const newBalance = wallet.balance - assignment.submission_cost
    const newTotalSpent = (currentWallet?.total_spent || 0) + assignment.submission_cost

    await adminClient
      .from('wallets')
      .update({
        balance: newBalance,
        total_spent: newTotalSpent,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    // Create transaction
    const transactionRef = `STANDALONE-${Date.now()}-${user.id.slice(0, 8)}`
    await adminClient.from('transactions').insert({
      wallet_id: wallet.id,
      type: 'debit',
      purpose: 'assignment_submission',
      amount: assignment.submission_cost,
      balance_before: wallet.balance,
      balance_after: newBalance,
      reference: transactionRef,
      description: `Standalone assignment: ${assignment.title}`,
      status: 'completed'
    })

    // Credit lecturer
    const lecturerShare = assignment.submission_cost * 0.7
    await adminClient.from('lecturer_earnings').insert({
      lecturer_id: assignment.created_by,
      amount: lecturerShare,
      source_type: 'assignment',
      source_id: assignment.id,
      revenue_share_percentage: 70,
      withdrawn: false
    })
  }

  // Create submission with student details
  const { data: submission, error: submissionError } = await adminClient
    .from('assignment_submissions')
    .insert({
      assignment_id: formData.assignmentId,
      student_id: user.id,
      student_name: `${user.profile.first_name} ${user.profile.last_name}`,
      student_email: user.email,
      submission_text: formData.submissionText,
      file_urls: formData.fileUrls,
      is_late: isLate,
      late_days: lateDays,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (submissionError) {
    console.error('Submission error:', submissionError)
    return { error: 'Failed to submit assignment' }
  }

  return { 
    success: true, 
    message: isLate 
      ? `Assignment submitted successfully! Note: ${lateDays} day(s) late.`
      : 'Assignment submitted successfully!',
    submission 
  }
}

export async function getLecturerStandaloneAssignments() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
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
    return { error: error.message }
  }

  // Get submission counts
  const assignmentsWithCounts = await Promise.all(
    (assignments || []).map(async (assignment) => {
      const { count } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id)

      return {
        ...assignment,
        submissionCount: count || 0
      }
    })
  )

  return { assignments: assignmentsWithCounts }
}

export async function getStandaloneAssignmentSubmissions(assignmentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  // Verify lecturer owns this assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('created_by', user.id)
    .eq('is_standalone', true)
    .single()

  if (!assignment) {
    return { error: 'Assignment not found' }
  }

  // Get all submissions
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
    return { error: error.message }
  }

  return { assignment, submissions }
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
// Add this function to: src/lib/actions/standalone-assignment.actions.ts

// Update in: src/lib/actions/standalone-assignment.actions.ts

export async function deleteStandaloneAssignment(
  assignmentId: string, 
  forceDelete: boolean = false
) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const adminClient = createServiceClient()

  // Verify lecturer owns this assignment and it's standalone
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, created_by, is_standalone, title')
    .eq('id', assignmentId)
    .eq('is_standalone', true)
    .single()

  if (!assignment) {
    return { error: 'Assignment not found' }
  }

  if (assignment.created_by !== user.id) {
    return { error: 'You do not have permission to delete this assignment' }
  }

  // Check if there are any submissions
  const { count: submissionCount } = await supabase
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)

  // If has submissions and not forcing delete, return error with count
  if (submissionCount && submissionCount > 0 && !forceDelete) {
    return { 
      error: 'HAS_SUBMISSIONS',
      submissionCount,
      message: `This assignment has ${submissionCount} submission(s).`
    }
  }

  // If force delete, first delete all submissions
  if (submissionCount && submissionCount > 0 && forceDelete) {
    const { error: submissionDeleteError } = await adminClient
      .from('assignment_submissions')
      .delete()
      .eq('assignment_id', assignmentId)

    if (submissionDeleteError) {
      console.error('Error deleting submissions:', submissionDeleteError)
      return { error: 'Failed to delete submissions. Please try again.' }
    }

    console.log(`✅ Deleted ${submissionCount} submissions for assignment ${assignmentId}`)
  }

  // Delete the assignment
  const { error: deleteError } = await adminClient
    .from('assignments')
    .delete()
    .eq('id', assignmentId)

  if (deleteError) {
    console.error('Delete error:', deleteError)
    return { error: 'Failed to delete assignment. Please try again.' }
  }

  // Log the deletion for audit purposes
  await adminClient
    .from('audit_logs')
    .insert({
      user_id: user.id,
      action: 'DELETE_STANDALONE_ASSIGNMENT',
      resource_type: 'assignment',
      resource_id: assignmentId,
      details: {
        title: assignment.title,
        submissions_deleted: submissionCount || 0,
        force_delete: forceDelete
      }
    })

  revalidatePath('/lecturer/assignments/standalone')
  return { 
    success: true, 
    message: forceDelete && submissionCount
      ? `Assignment "${assignment.title}" and ${submissionCount} submission(s) deleted successfully!`
      : `Assignment "${assignment.title}" deleted successfully!`
  }
}