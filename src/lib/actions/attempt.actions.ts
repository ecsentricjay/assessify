'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'
import { revalidatePath } from 'next/cache'
import type { AttemptWithDetails, SubmitAnswerData } from '@/lib/types/test.types'
import { processSubmissionPayment } from './transaction.actions'

/**
 * Start a new test attempt
 * Processes payment for test access cost
 */
export async function startTestAttempt(testId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { error: 'Only students can take tests' }
    }

    const supabase = await createClient()

    // Get test details
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .eq('is_published', true)
      .single()

    if (testError || !test) {
      return { error: 'Test not found or not published' }
    }

    // Check if test has started and not expired
    const now = new Date()
    const startTime = new Date(test.start_time)
    const endTime = new Date(test.end_time)

    if (now < startTime) {
      return { error: 'Test has not started yet' }
    }

    if (now > endTime) {
      return { error: 'Test has expired' }
    }

    // Check enrollment for course-based tests
    if (test.course_id) {
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', test.course_id)
        .eq('student_id', user.id)
        .single()

      if (!enrollment) {
        return { error: 'You must be enrolled in this course to take the test' }
      }
    }

    // Check max attempts
    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('id, attempt_number, status')
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .order('attempt_number', { ascending: false })

    const attemptsCount = attempts?.length || 0

    // Check for in-progress attempt
    const inProgressAttempt = attempts?.find(a => a.status === 'in_progress')
    if (inProgressAttempt) {
      return { 
        error: 'You have an in-progress attempt',
        attemptId: inProgressAttempt.id
      }
    }

    if (attemptsCount >= test.max_attempts) {
      return { error: 'Maximum attempts reached' }
    }

    // Check wallet balance if test has cost
    let paymentProcessed = false
    if (test.access_cost > 0) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (!wallet || wallet.balance < test.access_cost) {
        return { 
          error: 'Insufficient wallet balance',
          requiredAmount: test.access_cost,
          currentBalance: wallet?.balance || 0
        }
      }

      // Process payment for test access
      const paymentResult = await processSubmissionPayment({
        studentId: user.id,
        lecturerId: test.created_by,
        submissionAmount: test.access_cost,
        sourceType: 'test_submission',
        sourceId: test.id,
        submissionId: '', // Will be populated with attempt ID after creation
        purpose: `Test access: ${test.title}`
      })

      if (!paymentResult.success) {
        return { 
          error: paymentResult.error || 'Failed to process test access payment',
          requiresPayment: true
        }
      }

      paymentProcessed = true
    }

    // Create attempt
    const attemptNumber = attemptsCount + 1
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .insert({
        test_id: testId,
        student_id: user.id,
        attempt_number: attemptNumber,
        status: 'in_progress',
        started_at: now.toISOString(),
        payment_processed: paymentProcessed,
      })
      .select()
      .single()

    if (attemptError) {
      console.error('Error creating attempt:', attemptError)
      return { error: 'Failed to start test' }
    }

    revalidatePath('/student/tests')
    return { 
      attempt, 
      attemptId: attempt.id,
      paymentProcessed
    }
  } catch (error) {
    console.error('Error in startTestAttempt:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Save a student answer during test
 */
export async function saveAnswer(data: SubmitAnswerData) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify attempt belongs to user and is in progress
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('student_id, status')
      .eq('id', data.attempt_id)
      .single()

    if (!attempt || attempt.student_id !== user.id) {
      return { error: 'Invalid attempt' }
    }

    if (attempt.status !== 'in_progress') {
      return { error: 'Test attempt is not in progress' }
    }

    // Check if answer already exists
    const { data: existingAnswer } = await supabase
      .from('student_answers')
      .select('id')
      .eq('attempt_id', data.attempt_id)
      .eq('question_id', data.question_id)
      .single()

    if (existingAnswer) {
      // Update existing answer
      const { error } = await supabase
        .from('student_answers')
        .update({
          selected_option_ids: data.selected_option_ids,
          answer_text: data.answer_text,
          answered_at: new Date().toISOString(),
        })
        .eq('id', existingAnswer.id)

      if (error) {
        console.error('Error updating answer:', error)
        return { error: 'Failed to save answer' }
      }
    } else {
      // Create new answer
      const { error } = await supabase
        .from('student_answers')
        .insert({
          attempt_id: data.attempt_id,
          question_id: data.question_id,
          selected_option_ids: data.selected_option_ids,
          answer_text: data.answer_text,
          answered_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Error creating answer:', error)
        return { error: 'Failed to save answer' }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in saveAnswer:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Submit test attempt and auto-grade
 * Auto-grades MCQ and True/False, leaves essays ungraded for manual/AI grading
 */
export async function submitTestAttempt(attemptId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Get attempt with test details
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select(`
        *,
        test:tests(
          id, 
          duration_minutes, 
          total_marks, 
          pass_mark,
          allocated_marks,
          course_id,
          created_by
        )
      `)
      .eq('id', attemptId)
      .eq('student_id', user.id)
      .single()

    if (attemptError || !attempt) {
      return { error: 'Attempt not found' }
    }

    if (attempt.status !== 'in_progress') {
      return { error: 'Test already submitted' }
    }

    // Calculate time taken
    const startedAt = new Date(attempt.started_at)
    const submittedAt = new Date()
    const timeTakenMinutes = Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000)

    // Get all answers
    const { data: answers } = await supabase
      .from('student_answers')
      .select(`
        *,
        question:questions(
          id,
          question_type,
          marks,
          options:question_options(id, is_correct)
        )
      `)
      .eq('attempt_id', attemptId)

    let totalScore = 0

    // Auto-grade MCQ and True/False questions, leave essays ungraded
    if (answers) {
      for (const answer of answers) {
        const question = answer.question

        if (question.question_type === 'mcq' || question.question_type === 'true_false') {
          // AUTO-GRADE: MCQ and True/False
          const correctOptionIds = question.options
            .filter((opt: any) => opt.is_correct)
            .map((opt: any) => opt.id)

          const studentOptionIds = answer.selected_option_ids || []
          const isCorrect = 
            correctOptionIds.length === studentOptionIds.length &&
            correctOptionIds.every((id: string) => studentOptionIds.includes(id))

          const marksAwarded = isCorrect ? question.marks : 0

          // Update answer with grading
          await supabase
            .from('student_answers')
            .update({
              is_correct: isCorrect,
              marks_awarded: marksAwarded,
            })
            .eq('id', answer.id)

          totalScore += marksAwarded
        } else if (question.question_type === 'essay') {
          // LEAVE ESSAYS UNGRADED (NULL)
          console.log(`Essay question ${question.id} left ungraded for manual/AI grading`)
        }
      }
    }

    // Calculate percentage based on auto-graded questions only
    const testArray = attempt.test as unknown as any[] | null
    const testData = testArray?.[0]
    const totalMarks = testData?.total_marks || 100
    const passMarkPercentage = testData?.pass_mark || 40
    const percentage = (totalScore / totalMarks) * 100
    const passed = percentage >= passMarkPercentage

    // Update attempt
    const { error: updateError } = await supabase
      .from('test_attempts')
      .update({
        submitted_at: submittedAt.toISOString(),
        time_taken_minutes: timeTakenMinutes,
        total_score: totalScore,
        percentage: percentage,
        passed: passed,
        status: 'completed',
        updated_at: submittedAt.toISOString(),
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Error updating attempt:', updateError)
      return { error: 'Failed to submit test' }
    }

    // Update CA records if course-based test
    if (testData?.course_id) {
      await updateCARecordsForTest(
        testData.course_id,
        user.id,
        totalScore,
        testData.allocated_marks
      )
    }

    revalidatePath('/student/tests')
    return { 
      success: true, 
      totalScore, 
      percentage, 
      passed,
      attemptId 
    }
  } catch (error) {
    console.error('Error in submitTestAttempt:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Recalculate attempt score after grading essays
 */
export async function recalculateAttemptScore(attemptId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.profile?.role !== 'lecturer' && user.profile?.role !== 'admin')) {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Get all graded answers
    const { data: answers } = await supabase
      .from('student_answers')
      .select('marks_awarded')
      .eq('attempt_id', attemptId)

    if (!answers) {
      return { error: 'No answers found' }
    }

    // Calculate total score
    const totalScore = answers.reduce(
      (sum, answer) => sum + (answer.marks_awarded || 0),
      0
    )

    // Get test details
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select(`
        test:tests(total_marks, pass_mark, course_id, allocated_marks),
        student_id
      `)
      .eq('id', attemptId)
      .single()

    if (!attempt) {
      return { error: 'Attempt not found' }
    }

    const testArray = attempt.test as unknown as any[] | null
    const testData = testArray?.[0]
    const totalMarks = testData?.total_marks || 100
    const passMarkPercentage = testData?.pass_mark || 40
    const percentage = (totalScore / totalMarks) * 100
    const passed = percentage >= passMarkPercentage

    // Update attempt with new totals
    const { error: updateError } = await supabase
      .from('test_attempts')
      .update({
        total_score: totalScore,
        percentage: percentage,
        passed: passed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId)

    if (updateError) {
      console.error('Error updating attempt:', updateError)
      return { error: 'Failed to recalculate score' }
    }

    // Update CA records if course-based test
    if (testData?.course_id) {
      await updateCARecordsForTest(
        testData.course_id,
        attempt.student_id,
        totalScore,
        testData.allocated_marks
      )
    }

    revalidatePath('/lecturer/tests')
    return { success: true, totalScore, percentage, passed }
  } catch (error) {
    console.error('Error recalculating score:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update CA records after test submission
 */
async function updateCARecordsForTest(
  courseId: string,
  studentId: string,
  score: number,
  allocatedMarks: number
) {
  try {
    const supabase = await createClient()

    // Get or create CA record
    const { data: caRecord } = await supabase
      .from('ca_records')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .single()

    const testScores = caRecord?.test_scores || {}
    
    // Calculate CA contribution
    const caContribution = (score / 100) * allocatedMarks

    // Update test scores
    testScores[`test_${Date.now()}`] = {
      score,
      allocated_marks: allocatedMarks,
      ca_contribution: caContribution,
      date: new Date().toISOString(),
    }

    const totalTestCA = Object.values(testScores).reduce(
      (sum: number, test: any) => sum + test.ca_contribution,
      0
    )

    const assignmentCA = caRecord?.assignment_scores 
      ? Object.values(caRecord.assignment_scores).reduce(
          (sum: number, assignment: any) => sum + assignment.ca_contribution,
          0
        )
      : 0

    const totalCA = totalTestCA + assignmentCA

    if (caRecord) {
      await supabase
        .from('ca_records')
        .update({
          test_scores: testScores,
          total_ca_score: totalCA,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caRecord.id)
    } else {
      await supabase.from('ca_records').insert({
        course_id: courseId,
        student_id: studentId,
        test_scores: testScores,
        total_ca_score: totalCA,
      })
    }
  } catch (error) {
    console.error('Error updating CA records:', error)
  }
}

/**
 * Get student's attempts for a test
 */
export async function getStudentAttempts(testId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    let query = supabase
      .from('test_attempts')
      .select(`
        *,
        test:tests(
          id,
          title,
          test_type,
          total_marks,
          pass_mark,
          access_code,
          course:courses(id, course_code, course_title)
        )
      `)
      .eq('student_id', user.id)
      .order('started_at', { ascending: false })

    if (testId) {
      query = query.eq('test_id', testId)
    }

    const { data: attempts, error } = await query

    if (error) {
      console.error('Error fetching attempts:', error)
      return { error: 'Failed to fetch attempts' }
    }

    return { attempts }
  } catch (error) {
    console.error('Error in getStudentAttempts:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all attempts for a test (lecturer view)
 */
export async function getTestAttempts(testId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify test ownership
    const { data: test } = await supabase
      .from('tests')
      .select('created_by')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { error: 'Unauthorized' }
    }

    // Get attempts
    const { data: attempts, error: attemptsError } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('test_id', testId)
      .order('created_at', { ascending: false })

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError)
      return { error: 'Failed to fetch attempts' }
    }

    if (!attempts || attempts.length === 0) {
      return { attempts: [] }
    }

    // Get student profiles
    const studentIds = [...new Set(attempts.map(a => a.student_id))]
    const { data: students } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, matric_number, email, level, department')
      .in('id', studentIds)

    // Get test details
    const { data: testDetails } = await supabase
      .from('tests')
      .select('id, title, total_marks, pass_mark, access_cost')
      .eq('id', testId)
      .single()

    // Combine the data
    const attemptsWithDetails = attempts.map(attempt => {
      const student = students?.find(s => s.id === attempt.student_id)
      return {
        ...attempt,
        student,
        test: testDetails
      }
    })

    // Calculate statistics
    const stats = {
      total_attempts: attempts.length,
      completed: attempts.filter(a => a.status === 'completed').length,
      in_progress: attempts.filter(a => a.status === 'in_progress').length,
      total_payment_processed: (attempts.filter(a => a.payment_processed).length * (testDetails?.access_cost || 0))
    }

    return { attempts: attemptsWithDetails, stats }
  } catch (error) {
    console.error('Error in getTestAttempts:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get detailed attempt with all answers
 */
export async function getAttemptDetails(attemptId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'Unauthorized - not logged in' }
    }

    const supabase = await createClient()

    // Get the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .single()

    if (attemptError || !attempt) {
      console.error('Error fetching attempt:', attemptError)
      return { error: 'Attempt not found' }
    }

    // Verify ownership for students
    const isStudent = user.profile?.role === 'student'
    if (isStudent && attempt.student_id !== user.id) {
      return { error: 'You do not have permission to view this attempt' }
    }

    // Get test details
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', attempt.test_id)
      .single()

    if (testError || !test) {
      console.error('Error fetching test:', testError)
      return { error: 'Test not found' }
    }

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, matric_number, email, level, department')
      .eq('id', attempt.student_id)
      .single()

    if (studentError) {
      console.error('Error fetching student:', studentError)
    }

    // Get course details if course-based
    let course = null
    if (test.course_id) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, course_code, course_title')
        .eq('id', test.course_id)
        .single()
      
      course = courseData
    }

    // Get test creator
    const { data: creator } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, title')
      .eq('id', test.created_by)
      .single()

    // Get all answers
    const { data: answers, error: answersError } = await supabase
      .from('student_answers')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('answered_at', { ascending: true })

    if (answersError) {
      console.error('Error fetching answers:', answersError)
    }

    // Get questions with options for each answer
    const answersWithQuestions = await Promise.all(
      (answers || []).map(async (answer) => {
        const { data: question } = await supabase
          .from('questions')
          .select('*')
          .eq('id', answer.question_id)
          .single()

        let options = []
        if (question) {
          const { data: optionsData } = await supabase
            .from('question_options')
            .select('*')
            .eq('question_id', question.id)
            .order('order_index', { ascending: true })
          
          options = optionsData || []
        }

        return {
          ...answer,
          question: question ? { ...question, options } : null
        }
      })
    )

    const attemptWithDetails: AttemptWithDetails = {
      ...attempt,
      test: {
        ...test,
        course,
        creator
      },
      student,
      answers: answersWithQuestions,
    }

    return { attempt: attemptWithDetails }
  } catch (error) {
    console.error('Error in getAttemptDetails:', error)
    return { error: 'An unexpected error occurred: ' + (error as Error).message }
  }
}

/**
 * Resume an in-progress attempt
 */
export async function resumeTestAttempt(attemptId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('student_id, status, test_id')
      .eq('id', attemptId)
      .single()

    if (!attempt || attempt.student_id !== user.id) {
      return { error: 'Attempt not found' }
    }

    if (attempt.status !== 'in_progress') {
      return { error: 'Attempt is not in progress' }
    }

    return { success: true, attemptId, testId: attempt.test_id }
  } catch (error) {
    console.error('Error in resumeTestAttempt:', error)
    return { error: 'An unexpected error occurred' }
  }
}