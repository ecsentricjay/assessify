'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'

/**
 * Access Control Utility for Server Actions
 * Provides role-based access checks for operations on RLS-disabled tables
 * 
 * Tables with RLS ENABLED (already protected):
 * - wallets, transactions, assignment_submissions, test_attempts, student_answers
 * - lecturer_earnings, partners, partner_earnings, partner_withdrawals
 * - withdrawal_requests, notifications, audit_logs, admin_actions
 * - virtual_accounts, refunds, referrals
 * 
 * Tables with RLS DISABLED (require access control):
 * - profiles, courses, course_enrollments, course_lecturers, assignments
 * - tests, questions, question_options, institutions, ca_records
 */

export interface AccessCheckResult {
  allowed: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: { id: string; email?: string; profile?: any } | null
  error?: string
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  return {
    allowed: true,
    user
  }
}

/**
 * Check if user has a specific role
 */
export async function requireRole(role: 'admin' | 'lecturer' | 'student' | 'partner'): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  if (user.profile?.role !== role) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  return {
    allowed: true,
    user
  }
}

/**
 * Check if user has one of multiple roles
 */
export async function requireRoles(roles: string[]): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  if (!roles.includes(user.profile?.role)) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  return {
    allowed: true,
    user
  }
}

/**
 * Check if user is the owner of a resource (general purpose)
 * @param resourceUserId The user ID of the resource owner
 */
export async function checkOwnership(resourceUserId: string): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  // Admins can access all resources
  if (user.profile?.role === 'admin') {
    return {
      allowed: true,
      user
    }
  }
  
  // Check if user owns the resource
  if (user.id !== resourceUserId) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  return {
    allowed: true,
    user
  }
}

/**
 * Check if lecturer created a course
 * Access: Lecturer who created it, or Admin
 */
export async function checkCourseAccess(courseId: string): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  // Admins can access all courses
  if (user.profile?.role === 'admin') {
    return {
      allowed: true,
      user
    }
  }
  
  // Only lecturers can have course access
  if (user.profile?.role !== 'lecturer') {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Check if lecturer teaches this course
  const supabase = await createClient()
  const { data: lecturerCourse } = await supabase
    .from('course_lecturers')
    .select('id')
    .eq('course_id', courseId)
    .eq('lecturer_id', user.id)
    .single()
  
  if (!lecturerCourse) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  return {
    allowed: true,
    user
  }
}

/**
 * Check if student is enrolled in a course
 * Access: Enrolled student or Admin
 */
export async function checkCourseEnrollment(courseId: string): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  // Admins can access all enrollments
  if (user.profile?.role === 'admin') {
    return {
      allowed: true,
      user
    }
  }
  
  // Only students have enrollments
  if (user.profile?.role !== 'student') {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Check if student is enrolled
  const supabase = await createClient()
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .eq('enrollment_status', 'active')
    .single()
  
  if (!enrollment) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  return {
    allowed: true,
    user
  }
}

/**
 * Check if lecturer created an assignment
 * Access: Author lecturer, primary course lecturer, or Admin
 */
export async function checkAssignmentAccess(assignmentId: string): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  // Admins can access all assignments
  if (user.profile?.role === 'admin') {
    return {
      allowed: true,
      user
    }
  }
  
  // Only lecturers can create/manage assignments
  if (user.profile?.role !== 'lecturer') {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Check if lecturer created this assignment or teaches the course
  const supabase = await createClient()
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, created_by, course_id')
    .eq('id', assignmentId)
    .single()
  
  if (!assignment) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Check if user created it
  if (assignment.created_by === user.id) {
    return {
      allowed: true,
      user
    }
  }
  
  // Check if it's a course assignment and user teaches the course
  if (assignment.course_id) {
    const { data: lecturerCourse } = await supabase
      .from('course_lecturers')
      .select('id')
      .eq('course_id', assignment.course_id)
      .eq('lecturer_id', user.id)
      .single()
    
    if (lecturerCourse) {
      return {
        allowed: true,
        user
      }
    }
  }
  
  return {
    allowed: false,
    user,
    error: 'Unauthorized access'
  }
}

/**
 * Check if lecturer created a test
 * Access: Author lecturer or Admin
 */
export async function checkTestAccess(testId: string): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  // Admins can access all tests
  if (user.profile?.role === 'admin') {
    return {
      allowed: true,
      user
    }
  }
  
  // Only lecturers can create/manage tests
  if (user.profile?.role !== 'lecturer') {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Check if lecturer created this test
  const supabase = await createClient()
  const { data: test } = await supabase
    .from('tests')
    .select('id, created_by, course_id')
    .eq('id', testId)
    .single()
  
  if (!test) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Check if user created it
  if (test.created_by === user.id) {
    return {
      allowed: true,
      user
    }
  }
  
  // Check if it's a course test and user teaches the course
  if (test.course_id) {
    const { data: lecturerCourse } = await supabase
      .from('course_lecturers')
      .select('id')
      .eq('course_id', test.course_id)
      .eq('lecturer_id', user.id)
      .single()
    
    if (lecturerCourse) {
      return {
        allowed: true,
        user
      }
    }
  }
  
  return {
    allowed: false,
    user,
    error: 'Unauthorized access'
  }
}

/**
 * Check if student can attempt a test
 * Access: Enrolled student (for course tests) or any student (for standalone), or Admin
 */
export async function checkTestAttemptAccess(testId: string): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  // Admins can access all tests
  if (user.profile?.role === 'admin') {
    return {
      allowed: true,
      user
    }
  }
  
  // Only students can attempt tests
  if (user.profile?.role !== 'student') {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  const supabase = await createClient()
  const { data: test } = await supabase
    .from('tests')
    .select('id, course_id, is_standalone')
    .eq('id', testId)
    .single()
  
  if (!test) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Standalone tests: any student can attempt
  if (test.is_standalone) {
    return {
      allowed: true,
      user
    }
  }
  
  // Course tests: student must be enrolled
  if (test.course_id) {
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', test.course_id)
      .eq('student_id', user.id)
      .eq('enrollment_status', 'active')
      .single()
    
    if (enrollment) {
      return {
        allowed: true,
        user
      }
    }
  }
  
  return {
    allowed: false,
    user,
    error: 'Unauthorized access'
  }
}

/**
 * Check if student can access CA records
 * Access: Own records or Admin
 */
export async function checkCARecordAccess(studentId: string): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  // Admins can access all CA records
  if (user.profile?.role === 'admin') {
    return {
      allowed: true,
      user
    }
  }
  
  // Only students can view their own CA records
  if (user.profile?.role !== 'student') {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Check if accessing own records
  if (user.id !== studentId) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  return {
    allowed: true,
    user
  }
}

/**
 * Check if partner can access own profile
 * Access: Own profile or Admin
 */
export async function checkPartnerAccess(partnerId: string): Promise<AccessCheckResult> {
  const user = await getCurrentUser()
  
  if (!user) {
    return {
      allowed: false,
      user: null,
      error: 'Not authenticated'
    }
  }
  
  // Admins can access all partners
  if (user.profile?.role === 'admin') {
    return {
      allowed: true,
      user
    }
  }
  
  // Only partners can view their own profile
  if (user.profile?.role !== 'partner') {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  // Check if accessing own profile
  if (user.id !== partnerId) {
    return {
      allowed: false,
      user,
      error: 'Unauthorized access'
    }
  }
  
  return {
    allowed: true,
    user
  }
}
