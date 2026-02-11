'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteCourse } from '@/lib/actions/course.actions'

interface DeleteCourseButtonProps {
  courseId: string
  courseTitle: string
  courseCode: string
}

export default function DeleteCourseButton({ 
  courseId, 
  courseTitle,
  courseCode
}: DeleteCourseButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [enrollmentCount, setEnrollmentCount] = useState(0)
  const [assignmentCount, setAssignmentCount] = useState(0)

  const handleInitialDelete = async () => {
    setLoading(true)
    setError(null)

    // First attempt - check for enrollments and assignments
    const result = await deleteCourse(courseId, false)

    if (result.error === 'HAS_DATA') {
      // Has data, show second confirmation
      setEnrollmentCount(result.enrollmentCount || 0)
      setAssignmentCount(result.assignmentCount || 0)
      setOpen(false)
      setConfirmOpen(true)
      setLoading(false)
    } else if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Success - no data
      setOpen(false)
      router.push('/lecturer/courses')
      router.refresh()
    }
  }

  const handleForceDelete = async () => {
    setLoading(true)
    setError(null)

    // Force delete with all data
    const result = await deleteCourse(courseId, true)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setConfirmOpen(false)
      router.push('/lecturer/courses')
      router.refresh()
    }
  }

  const totalItems = enrollmentCount + assignmentCount

  return (
    <>
      {/* First Dialog - Initial Delete Confirmation */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            🗑️ Delete Course
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course?</AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              Are you sure you want to delete <strong>{courseCode} - {courseTitle}</strong>?
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
              <div className="text-yellow-800 text-sm">
                ⚠️ This will check for enrolled students and assignments.
              </div>
              <div className="text-yellow-700 text-xs mt-2">
                If the course has data, you&apos;ll be asked to confirm deletion in the next step.
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleInitialDelete()
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Checking...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Dialog - Force Delete Confirmation (Only if has data) */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Delete Course with All Data?
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <div className="text-red-900 font-semibold mb-2">
                This will permanently delete:
              </div>
              <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                <li>The course <strong>{courseCode} - {courseTitle}</strong></li>
                {enrollmentCount > 0 && (
                  <li><strong>{enrollmentCount}</strong> student enrollment(s)</li>
                )}
                {assignmentCount > 0 && (
                  <li><strong>{assignmentCount}</strong> assignment(s) and all their submissions</li>
                )}
                <li>All grades, feedback, and uploaded files</li>
                <li>All attendance records</li>
                <li>Course enrollment code and settings</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
              <div className="text-yellow-900 text-sm font-semibold mb-1">
                ⚠️ Critical Warnings:
              </div>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 text-xs">
                <li>Students will lose access to all course materials and grades</li>
                <li>All assignment submissions will be permanently deleted</li>
                <li>This action cannot be undone or recovered</li>
                <li>Consider archiving instead of deleting if you may need the data later</li>
                {assignmentCount > 0 && (
                  <li>Export assignment data before deletion if needed</li>
                )}
              </ul>
            </div>

            <div className="text-gray-700 font-semibold text-center pt-2">
              Are you absolutely certain you want to delete this course and all its data?
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Cancel - Keep Course
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleForceDelete()
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : `Yes, Delete Everything (${totalItems} items)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}