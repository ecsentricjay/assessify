'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'

export async function getLecturerAnalytics() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  // Get all courses taught by lecturer
  const { data: courses } = await supabase
    .from('course_lecturers')
    .select(`
      course_id,
      courses (
        id,
        course_code,
        course_title,
        session,
        semester
      )
    `)
    .eq('lecturer_id', user.id)

  const courseIds = courses?.map(c => c.course_id) || []

  // Get all tests created by lecturer (standalone and course-based)
  const { data: allTests } = await supabase
    .from('tests')
    .select('id, title, is_standalone, course_id, total_marks, is_published')
    .eq('created_by', user.id)

  const testsList = allTests || []
  const standaloneTestsList = testsList.filter(t => t.is_standalone)
  const courseTestsList = testsList.filter(t => !t.is_standalone && t.course_id)

  if (courseIds.length === 0 && testsList.length === 0) {
    return {
      summary: {
        totalCourses: 0,
        totalStudents: 0,
        totalAssignments: 0,
        totalTests: 0,
        standaloneTests: 0,
        courseTests: 0,
        totalTestAttempts: 0,
        completedTestAttempts: 0,
        pendingGrading: 0,
        totalEarnings: 0
      },
      courseStats: []
    }
  }

  // Get total students enrolled
  const { count: totalStudents } = await supabase
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .in('course_id', courseIds)
    .eq('enrollment_status', 'active')

  // Get total assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, course_id, is_published')
    .in('course_id', courseIds)

  const totalAssignments = assignments?.length || 0
  const publishedAssignments = assignments?.filter(a => a.is_published).length || 0

  // Get test attempts
  const testIds = testsList.map(t => t.id)
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select('id, status, test_id')
    .in('test_id', testIds)

  const totalTestAttempts = testAttempts?.length || 0
  const completedTestAttempts = testAttempts?.filter(a => a.status === 'completed').length || 0

  // Get submission stats
  const assignmentIds = assignments?.map(a => a.id) || []
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('id, status, assignment_id')
    .in('assignment_id', assignmentIds)

  const totalSubmissions = submissions?.length || 0
  const pendingGrading = submissions?.filter(s => s.status === 'submitted').length || 0
  const gradedSubmissions = submissions?.filter(s => s.status === 'graded').length || 0

  // Get earnings
  const { data: earnings } = await supabase
    .from('lecturer_earnings')
    .select('amount')
    .eq('lecturer_id', user.id)

  const totalEarnings = earnings?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

  // Calculate course-wise statistics
  const courseStats = await Promise.all(
    (courses || []).map(async (courseRel) => {
      const course = courseRel.courses as { id: string; [key: string]: any } | null | any
      
      // Type guard to ensure course is not an array
      if (!course || Array.isArray(course)) {
        return null
      }

      const courseId = course.id

      // Get enrollment count
      const { count: enrollmentCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('enrollment_status', 'active')

      // Get assignment count
      const courseAssignments = assignments?.filter(a => a.course_id === courseId) || []
      const publishedCount = courseAssignments.filter(a => a.is_published).length

      // Get test count for this course
      const courseTests = courseTestsList.filter(t => t.course_id === courseId)
      const courseTestIds = courseTests.map(t => t.id)
      const courseTestAttempts = testAttempts?.filter(a => 
        courseTestIds.includes(a.test_id)
      ).length || 0

      // Get submission stats for this course
      const courseAssignmentIds = courseAssignments.map(a => a.id)
      const courseSubmissions = submissions?.filter(s => 
        courseAssignmentIds.includes(s.assignment_id)
      ) || []

      const pending = courseSubmissions.filter(s => s.status === 'submitted').length
      const graded = courseSubmissions.filter(s => s.status === 'graded').length

      return {
        course,
        enrollmentCount: enrollmentCount || 0,
        assignmentCount: courseAssignments.length,
        publishedAssignments: publishedCount,
        testCount: courseTests.length,
        testAttempts: courseTestAttempts,
        totalSubmissions: courseSubmissions.length,
        pendingGrading: pending,
        gradedSubmissions: graded
      }
    })
  )

  // Filter out null values from courseStats
  const validCourseStats = courseStats.filter(stat => stat !== null)

  return {
    summary: {
      totalCourses: courses?.length || 0,
      totalStudents: totalStudents || 0,
      totalAssignments,
      publishedAssignments,
      totalTests: testsList.length,
      standaloneTests: standaloneTestsList.length,
      courseTests: courseTestsList.length,
      totalTestAttempts,
      completedTestAttempts,
      totalSubmissions,
      pendingGrading,
      gradedSubmissions,
      totalEarnings: parseFloat(totalEarnings.toFixed(2))
    },
    courseStats: validCourseStats
  }
}

