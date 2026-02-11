'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'
import { checkCARecordAccess } from './access-control'

export async function getStudentCARecords() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { success: false, error: 'Unauthorized access' }
  }

  // Students can only access their own records
  const check = await checkCARecordAccess(user.id)
  if (!check.allowed) {
    return { success: false, error: check.error }
  }

  // Get all CA records for the student
  const { data: caRecords, error } = await supabase
    .from('ca_records')
    .select(`
      *,
      courses (
        id,
        course_code,
        course_title,
        total_ca_marks,
        attendance_marks,
        semester,
        session
      )
    `)
    .eq('student_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  // Calculate summary statistics
  const totalCourses = caRecords?.length || 0
  const totalCA = caRecords?.reduce((sum, record) => sum + (record.total_ca_score || 0), 0) || 0
  const averageCA = totalCourses > 0 ? totalCA / totalCourses : 0

  return { 
    success: true,
    caRecords,
    summary: {
      totalCourses,
      totalCA: parseFloat(totalCA.toFixed(2)),
      averageCA: parseFloat(averageCA.toFixed(2))
    }
  }
}

export async function getCourseCADetails(courseId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { success: false, error: 'Unauthorized access' }
  }

  // Verify student can access their own CA records
  const check = await checkCARecordAccess(user.id)
  if (!check.allowed) {
    return { success: false, error: check.error }
  }

  // Get CA record for this course
  const { data: caRecord, error: caError } = await supabase
    .from('ca_records')
    .select(`
      *,
      courses (
        id,
        course_code,
        course_title,
        total_ca_marks,
        attendance_marks,
        department,
        semester,
        session,
        credit_units
      )
    `)
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (caError || !caRecord) {
    return { success: false, error: 'No CA record found for this course' }
  }

  // Get all assignments for this course with student's submissions
  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      assignment_type,
      max_score,
      allocated_marks,
      deadline,
      is_published,
      assignment_submissions!inner (
        id,
        final_score,
        status,
        submitted_at,
        is_late,
        lecturer_feedback
      )
    `)
    .eq('course_id', courseId)
    .eq('is_published', true)
    .eq('assignment_submissions.student_id', user.id)
    .order('deadline', { ascending: false })

  // Get all tests for this course with student's attempts (when test system is built)
  // const { data: tests } = await supabase.from('tests')...

  // Parse assignment scores from CA record
  const assignmentScores = caRecord.assignment_scores || {}
  const testScores = caRecord.test_scores || {}

  // Enrich assignments with CA data
  const enrichedAssignments = assignments?.map(assignment => {
    const submission = Array.isArray(assignment.assignment_submissions) 
      ? assignment.assignment_submissions[0] 
      : assignment.assignment_submissions

    const caData = assignmentScores[assignment.id] || {}

    return {
      id: assignment.id,
      title: assignment.title,
      type: assignment.assignment_type,
      maxScore: assignment.max_score,
      allocatedMarks: assignment.allocated_marks,
      deadline: assignment.deadline,
      submission: submission || null,
      caMarksEarned: caData.caMarksEarned || 0,
      score: caData.score || (submission?.final_score || 0),
      gradedAt: caData.gradedAt
    }
  }) || []

  return {
    success: true,
    caRecord,
    assignments: enrichedAssignments,
    tests: [], // Placeholder for future test system
    breakdown: {
      assignmentMarks: Object.values(assignmentScores).reduce(
        (sum: number, item: any) => sum + (item.caMarksEarned || 0),
        0
      ),
      testMarks: Object.values(testScores).reduce(
        (sum: number, item: any) => sum + (item.caMarksEarned || 0),
        0
      ),
      totalMarks: caRecord.total_ca_score
    }
  }
}

export async function exportCAReport(format: 'pdf' | 'csv' = 'pdf') {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  const { caRecords } = await getStudentCARecords()

  if (!caRecords || caRecords.length === 0) {
    return { error: 'No CA records to export' }
  }

  // For CSV format
  if (format === 'csv') {
    const csvRows = [
      ['Course Code', 'Course Title', 'Total CA Score', 'Max Possible', 'Percentage', 'Session'],
      ...caRecords.map(record => [
        record.courses.course_code,
        record.courses.course_title,
        record.total_ca_score.toFixed(2),
        record.courses.total_ca_marks.toFixed(2),
        record.percentage?.toFixed(2) || '0.00',
        record.courses.session
      ])
    ]

    const csvContent = csvRows.map(row => row.join(',')).join('\n')
    
    return {
      success: true,
      data: csvContent,
      filename: `CA_Report_${user.profile.matric_number}_${new Date().toISOString().split('T')[0]}.csv`
    }
  }

  // For PDF format (simplified - in production, use a proper PDF library)
  return {
    success: true,
    message: 'PDF export will be implemented with a PDF generation library'
  }
}