'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './auth.actions'
import { notifyEnrollmentConfirmed, notifyStudentEnrolled } from './notification-helpers'
import { sendEnrollmentConfirmationEmail } from './email.actions'
import { checkCourseAccess, checkCourseEnrollment, requireRole } from './access-control'

// Create admin client for bypassing RLS
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

export async function createCourse(formData: {
  courseCode: string
  courseTitle: string
  description: string
  department: string
  faculty: string
  level: number
  semester: number
  creditUnits: number
  session: string
  totalCaMarks: number
  attendanceMarks: number
}) {
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { error: 'Unauthorized' }
  }

  // Use service client to bypass RLS
  const adminClient = createServiceClient()

  // Create course with institution_id and CA marks configuration
  const { data: course, error: courseError } = await adminClient
    .from('courses')
    .insert({
      institution_id: user.profile.institution_id,
      course_code: formData.courseCode,
      course_title: formData.courseTitle,
      description: formData.description,
      department: formData.department,
      faculty: formData.faculty,
      level: formData.level,
      semester: formData.semester,
      credit_units: formData.creditUnits,
      session: formData.session,
      total_ca_marks: formData.totalCaMarks,
      attendance_marks: formData.attendanceMarks,
      created_by: user.id,
      is_active: true,
    })
    .select()
    .single()

  if (courseError) {
    console.error('Course creation error:', courseError)
    return { error: courseError.message }
  }

  // Add lecturer to course_lecturers (as primary)
  const { error: lecturerError } = await adminClient
    .from('course_lecturers')
    .insert({
      course_id: course.id,
      lecturer_id: user.id,
      is_primary: true,
    })

  if (lecturerError) {
    console.error('Lecturer assignment error:', lecturerError)
    return { error: lecturerError.message }
  }

  revalidatePath('/lecturer/courses')
  return { success: true, course }
}

export async function getLecturerCourses() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('course_lecturers')
    .select(`
      course_id,
      is_primary,
      assigned_at,
      courses (
        id,
        course_code,
        course_title,
        description,
        level,
        semester,
        session,
        credit_units,
        is_active,
        enrollment_code,
        created_at
      )
    `)
    .eq('lecturer_id', user.id)
    .order('assigned_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { courses: data }
}

export async function getStudentCourses() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      id,
      enrollment_status,
      enrolled_at,
      courses (
        id,
        course_code,
        course_title,
        description,
        level,
        semester,
        session,
        credit_units
      )
    `)
    .eq('student_id', user.id)
    .eq('enrollment_status', 'active')
    .order('enrolled_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { courses: data }
}

export async function getAvailableCourses(searchQuery?: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  // Get courses matching student's institution and not already enrolled
  const { data: enrolledCourses } = await supabase
    .from('course_enrollments')
    .select('course_id')
    .eq('student_id', user.id)

  const enrolledIds = enrolledCourses?.map(e => e.course_id) || []

  let query = supabase
    .from('courses')
    .select(`
      id,
      course_code,
      course_title,
      description,
      level,
      semester,
      session,
      credit_units,
      department,
      faculty,
      enrollment_code
    `)
    .eq('is_active', true)
    .eq('institution_id', user.profile.institution_id) // Filter by institution
    .order('course_code')

  // Filter out enrolled courses if there are any
  if (enrolledIds.length > 0) {
    query = query.not('id', 'in', `(${enrolledIds.join(',')})`)
  }

  // Add search filter if provided
  if (searchQuery) {
    query = query.or(`course_code.ilike.%${searchQuery}%,course_title.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { courses: data }
}

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  // Get course details for notifications
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, course_code, course_title, created_by')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    return { error: 'Course not found' }
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .single()

  if (existing) {
    return { error: 'You are already enrolled in this course' }
  }

  // Enroll student
  const { error: enrollError } = await supabase
    .from('course_enrollments')
    .insert({
      course_id: courseId,
      student_id: user.id,
      enrollment_status: 'active',
    })

  if (enrollError) {
    return { error: enrollError.message }
  }

  // ✨ Send notifications and email
  try {
    // 1. Notify student of successful enrollment (in-app)
    await notifyEnrollmentConfirmed(
      user.id,
      course.course_code,
      course.course_title,
      courseId
    )

    // 2. Send enrollment confirmation email
    const lecturerProfile = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', course.created_by)
      .single()

    const lecturerName = lecturerProfile.data
      ? `${lecturerProfile.data.first_name} ${lecturerProfile.data.last_name}`
      : 'Your Lecturer'

    await sendEnrollmentConfirmationEmail(
      user.email || '',
      user.profile?.first_name || 'Student',
      course.course_code,
      course.course_title,
      lecturerName,
      new Date().toLocaleDateString()
    )

    // 3. Notify lecturer of new student enrollment (in-app)
    if (course.created_by) {
      const studentName = `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim()
      
      await notifyStudentEnrolled(
        course.created_by,
        studentName || 'A student',
        course.course_code,
        course.course_title,
        courseId
      )
    }
  } catch (notifError) {
    // Don't fail the enrollment if notification fails
    console.error('Failed to send enrollment notifications:', notifError)
  }

  revalidatePath('/student/courses')
  return { success: true, message: 'Successfully enrolled in course!' }
}

export async function enrollWithCode(enrollmentCode: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  // Find course by enrollment code and verify it's in the same institution
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, course_code, course_title, institution_id, created_by')
    .eq('enrollment_code', enrollmentCode.toUpperCase())
    .eq('is_active', true)
    .single()

  if (courseError || !course) {
    return { error: 'Invalid enrollment code' }
  }

  // Verify same institution
  if (course.institution_id !== user.profile.institution_id) {
    return { error: 'This course is not available for your institution' }
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', course.id)
    .eq('student_id', user.id)
    .single()

  if (existing) {
    return { error: 'You are already enrolled in this course' }
  }

  // Enroll student
  const { error: enrollError } = await supabase
    .from('course_enrollments')
    .insert({
      course_id: course.id,
      student_id: user.id,
      enrollment_status: 'active',
    })

  if (enrollError) {
    return { error: enrollError.message }
  }

  // ✨ Send notifications and email
  try {
    // 1. Notify student of successful enrollment (in-app)
    await notifyEnrollmentConfirmed(
      user.id,
      course.course_code,
      course.course_title,
      course.id
    )

    // 2. Send enrollment confirmation email
    const lecturerProfile = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', course.created_by)
      .single()

    const lecturerName = lecturerProfile.data
      ? `${lecturerProfile.data.first_name} ${lecturerProfile.data.last_name}`
      : 'Your Lecturer'

    await sendEnrollmentConfirmationEmail(
      user.email || '',
      user.profile?.first_name || 'Student',
      course.course_code,
      course.course_title,
      lecturerName,
      new Date().toLocaleDateString()
    )

    // 3. Notify lecturer of new student enrollment (in-app)
    if (course.created_by) {
      const studentName = `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim()
      
      await notifyStudentEnrolled(
        course.created_by,
        studentName || 'A student',
        course.course_code,
        course.course_title,
        course.id
      )
    }
  } catch (notifError) {
    // Don't fail the enrollment if notification fails
    console.error('Failed to send enrollment notifications:', notifError)
  }

  revalidatePath('/student/courses')
  return { success: true, message: `Successfully enrolled in ${course.course_title}!` }
}