export async function getCourseAnalytics(courseId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  // Verify lecturer teaches this course
  const { data: courseLecturer } = await supabase
    .from('course_lecturers')
    .select('id')
    .eq('course_id', courseId)
    .eq('lecturer_id', user.id)
    .single()

  if (!courseLecturer) {
    return { error: 'You do not teach this course' }
  }

  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  // Get enrolled students
  const { data: enrollments, count: totalStudents } = await supabase
    .from('course_enrollments')
    .select('student_id, profiles!inner(first_name, last_name, matric_number)', { count: 'exact' })
    .eq('course_id', courseId)
    .eq('enrollment_status', 'active')

  // Get all assignments for this course
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  const assignmentIds = assignments?.map(a => a.id) || []

  // Get all tests for this course
  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  const testIds = tests?.map(t => t.id) || []

  // Get all submissions
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select(`
      *,
      profiles:student_id (first_name, last_name, matric_number)
    `)
    .in('assignment_id', assignmentIds)

  // Get test attempts
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select('*')
    .in('test_id', testIds)

  // Calculate assignment statistics
  const assignmentStats = assignments?.map(assignment => {
    const assignmentSubmissions = submissions?.filter(s => s.assignment_id === assignment.id) || []
    const gradedCount = assignmentSubmissions.filter(s => s.status === 'graded').length
    const avgScore = gradedCount > 0
      ? assignmentSubmissions
          .filter(s => s.final_score !== null)
          .reduce((sum, s) => sum + (s.final_score || 0), 0) / gradedCount
      : 0

    return {
      id: assignment.id,
      title: assignment.title,
      deadline: assignment.deadline,
      maxScore: assignment.max_score,
      totalSubmissions: assignmentSubmissions.length,
      gradedSubmissions: gradedCount,
      pendingGrading: assignmentSubmissions.length - gradedCount,
      averageScore: parseFloat(avgScore.toFixed(2)),
      submissionRate: totalStudents ? (assignmentSubmissions.length / totalStudents) * 100 : 0
    }
  }) || []

  // Calculate test statistics
  const testStats = tests?.map(test => {
    const attempts = testAttempts?.filter(a => a.test_id === test.id) || []
    const completedAttempts = attempts.filter(a => a.status === 'completed')
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.total_score || 0), 0) / completedAttempts.length
      : 0

    return {
      id: test.id,
      title: test.title,
      totalMarks: test.total_marks,
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      averageScore: parseFloat(avgScore.toFixed(2)),
      passRate: completedAttempts.length > 0
        ? (completedAttempts.filter(a => a.passed).length / completedAttempts.length) * 100
        : 0
    }
  }) || []

  // Calculate grade distribution
  const allGradedScores = submissions
    ?.filter(s => s.final_score !== null)
    .map(s => s.final_score || 0) || []

  const gradeDistribution = {
    A: allGradedScores.filter(score => score >= 70).length,
    B: allGradedScores.filter(score => score >= 60 && score < 70).length,
    C: allGradedScores.filter(score => score >= 50 && score < 60).length,
    D: allGradedScores.filter(score => score >= 40 && score < 50).length,
    F: allGradedScores.filter(score => score < 40).length
  }

  // Student performance summary
  const studentPerformance = enrollments?.map(enrollment => {
    const profile = enrollment.profiles as { first_name?: string | null; last_name?: string | null; matric_number?: string | null } | null | any
    
    // Type guard
    if (!profile || Array.isArray(profile)) {
      return null
    }

    const studentSubmissions = submissions?.filter(s => s.student_id === enrollment.student_id) || []
    const gradedSubmissions = studentSubmissions.filter(s => s.final_score !== null)
    const avgScore = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.final_score || 0), 0) / gradedSubmissions.length
      : 0

    return {
      studentId: enrollment.student_id,
      name: `${profile.first_name} ${profile.last_name}`,
      matricNumber: profile.matric_number,
      submissionsCount: studentSubmissions.length,
      gradedCount: gradedSubmissions.length,
      averageScore: parseFloat(avgScore.toFixed(2))
    }
  }).filter(perf => perf !== null) || []

  // Sort by average score descending
  studentPerformance.sort((a, b) => (b?.averageScore || 0) - (a?.averageScore || 0))

  return {
    course,
    summary: {
      totalStudents: totalStudents || 0,
      totalAssignments: assignments?.length || 0,
      publishedAssignments: assignments?.filter(a => a.is_published).length || 0,
      totalTests: tests?.length || 0,
      totalSubmissions: submissions?.length || 0,
      gradedSubmissions: submissions?.filter(s => s.status === 'graded').length || 0,
      pendingGrading: submissions?.filter(s => s.status === 'submitted').length || 0,
      totalTestAttempts: testAttempts?.length || 0,
      completedTestAttempts: testAttempts?.filter(a => a.status === 'completed').length || 0
    },
    assignmentStats,
    testStats,
    gradeDistribution,
    studentPerformance: studentPerformance.slice(0, 10), // Top 10 students
    recentSubmissions: submissions?.slice(0, 5) || [] // Latest 5 submissions
  }
}

