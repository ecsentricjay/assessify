'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth.actions'
import { processSubmissionPayment } from './transaction.actions'
import { checkAssignmentAccess } from './access-control'

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

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
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

  if (error) {
    return { error: 'Assignment not found or access code is invalid' }
  }

  if (!assignment) {
    return { error: 'Assignment not found or access code is invalid' }
  }

  // Get submission count
  const { count, error: countError } = await supabase
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
  const supabase = await createClient()
  const user = await getCurrentUser()

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

  // Create submission first
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
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (submissionError || !submission) {
    console.error('Submission error:', submissionError)
    return { error: 'Failed to submit assignment' }
  }

  // Process payment if submission cost > 0
  if (assignment.submission_cost > 0) {
    const paymentResult = await processSubmissionPayment({
      studentId: user.id,
      lecturerId: assignment.created_by,
      submissionAmount: assignment.submission_cost,
      sourceType: 'assignment_submission',
      sourceId: assignment.id,
      submissionId: submission.id,
      purpose: `Standalone assignment: ${assignment.title}`
    })

    if (!paymentResult.success) {
      // Mark submission as payment_pending
      await supabase
        .from('assignment_submissions')
        .update({ status: 'payment_pending' })
        .eq('id', submission.id)
      
      return { 
        error: paymentResult.error || 'Payment processing failed',
        submissionId: submission.id,
        requiresPayment: true
      }
    }
  }

  // Trigger plagiarism check if enabled
  if (assignment.plagiarism_check_enabled) {
    await supabase
      .from('assignment_submissions')
      .update({ plagiarism_check_status: 'queued' })
      .eq('id', submission.id)
  }

  // Trigger AI grading if enabled
  if (assignment.ai_grading_enabled) {
    await supabase
      .from('assignment_submissions')
      .update({ ai_grading_status: 'queued' })
      .eq('id', submission.id)
  }

  revalidatePath('/student/assignments')
  
  return { 
    success: true, 
    message: isLate 
      ? `Assignment submitted successfully! Note: ${lateDays} day(s) late.`
      : 'Assignment submitted successfully!',
    submission,
    paymentProcessed: assignment.submission_cost > 0
  }
}

