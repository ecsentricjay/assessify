'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth.actions'
import { processSubmissionPayment } from './transaction.actions'
import { sendAssignmentSubmittedEmail } from './email.actions'

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

  // Get assignment details
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*, courses(id, created_by:lecturer_id)')
    .eq('id', formData.assignmentId)
    .single()

  if (assignmentError || !assignment) {
    return { error: 'Assignment not found' }
  }

  // Check if assignment is published
  if (!assignment.is_published) {
    return { error: 'This assignment is not available for submission' }
  }

  // Check if student is enrolled in the course
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

  // Create submission first
  const { data: submission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .insert({
      assignment_id: formData.assignmentId,
      student_id: user.id,
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
      purpose: `Assignment submission: ${assignment.title}`
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
    // TODO: Trigger plagiarism check service
    await supabase
      .from('assignment_submissions')
      .update({ plagiarism_check_status: 'queued' })
      .eq('id', submission.id)
  }

  // Trigger AI grading if enabled
  if (assignment.ai_grading_enabled) {
    // TODO: Trigger AI grading service
    await supabase
      .from('assignment_submissions')
      .update({ ai_grading_status: 'queued' })
      .eq('id', submission.id)
  }

  // Send assignment submitted confirmation email
  try {
    const courseTitle = assignment.courses?.course_title || 'Your Course'
    await sendAssignmentSubmittedEmail(
      user.email || '',
      user.profile?.first_name || 'Student',
      courseTitle,
      assignment.title,
      new Date().toLocaleDateString(),
      submission.id
    )
  } catch (emailError) {
    console.error('Failed to send submission email:', emailError)
    // Don't fail submission if email fails
  }

  revalidatePath(`/student/courses/${assignment.course_id}`)
  revalidatePath('/student/assignments')
  
  return { 
    success: true, 
    message: isLate 
      ? `Assignment submitted successfully! Note: Submission is ${lateDays} day(s) late.`
      : 'Assignment submitted successfully!',
    submission,
    paymentProcessed: assignment.submission_cost > 0
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

export async function getStudentAssignments(courseId?: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  // Get enrolled courses
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select('course_id')
    .eq('student_id', user.id)
    .eq('enrollment_status', 'active')

  if (!enrollments || enrollments.length === 0) {
    return { assignments: [] }
  }

  const enrolledCourseIds = enrollments.map(e => e.course_id)

  // Build query
  let query = supabase
    .from('assignments')
    .select(`
      *,
      courses (
        id,
        course_code,
        course_title
      ),
      profiles:created_by (
        first_name,
        last_name,
        title
      )
    `)
    .eq('is_published', true)
    .in('course_id', enrolledCourseIds)

  if (courseId) {
    query = query.eq('course_id', courseId)
  }

  const { data: assignments, error } = await query.order('deadline', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  // Get submissions for these assignments
  const assignmentIds = assignments.map(a => a.id)
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, status, submitted_at, final_score')
    .eq('student_id', user.id)
    .in('assignment_id', assignmentIds)

  // Merge submission data
  const assignmentsWithStatus = assignments.map(assignment => {
    const submission = submissions?.find(s => s.assignment_id === assignment.id)
    const deadline = new Date(assignment.deadline)
    const now = new Date()
    const isOverdue = now > deadline && !submission

    return {
      ...assignment,
      submission,
      isOverdue,
      hasSubmitted: !!submission
    }
  })

  return { assignments: assignmentsWithStatus }
}

export async function getAssignmentForStudent(assignmentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      *,
      courses (
        id,
        course_code,
        course_title
      ),
      profiles:created_by (
        first_name,
        last_name,
        title
      )
    `)
    .eq('id', assignmentId)
    .eq('is_published', true)
    .single()

  if (error || !assignment) {
    return { error: 'Assignment not found' }
  }

  // Check enrollment
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

  // Get submission if exists
  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .single()

  // Get wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  return { 
    assignment: {
      ...assignment,
      submission,
      walletBalance: wallet?.balance || 0
    }
  }
}