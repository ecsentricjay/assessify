'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth.actions'
import { processSubmissionPayment } from './transaction.actions'
import { sendAssignmentSubmittedEmail } from './email.actions'

export async function getAssignmentForStudent(assignmentId: string) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized', assignment: null }
  }

  const supabase = await createClient()

  // Get assignment details
  const { data: assignment, error: assignmentError } = await supabase
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

  if (assignmentError || !assignment) {
    return { error: 'Assignment not found', assignment: null }
  }

  // Check if assignment is published
  if (!assignment.is_published) {
    return { error: 'This assignment is not available', assignment: null }
  }

  // Check if student is enrolled in the course (if not standalone)
  if (assignment.course_id) {
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('student_id', user.id)
      .eq('enrollment_status', 'active')
      .single()

    if (!enrollment) {
      return { error: 'You are not enrolled in this course', assignment: null }
    }
  }

  // Check if student has already submitted
  const { data: existingSubmission } = await supabase
    .from('assignment_submissions')
    .select('id, status, submitted_at')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single()

  return { 
    assignment: {
      ...assignment,
      studentSubmission: existingSubmission || null
    }
  }
}

export async function getStudentAssignments() {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized', assignments: [] }
  }

  const supabase = await createClient()

  // Get all assignments for courses the student is enrolled in
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      description,
      deadline,
      allocated_marks,
      submission_cost,
      is_published,
      late_submission_allowed,
      course_id,
      courses!inner (
        id,
        course_code,
        course_title,
        display_course_title
      )
    `)
    .eq('is_published', true)
    .not('courses', 'is', null)
    .order('deadline', { ascending: true })

  if (assignmentsError) {
    console.error('Error fetching student assignments:', assignmentsError)
    return { error: 'Failed to fetch assignments', assignments: [] }
  }

  // Filter to only courses student is enrolled in
  const assignmentsForStudent = []
  const now = new Date()

  for (const assignment of assignments || []) {
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('student_id', user.id)
      .eq('enrollment_status', 'active')
      .single()

    if (enrollment) {
      // Check if student has submitted
      const { data: submission } = await supabase
        .from('assignment_submissions')
        .select('id, status, submitted_at')
        .eq('assignment_id', assignment.id)
        .eq('student_id', user.id)
        .single()

      const deadline = new Date(assignment.deadline)
      const isOverdue = now > deadline && !submission

      assignmentsForStudent.push({
        ...assignment,
        hasSubmitted: !!submission,
        isOverdue,
        submissionStatus: submission?.status || null,
        submissionDate: submission?.submitted_at || null
      })
    }
  }

  return { assignments: assignmentsForStudent }
}

export async function submitAssignment(formData: {
  assignmentId: string
  submissionText?: string
  fileUrls: string[]
}) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  console.log('=== SUBMISSION START ===')
  console.log('Assignment ID:', formData.assignmentId)
  console.log('Student ID:', user.id)

  // Get assignment details
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', formData.assignmentId)
    .single()

  if (assignmentError || !assignment) {
    console.error('Assignment not found:', assignmentError)
    return { error: 'Assignment not found' }
  }

  console.log('Assignment found:', assignment.title)
  console.log('Submission cost:', assignment.submission_cost)

  // Check if assignment is published
  if (!assignment.is_published) {
    return { error: 'This assignment is not available for submission' }
  }

  // Check if student is enrolled in the course (if not standalone)
  if (assignment.course_id) {
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('student_id', user.id)
      .eq('enrollment_status', 'active')
      .single()

    if (!enrollment) {
      return { error: 'You are not enrolled in this course' }
    }
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

  // Check deadline
  const deadline = new Date(assignment.deadline)
  const now = new Date()
  const isLate = now > deadline
  const lateDays = isLate ? Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0

  if (isLate && !assignment.late_submission_allowed) {
    return { error: 'The deadline for this assignment has passed' }
  }

  // Get submission cost from assignment, or use default
  const { getDefaultSubmissionCost } = await import('./settings.actions')
  const assignmentCost = Number(assignment.submission_cost) || null
  const submissionCost = assignmentCost !== null && assignmentCost > 0 ? assignmentCost : await getDefaultSubmissionCost()
  console.log('Parsed submission cost:', submissionCost, '(from assignment:', assignmentCost, ')')

  // Check wallet balance BEFORE creating submission
  if (submissionCost > 0) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()

    console.log('Student wallet balance:', wallet?.balance)

    if (!wallet || Number(wallet.balance) < submissionCost) {
      return { 
        error: `Insufficient wallet balance. Required: ₦${submissionCost}, Available: ₦${wallet?.balance || 0}`,
        requiresPayment: true
      }
    }
  }

  // Create submission
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
    console.error('Submission creation error:', submissionError)
    return { error: 'Failed to submit assignment' }
  }

  console.log('Submission created:', submission.id)

  // Process payment if submission cost > 0
  if (submissionCost > 0) {
    console.log('Processing payment...')
    
    const paymentResult = await processSubmissionPayment({
      studentId: user.id,
      lecturerId: assignment.created_by,
      submissionAmount: submissionCost,
      sourceType: 'assignment_submission',
      sourceId: assignment.id,
      submissionId: submission.id,
      purpose: `Assignment submission: ${assignment.title}`
    })

    console.log('Payment result:', paymentResult)

    if (!paymentResult.success) {
      console.error('Payment failed:', paymentResult.error)
      // Submission already marked as payment_pending
      return { 
        error: paymentResult.error || 'Payment processing failed',
        submissionId: submission.id,
        requiresPayment: true
      }
    }

    // Update submission status to submitted after successful payment
    await supabase
      .from('assignment_submissions')
      .update({ status: 'submitted' })
      .eq('id', submission.id)

    console.log('Payment processed successfully')
  }

  // Send email notification
  try {
    await sendAssignmentSubmittedEmail(
      user.email || '',
      user.profile?.first_name || 'Student',
      assignment.display_course_title || assignment.course_id || 'Course',
      assignment.title,
      new Date().toLocaleDateString(),
      submission.id
    )
  } catch (emailError) {
    console.error('Failed to send submission email:', emailError)
  }

  revalidatePath(`/student/courses/${assignment.course_id}`)
  revalidatePath('/student/assignments')
  
  console.log('=== SUBMISSION COMPLETE ===')
  
  return { 
    success: true, 
    message: isLate 
      ? `Assignment submitted successfully! Note: Submission is ${lateDays} day(s) late.`
      : 'Assignment submitted successfully!',
    submission,
    paymentProcessed: submissionCost > 0
  }
}

export async function retrySubmissionPayment(submissionId: string) {
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
    purpose: `Assignment submission: ${assignment.title}`
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