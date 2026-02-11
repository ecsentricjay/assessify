// Save as: src/app/lecturer/assignments/[id]/submissions/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getAssignmentSubmissions } from '@/lib/actions/grading.actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import AssignmentSubmissionsClient from './submissions-client'

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  const { submissions, assignment, error } = await getAssignmentSubmissions(id)

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Assignment not found'}</p>
            <Link href="/lecturer/assignments">
              <Button>Back to Assignments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AssignmentSubmissionsClient 
      assignmentId={id}
      assignment={assignment}
      initialSubmissions={submissions || []}
    />
  )
}

