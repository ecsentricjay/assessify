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
import { deleteStandaloneAssignment } from '@/lib/actions/standalone-assignment.actions'

interface DeleteAssignmentButtonProps {
  assignmentId: string
  assignmentTitle: string
  submissionCount: number
}

export default function DeleteAssignmentButton({ 
  assignmentId, 
  assignmentTitle,
  submissionCount 
}: DeleteAssignmentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleInitialDelete = async () => {
    setLoading(true)
    setError(null)

    // First attempt - check for submissions
    const result = await deleteStandaloneAssignment(assignmentId, false)

    if (result.error === 'HAS_SUBMISSIONS') {
      // Has submissions, show second confirmation
      setOpen(false)
      setConfirmOpen(true)
      setLoading(false)
    } else if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Success - no submissions
      setOpen(false)
      router.push('/lecturer/assignments/standalone')
      router.refresh()
    }
  }

  const handleForceDelete = async () => {
    setLoading(true)
    setError(null)

    // Force delete with submissions
    const result = await deleteStandaloneAssignment(assignmentId, true)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setConfirmOpen(false)
      router.push('/lecturer/assignments/standalone')
      router.refresh()
    }
  }

  return (
    <>
      {/* First Dialog - Initial Delete Confirmation */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            🗑️ Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>
              Are you sure you want to delete <strong>{assignmentTitle}</strong>?
            </div>
            {submissionCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-3">
                <div className="text-orange-800 text-sm">
                  ⚠️ This assignment has <strong>{submissionCount}</strong> submission(s).
                </div>
                <div className="text-orange-700 text-xs mt-2">
                  You&apos;ll be asked to confirm deletion of student work in the next step.
                </div>
              </div>
            )}
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
              {loading ? 'Processing...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second Dialog - Force Delete Confirmation (Only if has submissions) */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <span className="text-2xl">⚠️</span> Delete {submissionCount} Student Submission(s)?
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <div className="text-red-900 font-semibold mb-2">
                This will permanently delete:
              </div>
              <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                <li><strong>{submissionCount}</strong> student submission(s)</li>
                <li>All uploaded files and documents</li>
                <li>All grades and feedback</li>
                <li>The assignment &quot;{assignmentTitle}&quot;</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
              <div className="text-yellow-900 text-sm font-semibold mb-1">
                ⚠️ Important Considerations:
              </div>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 text-xs">
                <li>Students will lose access to their submitted work</li>
                <li>Grades will be permanently removed</li>
                <li>This action cannot be undone</li>
                <li>Consider downloading submissions first (Export button)</li>
              </ul>
            </div>

            <div className="text-gray-700 font-semibold text-center pt-2">
              Are you absolutely sure you want to proceed?
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              Cancel - Keep Assignment
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleForceDelete()
              }}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : `Yes, Delete Everything (${submissionCount} submissions)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}