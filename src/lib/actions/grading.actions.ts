'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth.actions'
import { notifyAssignmentGraded } from './notification-helpers'
import { sendGradingCompleteEmail } from './email.actions'

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

export async function getAssignmentSubmissions(assignmentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  // Verify lecturer created this assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, created_by, title, max_score, allocated_marks')
    .eq('id', assignmentId)
    .eq('created_by', user.id)
    .single()

  if (!assignment) {
    return { error: 'Assignment not found or you do not have permission to view it' }
  }

  // Get all submissions for this assignment
  const { data: submissions, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      profiles:student_id (
        id,
        first_name,
        last_name,
        matric_number
      )
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { submissions, assignment }
}

export async function getSubmissionById(submissionId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  // Get submission with assignment details
  const { data: submission, error: submissionError } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      profiles:student_id (
        id,
        first_name,
        last_name,
        matric_number,
        level,
        department
      ),
      assignments (
        id,
        title,
        description,
        max_score,
        allocated_marks,
        assignment_type,
        created_by,
        course_id,
        deadline,
        late_penalty_percentage,
        late_submission_allowed,
        is_standalone,
        display_course_code,
        display_course_title,
        ai_grading_enabled,
        plagiarism_check_enabled,
        allowed_file_types,
        max_file_size_mb,
        courses (
          course_code,
          course_title
        )
      )
    `)
    .eq('id', submissionId)
    .single()

  if (submissionError || !submission) {
    console.error('Submission fetch error:', submissionError)
    return { error: 'Submission not found' }
  }

  console.log('✅ Submission found:', submission.id)
  console.log('📋 Assignment data:', submission.assignments)

  // Verify lecturer created this assignment
  if (submission.assignments.created_by !== user.id) {
    return { error: 'You do not have permission to grade this submission' }
  }

  // Transform the data structure for backward compatibility
  // If it's a standalone assignment, create a standalone_assignments property
  if (submission.assignments.is_standalone) {
    return {
      submission: {
        ...submission,
        standalone_assignments: {
          id: submission.assignments.id,
          title: submission.assignments.title,
          description: submission.assignments.description,
          max_score: submission.assignments.max_score,
          assignment_type: submission.assignments.assignment_type,
          display_course_code: submission.assignments.display_course_code,
          display_course_title: submission.assignments.display_course_title,
          late_penalty_percentage: submission.assignments.late_penalty_percentage,
          deadline: submission.assignments.deadline,
          late_submission_allowed: submission.assignments.late_submission_allowed,
          ai_grading_enabled: submission.assignments.ai_grading_enabled,
          plagiarism_check_enabled: submission.assignments.plagiarism_check_enabled,
          allowed_file_types: submission.assignments.allowed_file_types,
          max_file_size_mb: submission.assignments.max_file_size_mb
        }
      }
    }
  }

  // For regular course assignments
  return { submission }
}

export async function gradeSubmission(formData: {
  submissionId: string
  finalScore: number
  lecturerFeedback?: string
}) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()
  const adminClient = createServiceClient()

  // Get submission with assignment details AND course info for notifications
  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      assignments (
        id,
        title,
        max_score,
        allocated_marks,
        late_penalty_percentage,
        created_by,
        course_id,
        is_standalone,
        display_course_code,
        courses (
          course_code,
          course_title
        )
      )
    `)
    .eq('id', formData.submissionId)
    .single()

  if (!submission) {
    return { error: 'Submission not found' }
  }

  // Verify lecturer owns this assignment
  if (submission.assignments.created_by !== user.id) {
    return { error: 'You do not have permission to grade this submission' }
  }

  // Validate score
  if (formData.finalScore < 0 || formData.finalScore > submission.assignments.max_score) {
    return { error: `Score must be between 0 and ${submission.assignments.max_score}` }
  }

  // Apply late penalty if applicable
  let adjustedScore = formData.finalScore
  if (submission.is_late && submission.late_days > 0 && submission.assignments.late_penalty_percentage) {
    const penaltyPercentage = submission.assignments.late_penalty_percentage * submission.late_days
    const penalty = (formData.finalScore * penaltyPercentage) / 100
    adjustedScore = Math.max(0, formData.finalScore - penalty)
  }

  // Update submission with grade
  const { error: updateError } = await adminClient
    .from('assignment_submissions')
    .update({
      final_score: adjustedScore,
      lecturer_feedback: formData.lecturerFeedback,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
      status: 'graded',
      updated_at: new Date().toISOString()
    })
    .eq('id', formData.submissionId)

  if (updateError) {
    console.error('Grading error:', updateError)
    return { error: 'Failed to save grade' }
  }

  // ✨ Send notification and email to student
  try {
    const courseCode = submission.assignments.is_standalone 
      ? submission.assignments.display_course_code || 'Assignment'
      : submission.assignments.courses?.course_code || 'Assignment'

    // In-app notification
    await notifyAssignmentGraded(
      submission.student_id,
      submission.assignments.title,
      courseCode,
      adjustedScore,
      submission.assignments.max_score,
      submission.assignment_id,
      formData.submissionId
    )

    // Email notification
    const studentProfile = submission.profiles
    await sendGradingCompleteEmail(
      studentProfile.email,
      studentProfile.first_name || 'Student',
      submission.assignments.title,
      courseCode,
      adjustedScore,
      submission.assignments.max_score,
      formData.lecturerFeedback || ''
    )
  } catch (notifError) {
    // Don't fail the grading if notification fails
    console.error('Failed to send notification:', notifError)
  }

  // Update CA record ONLY if it's a course assignment (not standalone)
  if (!submission.assignments.is_standalone && submission.assignments.course_id) {
    await updateCARecord(
      submission.student_id,
      submission.assignments.course_id,
      submission.assignments.id,
      adjustedScore,
      submission.assignments.max_score,
      submission.assignments.allocated_marks
    )
  }

  // Revalidate appropriate paths
  if (submission.assignments.is_standalone) {
    revalidatePath(`/lecturer/assignments/standalone/${submission.assignment_id}`)
    revalidatePath(`/lecturer/grading/standalone/${formData.submissionId}`)
  } else {
    revalidatePath(`/lecturer/assignments/${submission.assignment_id}`)
    revalidatePath(`/lecturer/assignments/${submission.assignment_id}/submissions`)
  }
  
  return { 
    success: true, 
    message: submission.is_late 
      ? `Graded successfully! Original score: ${formData.finalScore}, Adjusted (late penalty): ${adjustedScore.toFixed(2)}`
      : 'Submission graded successfully!'
  }
}

