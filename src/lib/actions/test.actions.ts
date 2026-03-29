// lib/actions/test.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUser } from './auth.actions'
import { revalidatePath } from 'next/cache'
import { sendTestInvitationEmail } from './email.actions'
import { checkTestAccess, checkTestAttemptAccess } from './access-control'
import type { CreateTestData, TestWithDetails, TestStatistics } from '@/lib/types/test.types'

/**
 * Create a standalone test (not linked to course)
 * Access: Lecturer only
 */
export async function createStandaloneTest(data: CreateTestData) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { success: false, error: 'Unauthorized access' }
    }

    const supabase = await createClient()

    // Generate unique access code
    const { data: accessCode, error: codeError } = await supabase
      .rpc('generate_test_access_code')

    if (codeError || !accessCode) {
      return { success: false, error: 'Failed to generate access code' }
    }

    // Create test
    const { data: test, error } = await supabase
      .from('tests')
      .insert({
        ...data,
        created_by: user.id,
        is_standalone: true,
        access_code: accessCode,
        course_id: null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating standalone test:', error)
      return { success: false, error: 'Failed to create test' }
    }

    revalidatePath('/lecturer/tests')
    return { success: true, test, accessCode }
  } catch (error) {
    console.error('Error in createStandaloneTest:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a course-based test
 * Access: Lecturer of the course
 */
export async function createCourseTest(courseId: string, data: CreateTestData) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { success: false, error: 'Unauthorized access' }
    }

    const supabase = await createClient()

    // Verify lecturer has access to course
    const { data: courseAccess } = await supabase
      .from('course_lecturers')
      .select('id')
      .eq('course_id', courseId)
      .eq('lecturer_id', user.id)
      .single()

    if (!courseAccess) {
      return { success: false, error: 'You do not have access to this course' }
    }

    // Create test
    const { data: test, error } = await supabase
      .from('tests')
      .insert({
        ...data,
        created_by: user.id,
        course_id: courseId,
        is_standalone: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating course test:', error)
      return { success: false, error: 'Failed to create test' }
    }

    revalidatePath(`/lecturer/courses/${courseId}`)
    return { success: true, test }
  } catch (error) {
    console.error('Error in createCourseTest:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get test by ID with full details
 * Access: Author lecturer, enrolled student (for course tests), or admin
 */
export async function getTestById(testId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data: test, error } = await supabase
      .from('tests')
      .select(`
        *,
        course:courses(id, course_code, course_title),
        creator:profiles!tests_created_by_fkey(id, first_name, last_name, title)
      `)
      .eq('id', testId)
      .single()

    if (error) {
      console.error('Error fetching test:', error)
      return { success: false, error: 'Test not found' }
    }

    // Access control: Verify user has access to view this test
    const isAuthor = test.created_by === user.id
    const isAdmin = user.profile?.role === 'admin'
    let isEnrolled = false

    if (test.course_id && user.profile?.role === 'student') {
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', test.course_id)
        .eq('student_id', user.id)
        .eq('enrollment_status', 'active')
        .single()
      isEnrolled = !!enrollment
    }

    const hasAccess = isAuthor || isAdmin || isEnrolled

    if (!hasAccess && !test.is_standalone) {
      return { success: false, error: 'Unauthorized access' }
    }

    // Get questions count
    const { count: questionsCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId)

    // Get attempts count and stats
    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('total_score, status')
      .eq('test_id', testId)
      .eq('status', 'completed')

    const attemptsCount = attempts?.length || 0
    const avgScore = attempts?.length
      ? attempts.reduce((sum, a) => sum + (a.total_score || 0), 0) / attempts.length
      : 0

    const testWithDetails: TestWithDetails = {
      ...test,
      questions_count: questionsCount || 0,
      attempts_count: attemptsCount,
      avg_score: avgScore,
    }

    return { success: true, test: testWithDetails }
  } catch (error) {
    console.error('Error in getTestById:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get test by access code (for public access)
 */
export async function getTestByAccessCode(accessCode: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'student') {
      return { error: 'Only students can access tests via code' }
    }

    const supabase = await createClient()

    const { data: test, error } = await supabase
      .from('tests')
      .select(`
        *,
        creator:profiles!tests_created_by_fkey(id, first_name, last_name, title)
      `)
      .eq('access_code', accessCode)
      .eq('is_published', true)
      .single()

    if (error || !test) {
      return { error: 'Test not found or not published' }
    }

    // Check if test has started and not expired
    const now = new Date()
    const startTime = new Date(test.start_time)
    const endTime = new Date(test.end_time)

    if (now < startTime) {
      return { error: 'Test has not started yet', test }
    }

    if (now > endTime) {
      return { error: 'Test has expired', test }
    }

    // Get student's attempts count
    const { data: attempts } = await supabase
      .from('test_attempts')
      .select('id, attempt_number, status')
      .eq('test_id', test.id)
      .eq('student_id', user.id)
      .order('attempt_number', { ascending: false })

    const attemptsUsed = attempts?.length || 0
    const hasInProgressAttempt = attempts?.some(a => a.status === 'in_progress')

    return {
      test,
      attempts_used: attemptsUsed,
      can_start: attemptsUsed < test.max_attempts && !hasInProgressAttempt,
      has_in_progress: hasInProgressAttempt,
    }
  } catch (error) {
    console.error('Error in getTestByAccessCode:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all tests created by lecturer
 */
export async function getLecturerTests(courseId?: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    let query = supabase
      .from('tests')
      .select(`
        *,
        course:courses(id, course_code, course_title)
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: tests, error } = await query

    if (error) {
      console.error('Error fetching tests:', error)
      return { error: 'Failed to fetch tests' }
    }

    // Get stats for each test
    const testsWithStats = await Promise.all(
      tests.map(async (test) => {
        const { count: questionsCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id)

        const { count: attemptsCount } = await supabase
          .from('test_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id)

        return {
          ...test,
          questions_count: questionsCount || 0,
          attempts_count: attemptsCount || 0,
        }
      })
    )

    return { tests: testsWithStats }
  } catch (error) {
    console.error('Error in getLecturerTests:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get standalone tests only
 */
export async function getLecturerStandaloneTests() {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data: tests, error } = await supabase
      .from('tests')
      .select('*')
      .eq('created_by', user.id)
      .eq('is_standalone', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching standalone tests:', error)
      return { error: 'Failed to fetch tests' }
    }

    // Get stats for each test
    const testsWithStats = await Promise.all(
      tests.map(async (test) => {
        const { count: questionsCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id)

        const { count: attemptsCount } = await supabase
          .from('test_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id)

        return {
          ...test,
          questions_count: questionsCount || 0,
          attempts_count: attemptsCount || 0,
        }
      })
    )

    return { tests: testsWithStats }
  } catch (error) {
    console.error('Error in getLecturerStandaloneTests:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Publish test
 */
export async function publishTest(testId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify ownership
    const { data: test } = await supabase
      .from('tests')
      .select('created_by, is_standalone, course_id')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { error: 'Test not found or unauthorized' }
    }

    // Verify test has questions
    const { count: questionsCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId)

    if (!questionsCount || questionsCount === 0) {
      return { error: 'Cannot publish test without questions' }
    }

    // Update test
    const { error } = await supabase
      .from('tests')
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq('id', testId)

    if (error) {
      console.error('Error publishing test:', error)
      return { error: 'Failed to publish test' }
    }

    if (test.is_standalone) {
      revalidatePath('/lecturer/tests/standalone')
    } else {
      revalidatePath(`/lecturer/courses/${test.course_id}`)
    }

    // Send test invitation emails to enrolled students (for course tests)
    if (!test.is_standalone && test.course_id) {
      try {
        const supabase = await createClient()
        
        // Get test details
        const { data: testDetails } = await supabase
          .from('tests')
          .select('id, title, duration, max_attempts')
          .eq('id', testId)
          .single()

        // Get course details
        const { data: courseDetails } = await supabase
          .from('courses')
          .select('id, course_code, course_title')
          .eq('id', test.course_id)
          .single()

        // Get enrolled students
        const { data: enrolledStudents } = await supabase
          .from('course_enrollments')
          .select(`
            student_id,
            profiles:student_id (id, email, first_name, last_name)
          `)
          .eq('course_id', test.course_id)
          .eq('enrollment_status', 'active')

        // Send emails to all enrolled students
        if (enrolledStudents && enrolledStudents.length > 0) {
          const validStudents = enrolledStudents.filter(s => (s.profiles as any)?.email)
          
          for (const student of validStudents) {
            try {
              await sendTestInvitationEmail(
                (student.profiles as any)?.email || '',
                (student.profiles as any)?.first_name || 'Student',
                courseDetails?.course_title || '',
                testDetails?.title || 'New Test',
                testDetails?.id || testId,
                testDetails?.duration || 0,
                testDetails?.max_attempts || 1
              )
            } catch (emailError) {
              console.error(`Failed to send test email to ${(student.profiles as any)?.email}:`, emailError)
              // Continue with other students
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send test invitation emails:', emailError)
        // Don't fail test publication if email fails
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in publishTest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Unpublish test
 */
export async function unpublishTest(testId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data: test } = await supabase
      .from('tests')
      .select('created_by, is_standalone, course_id')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { error: 'Test not found or unauthorized' }
    }

    const { error } = await supabase
      .from('tests')
      .update({ is_published: false, updated_at: new Date().toISOString() })
      .eq('id', testId)

    if (error) {
      console.error('Error unpublishing test:', error)
      return { error: 'Failed to unpublish test' }
    }

    if (test.is_standalone) {
      revalidatePath('/lecturer/tests/standalone')
    } else {
      revalidatePath(`/lecturer/courses/${test.course_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in unpublishTest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete test
 */
export async function deleteTest(testId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data: test } = await supabase
      .from('tests')
      .select('created_by, is_standalone, course_id')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { error: 'Test not found or unauthorized' }
    }

    // Check if test has attempts
    const { count: attemptsCount } = await supabase
      .from('test_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId)

    if (attemptsCount && attemptsCount > 0) {
      return { error: 'Cannot delete test with existing attempts' }
    }

    // Delete test (cascade will handle questions and options)
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId)

    if (error) {
      console.error('Error deleting test:', error)
      return { error: 'Failed to delete test' }
    }

    if (test.is_standalone) {
      revalidatePath('/lecturer/tests/standalone')
    } else {
      revalidatePath(`/lecturer/courses/${test.course_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteTest:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get test statistics
 */
export async function getTestStatistics(testId: string): Promise<{ statistics?: TestStatistics; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: attempts, error } = await supabase
      .from('test_attempts')
      .select('total_score, percentage, passed, time_taken_minutes, status')
      .eq('test_id', testId)

    if (error) {
      console.error('Error fetching test statistics:', error)
      return { error: 'Failed to fetch statistics' }
    }

    const completedAttempts = attempts.filter(a => a.status === 'completed')
    const inProgressAttempts = attempts.filter(a => a.status === 'in_progress')

    const statistics: TestStatistics = {
      total_attempts: attempts.length,
      completed_attempts: completedAttempts.length,
      in_progress_attempts: inProgressAttempts.length,
      average_score: completedAttempts.length
        ? completedAttempts.reduce((sum, a) => sum + (a.total_score || 0), 0) / completedAttempts.length
        : 0,
      pass_rate: completedAttempts.length
        ? (completedAttempts.filter(a => a.passed).length / completedAttempts.length) * 100
        : 0,
      average_time_taken: completedAttempts.length
        ? completedAttempts.reduce((sum, a) => sum + (a.time_taken_minutes || 0), 0) / completedAttempts.length
        : 0,
      highest_score: completedAttempts.length
        ? Math.max(...completedAttempts.map(a => a.total_score || 0))
        : 0,
      lowest_score: completedAttempts.length
        ? Math.min(...completedAttempts.map(a => a.total_score || 0))
        : 0,
    }

    return { statistics }
  } catch (error) {
    console.error('Error in getTestStatistics:', error)
    return { error: 'An unexpected error occurred' }
  }
}