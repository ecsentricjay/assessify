// lib/actions/notification-helpers.ts
// Helper functions to create common notification types easily

'use server'

import { createNotification, createBulkNotifications } from './notifications.actions'
import type { NotificationMetadata } from '@/lib/types/notification.types'

/**
 * Notify student when assignment is graded
 */
export async function notifyAssignmentGraded(
  studentId: string,
  assignmentTitle: string,
  courseCode: string,
  score: number,
  maxScore: number,
  assignmentId: string,
  submissionId: string
) {
  return createNotification({
    user_id: studentId,
    type: 'grade_posted',
    title: '🎓 Assignment Graded',
    message: `Your assignment "${assignmentTitle}" in ${courseCode} has been graded. Score: ${score}/${maxScore}`,
    link: `/student/assignments/${assignmentId}/submission/${submissionId}`,
    metadata: {
      assignment_id: assignmentId,
      assignment_title: assignmentTitle,
      course_code: courseCode,
      score,
      max_score: maxScore,
      submission_id: submissionId,
    },
  })
}

/**
 * Notify student when test is graded
 */
export async function notifyTestGraded(
  studentId: string,
  testTitle: string,
  courseCode: string,
  score: number,
  maxScore: number,
  testId: string,
  attemptId: string
) {
  return createNotification({
    user_id: studentId,
    type: 'test_graded',
    title: '📝 Test Graded',
    message: `Your test "${testTitle}" in ${courseCode} has been graded. Score: ${score}/${maxScore}`,
    link: `/student/tests/${testId}/attempt/${attemptId}/results`,
    metadata: {
      test_id: testId,
      test_title: testTitle,
      course_code: courseCode,
      score,
      max_score: maxScore,
      attempt_id: attemptId,
    },
  })
}

/**
 * Notify enrolled students when new assignment is posted
 */
export async function notifyNewAssignment(
  studentIds: string[],
  assignmentTitle: string,
  courseCode: string,
  courseTitle: string,
  deadline: string,
  assignmentId: string,
  courseId: string
) {
  return createBulkNotifications(studentIds, {
    type: 'assignment_created',
    title: '📚 New Assignment Posted',
    message: `New assignment "${assignmentTitle}" posted in ${courseCode}. Due: ${new Date(deadline).toLocaleDateString()}`,
    link: `/student/courses/${courseId}/assignments/${assignmentId}`,
    metadata: {
      assignment_id: assignmentId,
      assignment_title: assignmentTitle,
      course_id: courseId,
      course_code: courseCode,
      course_title: courseTitle,
      deadline,
    },
  })
}

/**
 * Notify enrolled students when new test is available
 */
export async function notifyNewTest(
  studentIds: string[],
  testTitle: string,
  courseCode: string,
  courseTitle: string,
  endTime: string,
  testId: string,
  courseId: string
) {
  return createBulkNotifications(studentIds, {
    type: 'test_available',
    title: '🎯 New Test Available',
    message: `New test "${testTitle}" is available in ${courseCode}. Available until ${new Date(endTime).toLocaleString()}`,
    link: `/student/courses/${courseId}/tests/${testId}`,
    metadata: {
      test_id: testId,
      test_title: testTitle,
      course_id: courseId,
      course_code: courseCode,
      course_title: courseTitle,
      end_time: endTime,
    },
  })
}

/**
 * Notify lecturer when student submits assignment
 */
export async function notifySubmissionReceived(
  lecturerId: string,
  studentName: string,
  assignmentTitle: string,
  courseCode: string,
  assignmentId: string,
  submissionId: string
) {
  return createNotification({
    user_id: lecturerId,
    type: 'submission_received',
    title: '📥 New Submission Received',
    message: `${studentName} submitted "${assignmentTitle}" in ${courseCode}`,
    link: `/lecturer/assignments/${assignmentId}/submissions/${submissionId}`,
    metadata: {
      assignment_id: assignmentId,
      assignment_title: assignmentTitle,
      course_code: courseCode,
      student_name: studentName,
      submission_id: submissionId,
    },
  })
}

/**
 * Notify student when successfully enrolled in course
 */
export async function notifyEnrollmentConfirmed(
  studentId: string,
  courseCode: string,
  courseTitle: string,
  courseId: string
) {
  return createNotification({
    user_id: studentId,
    type: 'enrollment_confirmed',
    title: '✅ Enrollment Confirmed',
    message: `You have successfully enrolled in ${courseCode} - ${courseTitle}`,
    link: `/student/courses/${courseId}`,
    metadata: {
      course_id: courseId,
      course_code: courseCode,
      course_title: courseTitle,
    },
  })
}

/**
 * Notify student about upcoming deadline (24 hours before)
 */
export async function notifyDeadlineApproaching(
  studentId: string,
  assignmentTitle: string,
  courseCode: string,
  deadline: string,
  assignmentId: string,
  hoursRemaining: number
) {
  return createNotification({
    user_id: studentId,
    type: 'deadline_reminder',
    title: '⏰ Deadline Approaching',
    message: `"${assignmentTitle}" in ${courseCode} is due in ${hoursRemaining} hours`,
    link: `/student/assignments/${assignmentId}`,
    metadata: {
      assignment_id: assignmentId,
      assignment_title: assignmentTitle,
      course_code: courseCode,
      deadline,
      hours_remaining: hoursRemaining,
    },
  })
}

/**
 * Notify lecturer when student enrolls in their course
 */
export async function notifyStudentEnrolled(
  lecturerId: string,
  studentName: string,
  courseCode: string,
  courseTitle: string,
  courseId: string
) {
  return createNotification({
    user_id: lecturerId,
    type: 'enrollment_confirmed',
    title: '👨‍🎓 New Student Enrolled',
    message: `${studentName} enrolled in ${courseCode} - ${courseTitle}`,
    link: `/lecturer/courses/${courseId}/students`,
    metadata: {
      course_id: courseId,
      course_code: courseCode,
      course_title: courseTitle,
      student_name: studentName,
    },
  })
}

/**
 * Notify lecturer when student completes a test
 */
export async function notifyTestCompleted(
  lecturerId: string,
  studentName: string,
  testTitle: string,
  courseCode: string,
  testId: string,
  attemptId: string
) {
  return createNotification({
    user_id: lecturerId,
    type: 'submission_received',
    title: '✅ Test Completed',
    message: `${studentName} completed "${testTitle}" in ${courseCode}`,
    link: `/lecturer/tests/${testId}/attempts/${attemptId}`,
    metadata: {
      test_id: testId,
      test_title: testTitle,
      course_code: courseCode,
      student_name: studentName,
      attempt_id: attemptId,
    },
  })
}

/**
 * Send a course announcement to all enrolled students
 */
export async function notifyCourseAnnouncement(
  studentIds: string[],
  title: string,
  message: string,
  courseCode: string,
  courseId: string,
  metadata?: NotificationMetadata
) {
  return createBulkNotifications(studentIds, {
    type: 'course_announcement',
    title: `📢 ${courseCode}: ${title}`,
    message,
    link: `/student/courses/${courseId}`,
    metadata: {
      course_id: courseId,
      course_code: courseCode,
      ...metadata,
    },
  })
}