export async function getStudentPerformance(courseId: string, studentId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  // Get student details
  const { data: student } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single()

  // Get all assignments for the course
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('deadline', { ascending: true })

  const assignmentIds = assignments?.map(a => a.id) || []

  // Get student's submissions
  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*')
    .in('assignment_id', assignmentIds)
    .eq('student_id', studentId)

  // Get all tests for the course
  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('course_id', courseId)
    .order('start_time', { ascending: true })

  const testIds = tests?.map(t => t.id) || []

  // Get student's test attempts
  const { data: testAttempts } = await supabase
    .from('test_attempts')
    .select('*')
    .in('test_id', testIds)
    .eq('student_id', studentId)

  // Map submissions to assignments
  const performanceData = assignments?.map(assignment => {
    const submission = submissions?.find(s => s.assignment_id === assignment.id)
    return {
      assignmentTitle: assignment.title,
      deadline: assignment.deadline,
      maxScore: assignment.max_score,
      allocatedMarks: assignment.allocated_marks,
      submitted: !!submission,
      score: submission?.final_score || null,
      status: submission?.status || 'not_submitted',
      isLate: submission?.is_late || false,
      submittedAt: submission?.submitted_at || null
    }
  }) || []

  // Map test attempts to tests
  const testPerformanceData = tests?.map(test => {
    const attempts = testAttempts?.filter(a => a.test_id === test.id) || []
    const bestAttempt = attempts.length > 0
      ? attempts.reduce((best, current) => 
          (current.total_score || 0) > (best.total_score || 0) ? current : best
        )
      : null

    return {
      testTitle: test.title,
      totalMarks: test.total_marks,
      attemptsUsed: attempts.length,
      maxAttempts: test.max_attempts,
      bestScore: bestAttempt?.total_score || null,
      percentage: bestAttempt?.percentage || null,
      passed: bestAttempt?.passed || false,
      lastAttemptDate: bestAttempt?.submitted_at || null
    }
  }) || []

  // Calculate statistics
  const gradedSubmissions = submissions?.filter(s => s.final_score !== null) || []
  const averageScore = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.final_score || 0), 0) / gradedSubmissions.length
    : 0

  const submissionRate = assignments?.length
    ? (submissions?.length || 0) / assignments.length * 100
    : 0

  const completedTests = testAttempts?.filter(a => a.status === 'completed') || []
  const averageTestScore = completedTests.length > 0
    ? completedTests.reduce((sum, a) => sum + (a.total_score || 0), 0) / completedTests.length
    : 0

  return {
    student,
    summary: {
      totalAssignments: assignments?.length || 0,
      submitted: submissions?.length || 0,
      graded: gradedSubmissions.length,
      averageScore: parseFloat(averageScore.toFixed(2)),
      submissionRate: parseFloat(submissionRate.toFixed(1)),
      totalTests: tests?.length || 0,
      testAttempts: testAttempts?.length || 0,
      averageTestScore: parseFloat(averageTestScore.toFixed(2))
    },
    performanceData,
    testPerformanceData
  }
}