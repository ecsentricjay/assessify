// Save as: src/app/lecturer/assignments/[id]/assignment-actions.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { publishAssignment, unpublishAssignment, deleteAssignment, duplicateAssignment } from '@/lib/actions/assignment.actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AssignmentActions({
  assignmentId,
  isPublished,
  courseId,
}: {
  assignmentId: string
  isPublished: boolean
  courseId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handlePublish() {
    if (!confirm('Are you sure you want to publish this assignment? Students will be able to see it.')) {
      return
    }

    setLoading(true)
    const result = await publishAssignment(assignmentId)

    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  async function handleUnpublish() {
    if (!confirm('Are you sure you want to unpublish this assignment? Students will no longer see it.')) {
      return
    }

    setLoading(true)
    const result = await unpublishAssignment(assignmentId)

    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDuplicate() {
    if (!confirm('Create a copy of this assignment? It will be created as a draft.')) {
      return
    }

    setLoading(true)
    const result = await duplicateAssignment(assignmentId)

    if (result.error) {
      alert(result.error)
      setLoading(false)
    } else {
      alert('Assignment duplicated successfully!')
      router.push(`/lecturer/assignments/${result.assignment.id}`)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    const result = await deleteAssignment(assignmentId)

    if (result.error) {
      alert(result.error)
      setLoading(false)
    } else {
      router.push(`/lecturer/courses/${courseId}`)
    }
  }

  return (
    <>
      {/* Edit Button */}
      <Link href={`/lecturer/assignments/${assignmentId}/edit`}>
        <Button className="w-full justify-start" variant="outline">
          <span className="mr-2">✏️</span>
          Edit Assignment
        </Button>
      </Link>

      {/* Duplicate Button */}
      <Button
        onClick={handleDuplicate}
        disabled={loading}
        className="w-full justify-start"
        variant="outline"
      >
        <span className="mr-2">📋</span>
        {loading ? 'Duplicating...' : 'Duplicate Assignment'}
      </Button>

      {/* Publish/Unpublish */}
      {isPublished ? (
        <Button
          onClick={handleUnpublish}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? 'Unpublishing...' : 'Unpublish Assignment'}
        </Button>
      ) : (
        <Button
          onClick={handlePublish}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Publishing...' : 'Publish Assignment'}
        </Button>
      )}

      {/* Delete Button */}
      <Button
        onClick={handleDelete}
        disabled={loading}
        className="w-full"
        variant="destructive"
      >
        {loading ? 'Deleting...' : 'Delete Assignment'}
      </Button>
    </>
  )
}