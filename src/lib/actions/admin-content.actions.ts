// lib/actions/admin-content.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin, logAdminAction } from './admin-auth.actions'

export interface CourseWithDetails {
  id: string
  course_code: string
  course_title: string
  description: string | null
  department: string | null
  faculty: string | null
  level: number | null
  is_active: boolean
  created_at: string
  created_by: string
  profiles: {
    first_name: string
    last_name: string
  }
  _count?: {
    enrollments: number
    assignments: number
    tests: number
  }
}

export interface AssignmentWithDetails {
  id: string
  title: string
  description: string
  deadline: string
  is_published: boolean
  is_standalone: boolean
  created_at: string
  courses: {
    course_code: string
    course_title: string
  } | null
  profiles: {
    first_name: string
    last_name: string
  }
  _count?: {
    submissions: number
  }
}

export interface TestWithDetails {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  is_published: boolean
  is_standalone: boolean
  created_at: string
  courses: {
    course_code: string
    course_title: string
  } | null
  profiles: {
    first_name: string
    last_name: string
  }
  _count?: {
    attempts: number
  }
}

/**
 * Get all courses with details
 */
export async function getAllCourses(params?: {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  page?: number
  limit?: number
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { search = '', status = 'all', page = 1, limit = 20 } = params || {}

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('courses')
      .select(`
        id,
        course_code,
        course_title,
        description,
        department,
        faculty,
        level,
        is_active,
        created_at,
        created_by,
        profiles(first_name, last_name)
      `, { count: 'exact' })

    // Filter by status
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Filter by search in memory
    let filteredData = data || []
    if (search) {
      filteredData = (data || []).filter(course =>
        course.course_code.toLowerCase().includes(search.toLowerCase()) ||
        course.course_title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Get enrollment and content counts
    const coursesWithCounts = await Promise.all(
      filteredData.map(async (course: any) => {
        const [enrollments, assignments, tests] = await Promise.all([
          supabase.from('course_enrollments').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('tests').select('*', { count: 'exact', head: true }).eq('course_id', course.id)
        ])

        return {
          ...course,
          profiles: Array.isArray(course.profiles) ? course.profiles[0] : course.profiles,
          _count: {
            enrollments: enrollments.count || 0,
            assignments: assignments.count || 0,
            tests: tests.count || 0
          }
        } as CourseWithDetails
      })
    )

    return {
      success: true,
      courses: coursesWithCounts,
      total: search ? filteredData.length : (count || 0),
      page,
      limit
    }
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch courses'
    }
  }
}

/**
 * Toggle course active status
 */
export async function toggleCourseStatus(courseId: string, isActive: boolean) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('courses')
      .update({ is_active: isActive })
      .eq('id', courseId)

    if (error) throw error

    await logAdminAction({
      actionType: isActive ? 'ACTIVATE_COURSE' : 'SUSPEND_COURSE',
      targetType: 'course',
      targetId: courseId,
      details: { is_active: isActive }
    })

    return {
      success: true,
      message: `Course ${isActive ? 'activated' : 'suspended'} successfully`
    }
  } catch (error: any) {
    console.error('Error toggling course status:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update course status'
    }
  }
}

/**
 * Get all assignments with details
 */