export async function retryStandaloneSubmissionPayment(submissionId: string) {
  const user = await getCurrentUser()
  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  // Get submission
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

  // Process payment
  const paymentResult = await processSubmissionPayment({
    studentId: user.id,
    lecturerId: assignment.created_by,
    submissionAmount: assignment.submission_cost,
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

  // Update submission status
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

  // Get submission counts with revenue info
  const assignmentsWithCounts = await Promise.all(
    (assignments || []).map(async (assignment) => {
      const { count } = await supabase
        .from('assignment_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id)

      // Calculate revenue from submissions
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

  // Verify lecturer owns this assignment (access control on assignments table)
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
    return { success: false, error: error.message }
  }

  // Calculate submission statistics
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

  // Verify lecturer owns this assignment (access control on assignments table)
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

  // Check if there are any submissions
  const { count: submissionCount } = await supabase
    .from('assignment_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)

  // If has submissions and not forcing delete, return error with count
  if (submissionCount && submissionCount > 0 && !forceDelete) {
    return { 
      success: false,
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
      return { success: false, error: 'Failed to delete submissions. Please try again.' }
    }
  }

  // Delete the assignment
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

// Course-based assignment functions (aliases/wrappers for UI compatibility)

export async function createAssignment(formData: {
  courseId: string
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
  aiGradingEnabled: boolean
  aiRubric?: string | null
  plagiarismCheckEnabled: boolean
}) {
  // For course-based assignments - use createStandaloneAssignment with course context
  return await createStandaloneAssignment({
    displayCourseCode: '',
    displayCourseTitle: '',
    ...formData,
    submissionCost: 0
  })
}

export async function getAssignmentById(assignmentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Not authenticated', assignment: null }
  }

  // Get assignment
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
    .eq('id', assignmentId)
    .single()

  if (error || !assignment) {
    return { error: 'Assignment not found', assignment: null }
  }

  // Check access control
  if (user.profile?.role === 'lecturer' && assignment.created_by !== user.id) {
    return { error: 'You do not have permission to view this assignment', assignment: null }
  }

  return { assignment }
}

export async function updateAssignment(
  assignmentId: string,
  formData: {
    title?: string
    description?: string
    instructions?: string
    assignmentType?: string
    maxScore?: number
    deadline?: string
    lateSubmissionAllowed?: boolean
    latePenaltyPercentage?: number
    allowedFileTypes?: string[]
    maxFileSizeMb?: number
    aiGradingEnabled?: boolean
    aiRubric?: string | null
    plagiarismCheckEnabled?: boolean
  }
) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
  }

  const supabase = await createClient()
  const adminClient = createServiceClient()

  // Verify lecturer owns this assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, created_by')
    .eq('id', assignmentId)
    .single()

  if (!assignment || assignment.created_by !== user.id) {
    return { success: false, error: 'You do not have permission to update this assignment' }
  }

  // Update assignment
  const { data: updated, error } = await adminClient
    .from('assignments')
    .update({
      ...(formData.title && { title: formData.title }),
      ...(formData.description && { description: formData.description }),
      ...(formData.instructions && { instructions: formData.instructions }),
      ...(formData.assignmentType && { assignment_type: formData.assignmentType }),
      ...(formData.maxScore && { max_score: formData.maxScore }),
      ...(formData.deadline && { deadline: formData.deadline }),
      ...(formData.lateSubmissionAllowed !== undefined && { late_submission_allowed: formData.lateSubmissionAllowed }),
      ...(formData.latePenaltyPercentage !== undefined && { late_penalty_percentage: formData.latePenaltyPercentage }),
      ...(formData.allowedFileTypes && { allowed_file_types: formData.allowedFileTypes }),
      ...(formData.maxFileSizeMb !== undefined && { max_file_size_mb: formData.maxFileSizeMb }),
      ...(formData.aiGradingEnabled !== undefined && { ai_grading_enabled: formData.aiGradingEnabled }),
      ...(formData.aiRubric !== undefined && { ai_grading_rubric: formData.aiRubric }),
      ...(formData.plagiarismCheckEnabled !== undefined && { plagiarism_check_enabled: formData.plagiarismCheckEnabled }),
    })
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/lecturer/assignments')
  return { success: true, assignment: updated }
}

export async function getCourseAssignments(courseId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Not authenticated', assignments: [] }
  }

  // Get assignments for this course
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
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, assignments: [] }
  }

  return { assignments: assignments || [] }
}

export async function publishAssignment(assignmentId: string) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
  }

  const supabase = await createClient()
  const adminClient = createServiceClient()

  // Verify lecturer owns this assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, created_by')
    .eq('id', assignmentId)
    .single()

  if (!assignment || assignment.created_by !== user.id) {
    return { success: false, error: 'You do not have permission to publish this assignment' }
  }

  // Publish assignment
  const { data: updated, error } = await adminClient
    .from('assignments')
    .update({ is_published: true })
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/lecturer/assignments')
  return { success: true, assignment: updated }
}

export async function unpublishAssignment(assignmentId: string) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
  }

  const supabase = await createClient()
  const adminClient = createServiceClient()

  // Verify lecturer owns this assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, created_by')
    .eq('id', assignmentId)
    .single()

  if (!assignment || assignment.created_by !== user.id) {
    return { success: false, error: 'You do not have permission to unpublish this assignment' }
  }

  // Unpublish assignment
  const { data: updated, error } = await adminClient
    .from('assignments')
    .update({ is_published: false })
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/lecturer/assignments')
  return { success: true, assignment: updated }
}

export async function duplicateAssignment(assignmentId: string) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
  }

  const supabase = await createClient()
  const adminClient = createServiceClient()

  // Get original assignment
  const { data: original } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single()

  if (!original || original.created_by !== user.id) {
    return { success: false, error: 'You do not have permission to duplicate this assignment' }
  }

  // Create duplicate
  const { data: duplicate, error } = await adminClient
    .from('assignments')
    .insert({
      ...original,
      id: undefined, // Let DB generate new ID
      created_at: undefined, // Let DB generate new timestamp
      updated_at: undefined,
      title: `${original.title} (Copy)`,
      is_published: false,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/lecturer/assignments')
  return { success: true, assignment: duplicate }
}

export async function deleteAssignment(assignmentId: string, forceDelete: boolean = false) {
  // Alias for deleteStandaloneAssignment to support both naming conventions
  return await deleteStandaloneAssignment(assignmentId, forceDelete)
}