async function updateCARecord(
  studentId: string,
  courseId: string,
  assignmentId: string,
  score: number,
  maxScore: number,
  allocatedMarks: number
) {
  const adminClient = createServiceClient()

  // Calculate the CA marks earned (proportional to score)
  const caMarksEarned = (score / maxScore) * allocatedMarks

  // Get existing CA record
  const { data: existingRecord } = await adminClient
    .from('ca_records')
    .select('*')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .single()

  if (existingRecord) {
    // Update existing record
    const assignmentScores = existingRecord.assignment_scores || {}
    assignmentScores[assignmentId] = {
      score,
      maxScore,
      allocatedMarks,
      caMarksEarned: parseFloat(caMarksEarned.toFixed(2)),
      gradedAt: new Date().toISOString()
    }

    // Recalculate total CA score
    const totalCA = Object.values(assignmentScores).reduce(
      (sum: number, item: any) => sum + (item.caMarksEarned || 0),
      0
    )

    await adminClient
      .from('ca_records')
      .update({
        assignment_scores: assignmentScores,
        total_ca_score: parseFloat(totalCA.toFixed(2)),
        computed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingRecord.id)
  } else {
    // Create new record
    const assignmentScores = {
      [assignmentId]: {
        score,
        maxScore,
        allocatedMarks,
        caMarksEarned: parseFloat(caMarksEarned.toFixed(2)),
        gradedAt: new Date().toISOString()
      }
    }

    await adminClient
      .from('ca_records')
      .insert({
        student_id: studentId,
        course_id: courseId,
        assignment_scores: assignmentScores,
        test_scores: {},
        total_ca_score: parseFloat(caMarksEarned.toFixed(2)),
        max_possible_score: 100,
        percentage: parseFloat(caMarksEarned.toFixed(2)),
        computed_at: new Date().toISOString()
      })
  }
}

export async function getAssignmentGradingStats(assignmentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('final_score, status')
    .eq('assignment_id', assignmentId)

  if (!submissions) {
    return { stats: null }
  }

  const total = submissions.length
  const graded = submissions.filter(s => s.status === 'graded').length
  const pending = total - graded

  const gradedSubmissions = submissions.filter(s => s.final_score !== null)
  const averageScore = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.final_score || 0), 0) / gradedSubmissions.length
    : 0

  const stats = {
    total,
    graded,
    pending,
    averageScore: parseFloat(averageScore.toFixed(2))
  }

  return { stats }
}

// Get standalone assignment submissions
export async function getStandaloneAssignmentSubmissions(assignmentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  // Verify lecturer created this assignment
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, created_by, title, max_score, is_standalone')
    .eq('id', assignmentId)
    .eq('created_by', user.id)
    .eq('is_standalone', true)
    .single()

  if (!assignment) {
    return { error: 'Assignment not found or you do not have permission to view it' }
  }

  // Get all submissions for this assignment
  const { data: submissions, error } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      profiles:student_id (
        id,
        first_name,
        last_name,
        matric_number
      )
    `)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { submissions, assignment }
}

// Get standalone assignment grading stats
export async function getStandaloneAssignmentGradingStats(assignmentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('final_score, status')
    .eq('assignment_id', assignmentId)

  if (!submissions) {
    return { stats: null }
  }

  const total = submissions.length
  const graded = submissions.filter(s => s.status === 'graded').length
  const pending = total - graded

  const gradedSubmissions = submissions.filter(s => s.final_score !== null)
  const averageScore = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.final_score || 0), 0) / gradedSubmissions.length
    : 0

  const stats = {
    total,
    graded,
    pending,
    averageScore: parseFloat(averageScore.toFixed(2))
  }

  return { stats }
}