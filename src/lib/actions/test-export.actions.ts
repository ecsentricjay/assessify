// lib/actions/test-export.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'
import type { TestResultExport } from '@/lib/types/test.types'

/**
 * Export test results to CSV format
 */
export async function exportTestResults(testId: string, format: 'csv' | 'json' = 'csv') {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify test ownership
    const { data: test } = await supabase
      .from('tests')
      .select('created_by, title')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { error: 'Unauthorized' }
    }

    // Get all completed attempts with student details
    const { data: attempts, error } = await supabase
      .from('test_attempts')
      .select(`
        *,
        student:profiles!test_attempts_student_id_fkey(
          first_name,
          last_name,
          matric_number,
          email
        )
      `)
      .eq('test_id', testId)
      .eq('status', 'completed')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching attempts:', error)
      return { error: 'Failed to fetch test results' }
    }

    if (!attempts || attempts.length === 0) {
      return { error: 'No completed attempts found' }
    }

    // Format data for export
    const exportData: TestResultExport[] = attempts.map(attempt => ({
      student_name: `${attempt.student.first_name} ${attempt.student.last_name}`,
      matric_number: attempt.student.matric_number || 'N/A',
      email: attempt.student.email || 'N/A',
      attempt_number: attempt.attempt_number,
      score: attempt.total_score || 0,
      percentage: attempt.percentage || 0,
      passed: attempt.passed || false,
      time_taken_minutes: attempt.time_taken_minutes || 0,
      submitted_at: attempt.submitted_at || '',
      status: attempt.status,
    }))

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Student Name',
        'Matric Number',
        'Email',
        'Attempt Number',
        'Score',
        'Percentage',
        'Passed',
        'Time Taken (mins)',
        'Submitted At',
        'Status',
      ]

      const csvRows = [
        headers.join(','),
        ...exportData.map(row =>
          [
            `"${row.student_name}"`,
            row.matric_number,
            row.email,
            row.attempt_number,
            row.score,
            row.percentage.toFixed(2),
            row.passed ? 'Yes' : 'No',
            row.time_taken_minutes,
            new Date(row.submitted_at).toLocaleString(),
            row.status,
          ].join(',')
        ),
      ]

      const csvContent = csvRows.join('\n')
      const filename = `${test.title.replace(/[^a-z0-9]/gi, '_')}_results_${Date.now()}.csv`

      return {
        data: csvContent,
        filename,
        contentType: 'text/csv',
      }
    } else {
      // Return JSON
      const filename = `${test.title.replace(/[^a-z0-9]/gi, '_')}_results_${Date.now()}.json`

      return {
        data: JSON.stringify(exportData, null, 2),
        filename,
        contentType: 'application/json',
      }
    }
  } catch (error) {
    console.error('Error in exportTestResults:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Export detailed test report including question-by-question analysis
 */
export async function exportDetailedTestReport(testId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify test ownership
    const { data: test } = await supabase
      .from('tests')
      .select(`
        *,
        questions:questions(
          id,
          question_text,
          question_type,
          marks,
          order_index
        )
      `)
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { error: 'Unauthorized' }
    }

    // Get all completed attempts
    const { data: attempts } = await supabase
      .from('test_attempts')
      .select(`
        *,
        student:profiles!test_attempts_student_id_fkey(
          first_name,
          last_name,
          matric_number
        )
      `)
      .eq('test_id', testId)
      .eq('status', 'completed')

    // Get all answers for analysis
    const { data: allAnswers } = await supabase
      .from('student_answers')
      .select(`
        *,
        attempt:test_attempts!student_answers_attempt_id_fkey(student_id)
      `)
      .in('attempt_id', attempts?.map(a => a.id) || [])

    // Analyze question difficulty
    const questionAnalysis = test.questions.map((question: any) => {
      const questionAnswers = allAnswers?.filter(a => a.question_id === question.id) || []
      const correctAnswers = questionAnswers.filter(a => a.is_correct).length
      const totalAnswers = questionAnswers.length

      return {
        question_number: question.order_index,
        question_text: question.question_text.substring(0, 100) + '...',
        question_type: question.question_type,
        marks: question.marks,
        attempts: totalAnswers,
        correct: correctAnswers,
        incorrect: totalAnswers - correctAnswers,
        success_rate: totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : '0.00',
      }
    })

    // Generate CSV for detailed report
    const headers = [
      'Question #',
      'Question Text',
      'Type',
      'Marks',
      'Total Attempts',
      'Correct',
      'Incorrect',
      'Success Rate (%)',
    ]

    const csvRows = [
      headers.join(','),
      ...questionAnalysis.map((q: any) =>
        [
          q.question_number,
          `"${q.question_text.replace(/"/g, '""')}"`,
          q.question_type,
          q.marks,
          q.attempts,
          q.correct,
          q.incorrect,
          q.success_rate,
        ].join(',')
      ),
    ]

    const csvContent = csvRows.join('\n')
    const filename = `${test.title.replace(/[^a-z0-9]/gi, '_')}_detailed_report_${Date.now()}.csv`

    return {
      data: csvContent,
      filename,
      contentType: 'text/csv',
    }
  } catch (error) {
    console.error('Error in exportDetailedTestReport:', error)
    return { error: 'An unexpected error occurred' }
  }
}