export async function unenrollFromCourse(courseId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('course_enrollments')
    .update({ enrollment_status: 'dropped' })
    .eq('course_id', courseId)
    .eq('student_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/student/courses')
  return { success: true, message: 'Successfully dropped course!' }
}

export async function getCourseById(courseId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      course_lecturers (
        lecturer_id,
        is_primary,
        profiles (
          id,
          first_name,
          last_name,
          title
        )
      )
    `)
    .eq('id', courseId)
    .single()

  if (error) {
    return { error: error.message }
  }

  // Access control: Students can only see courses they're enrolled in
  // Lecturers can see any course, Admins can see any course
  if (user && user.profile?.role === 'student') {
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .eq('enrollment_status', 'active')
      .single()

    if (!enrollment) {
      return { error: 'You do not have access to this course' }
    }
  }

  // Get enrollment count
  const { count } = await supabase
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('enrollment_status', 'active')

  return { success: true, course: { ...course, enrollmentCount: count || 0 } }
}

export async function updateCourse(courseId: string, formData: {
  courseTitle: string
  description: string
  creditUnits: number
  isActive: boolean
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
  }

  // Check if lecturer teaches this course
  const { data: lecturerCourse } = await supabase
    .from('course_lecturers')
    .select('course_id')
    .eq('course_id', courseId)
    .eq('lecturer_id', user.id)
    .single()

  if (!lecturerCourse) {
    return { success: false, error: 'You do not have permission to edit this course' }
  }

  const { error } = await supabase
    .from('courses')
    .update({
      course_title: formData.courseTitle,
      description: formData.description,
      credit_units: formData.creditUnits,
      is_active: formData.isActive,
    })
    .eq('id', courseId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/lecturer/courses')
  return { success: true, message: 'Course updated successfully!' }
}

export async function deleteCourse(courseId: string, forceDelete: boolean = false) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    return { success: false, error: 'Unauthorized access' }
  }

  // Check if lecturer teaches this course (must be primary lecturer to delete)
  const { data: lecturerCourse } = await supabase
    .from('course_lecturers')
    .select('course_id, is_primary')
    .eq('course_id', courseId)
    .eq('lecturer_id', user.id)
    .single()

  if (!lecturerCourse) {
    return { success: false, error: 'You do not have permission to delete this course' }
  }

  if (!lecturerCourse.is_primary) {
    return { success: false, error: 'Only the primary lecturer can delete this course' }
  }

  // Check for enrollments
  const { count: enrollmentCount } = await supabase
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('enrollment_status', 'active')

  // Check for assignments
  const { count: assignmentCount } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)

  const hasData = (enrollmentCount ?? 0) > 0 || (assignmentCount ?? 0) > 0

  // If course has data and not forcing delete, return warning
  if (hasData && !forceDelete) {
    return {
      error: 'HAS_DATA',
      enrollmentCount: enrollmentCount ?? 0,
      assignmentCount: assignmentCount ?? 0
    }
  }

  // Use service client for cascade deletion
  const adminClient = createServiceClient()

  try {
    // If forcing delete, remove all related data first
    if (forceDelete && hasData) {
      // Get all assignments for this course
      const { data: assignments } = await adminClient
        .from('assignments')
        .select('id')
        .eq('course_id', courseId)

      if (assignments && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id)

        // Delete assignment submissions and their files
        const { data: submissions } = await adminClient
          .from('assignment_submissions')
          .select('id, file_url')
          .in('assignment_id', assignmentIds)

        if (submissions && submissions.length > 0) {
          // Delete files from storage
          for (const submission of submissions) {
            if (submission.file_url) {
              const filePath = submission.file_url.split('/').pop()
              if (filePath) {
                await adminClient.storage
                  .from('assignment-submissions')
                  .remove([filePath])
              }
            }
          }

          // Delete submissions
          await adminClient
            .from('assignment_submissions')
            .delete()
            .in('assignment_id', assignmentIds)
        }

        // Delete assignments
        await adminClient
          .from('assignments')
          .delete()
          .eq('course_id', courseId)
      }

      // Delete enrollments
      await adminClient
        .from('course_enrollments')
        .delete()
        .eq('course_id', courseId)

      // Delete course attendance records if they exist
      await adminClient
        .from('attendance_records')
        .delete()
        .eq('course_id', courseId)
    }

    // Delete course lecturers
    await adminClient
      .from('course_lecturers')
      .delete()
      .eq('course_id', courseId)

    // Finally, delete the course
    const { error: deleteError } = await adminClient
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (deleteError) {
      console.error('Course deletion error:', deleteError)
      return { error: deleteError.message }
    }

    revalidatePath('/lecturer/courses')
    return { success: true, message: 'Course deleted successfully' }
  } catch (error) {
    const err = error as Error
    console.error('Course deletion error:', err)
    return { error: err.message || 'Failed to delete course' }
  }
}

/**
 * Get all students enrolled in a course
 * Access: Lecturers of the course or Admin
 */
export async function getCourseStudents(courseId: string) {
  const user = await getCurrentUser()
  const supabase = await createClient()

  // Authorization: Only lecturers and admins can view students in a course
  if (!user) {
    return { success: false, error: 'Not authenticated', data: [] }
  }

  if (user.profile?.role !== 'lecturer' && user.profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized access', data: [] }
  }

  // If lecturer, verify they teach this course
  if (user.profile?.role === 'lecturer') {
    const { data: lecturerCourse } = await supabase
      .from('course_lecturers')
      .select('id')
      .eq('course_id', courseId)
      .eq('lecturer_id', user.id)
      .single()

    if (!lecturerCourse) {
      return { success: false, error: 'You do not have permission to view students in this course', data: [] }
    }
  }

  try {
    // Get enrollments with student data
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('student_id, enrollment_status, enrolled_at')
      .eq('course_id', courseId)
      .eq('enrollment_status', 'active')

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
      return { success: false, error: enrollmentError.message, data: [] }
    }

    if (!enrollments || enrollments.length === 0) {
      return { success: true, data: [] }
    }

    // Get student profiles separately to avoid nested relationship issues
    const studentIds = enrollments.map(e => e.student_id)
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, matric_number, department, level')
      .in('id', studentIds)

    if (profileError) {
      console.error('Error fetching profiles:', profileError)
      return { success: false, error: profileError.message || 'Failed to fetch student profiles', data: [] }
    }

    if (!profiles || profiles.length === 0) {
      console.warn('No profiles returned. This might be an RLS policy issue.')
      return { 
        success: true,
        data: enrollments.map(enrollment => ({
          student_id: enrollment.student_id,
          enrollment_status: enrollment.enrollment_status,
          enrolled_at: enrollment.enrolled_at,
          student: null
        }))
      }
    }

    // Merge enrollment with profile data
    const result = enrollments.map(enrollment => ({
      student_id: enrollment.student_id,
      enrollment_status: enrollment.enrollment_status,
      enrolled_at: enrollment.enrolled_at,
      student: profiles.find(p => p.id === enrollment.student_id) || null
    }))

    return { success: true, data: result }
  } catch (error) {
    const err = error as Error
    console.error('Unexpected error in getCourseStudents:', err)
    return { success: false, error: err.message || 'Failed to fetch course students', data: [] }
  }
}