export async function getAllAssignments(params?: {
  search?: string
  status?: 'all' | 'published' | 'unpublished'
  page?: number
  limit?: number
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { search = '', status = 'all', page = 1, limit = 20 } = params || {}

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        deadline,
        is_published,
        is_standalone,
        created_at,
        course_id,
        created_by,
        courses(course_code, course_title),
        profiles(first_name, last_name)
      `, { count: 'exact' })

    // Filter by status
    if (status === 'published') {
      query = query.eq('is_published', true)
    } else if (status === 'unpublished') {
      query = query.eq('is_published', false)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Filter by search
    let filteredData = data || []
    if (search) {
      filteredData = (data || []).filter(assignment =>
        assignment.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Get submission counts
    const assignmentsWithCounts = await Promise.all(
      filteredData.map(async (assignment: any) => {
        const { count: submissionCount } = await supabase
          .from('assignment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assignment_id', assignment.id)

        return {
          ...assignment,
          courses: Array.isArray(assignment.courses) ? assignment.courses[0] : assignment.courses,
          profiles: Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles,
          _count: { submissions: submissionCount || 0 }
        } as AssignmentWithDetails
      })
    )

    return {
      success: true,
      assignments: assignmentsWithCounts,
      total: search ? filteredData.length : (count || 0),
      page,
      limit
    }
  } catch (error: any) {
    console.error('Error fetching assignments:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch assignments'
    }
  }
}

/**
 * Toggle assignment published status
 */
export async function toggleAssignmentStatus(assignmentId: string, isPublished: boolean) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('assignments')
      .update({ is_published: isPublished })
      .eq('id', assignmentId)

    if (error) throw error

    await logAdminAction({
      actionType: isPublished ? 'PUBLISH_ASSIGNMENT' : 'UNPUBLISH_ASSIGNMENT',
      targetType: 'assignment',
      targetId: assignmentId,
      details: { is_published: isPublished }
    })

    return {
      success: true,
      message: `Assignment ${isPublished ? 'published' : 'unpublished'} successfully`
    }
  } catch (error: any) {
    console.error('Error toggling assignment status:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update assignment status'
    }
  }
}

/**
 * Get all tests with details
 */
export async function getAllTests(params?: {
  search?: string
  status?: 'all' | 'published' | 'unpublished'
  page?: number
  limit?: number
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { search = '', status = 'all', page = 1, limit = 20 } = params || {}

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('tests')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        is_published,
        is_standalone,
        created_at,
        course_id,
        created_by,
        courses(course_code, course_title),
        profiles(first_name, last_name)
      `, { count: 'exact' })

    // Filter by status
    if (status === 'published') {
      query = query.eq('is_published', true)
    } else if (status === 'unpublished') {
      query = query.eq('is_published', false)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Filter by search
    let filteredData = data || []
    if (search) {
      filteredData = (data || []).filter(test =>
        test.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Get attempt counts
    const testsWithCounts = await Promise.all(
      filteredData.map(async (test: any) => {
        const { count: attemptCount } = await supabase
          .from('test_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id)

        return {
          ...test,
          courses: Array.isArray(test.courses) ? test.courses[0] : test.courses,
          profiles: Array.isArray(test.profiles) ? test.profiles[0] : test.profiles,
          _count: { attempts: attemptCount || 0 }
        } as TestWithDetails
      })
    )

    return {
      success: true,
      tests: testsWithCounts,
      total: search ? filteredData.length : (count || 0),
      page,
      limit
    }
  } catch (error: any) {
    console.error('Error fetching tests:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch tests'
    }
  }
}

/**
 * Toggle test publish status
 */
export async function toggleTestStatus(testId: string, isPublished: boolean) {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('tests')
      .update({ is_published: isPublished })
      .eq('id', testId)

    if (error) throw error

    await logAdminAction({
      actionType: isPublished ? 'PUBLISH_TEST' : 'UNPUBLISH_TEST',
      targetType: 'test',
      targetId: testId,
      details: { is_published: isPublished }
    })

    return {
      success: true,
      message: `Test ${isPublished ? 'published' : 'unpublished'} successfully`
    }
  } catch (error: any) {
    console.error('Error toggling test status:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update test status'
    }
  }
}

/**
 * Get recent submissions across platform
 */
export async function getRecentSubmissions(params?: {
  limit?: number
  type?: 'all' | 'assignment' | 'test'
}) {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { limit = 50, type = 'all' } = params || {}

    let submissions: any[] = []

    // Get assignment submissions
    if (type === 'all' || type === 'assignment') {
      const { data: assignmentSubs } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          submitted_at,
          is_late,
          final_score,
          status,
          plagiarism_score,
          assignment_id,
          student_id,
          assignments(title, courses(course_code, course_title)),
          profiles(first_name, last_name)
        `)
        .order('submitted_at', { ascending: false })
        .limit(type === 'assignment' ? limit : Math.floor(limit / 2))

      submissions = [...submissions, ...(assignmentSubs || []).map(s => ({
        ...s,
        type: 'assignment' as const
      }))]
    }

    // Get test attempts
    if (type === 'all' || type === 'test') {
      const { data: testAttempts } = await supabase
        .from('test_attempts')
        .select(`
          id,
          submitted_at,
          score,
          status,
          test_id,
          student_id,
          tests(title, courses(course_code, course_title)),
          profiles(first_name, last_name)
        `)
        .order('submitted_at', { ascending: false })
        .limit(type === 'test' ? limit : Math.floor(limit / 2))

      submissions = [...submissions, ...(testAttempts || []).map(s => ({
        ...s,
        type: 'test' as const
      }))]
    }

    // Sort by submitted_at
    submissions.sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )

    return {
      success: true,
      submissions: submissions.slice(0, limit)
    }
  } catch (error: any) {
    console.error('Error fetching submissions:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch submissions'
    }
  }
}

/**
 * Get submission statistics
 */
export async function getSubmissionStatistics() {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const [assignmentSubs, testAttempts] = await Promise.all([
      supabase.from('assignment_submissions').select('*', { count: 'exact', head: true }),
      supabase.from('test_attempts').select('*', { count: 'exact', head: true })
    ])

    // Get today's submissions
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: todayAssignments } = await supabase
      .from('assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', today.toISOString())

    const { count: todayTests } = await supabase
      .from('test_attempts')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', today.toISOString())

    // Get flagged submissions (high plagiarism or suspicious)
    const { count: flaggedCount } = await supabase
      .from('assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .gte('plagiarism_score', 70)

    return {
      success: true,
      statistics: {
        totalAssignmentSubmissions: assignmentSubs.count || 0,
        totalTestAttempts: testAttempts.count || 0,
        todaySubmissions: (todayAssignments || 0) + (todayTests || 0),
        flaggedSubmissions: flaggedCount || 0
      }
    }
  } catch (error: any) {
    console.error('Error fetching submission statistics:', error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch statistics'
    }
  }
}