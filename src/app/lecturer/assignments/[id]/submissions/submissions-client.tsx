'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import BulkAIGrading from '@/components/grading/bulk-ai-grading'
import { aiGradeAllAssignmentSubmissions } from '@/lib/actions/ai-grading.actions'

interface Submission {
  id: string
  submitted_at: string
  status: string
  final_score: number | null
  is_late: boolean
  late_days: number
  profiles?: {
    first_name: string
    last_name: string
    matric_number: string
  }
}

interface Assignment {
  id: string
  title: string
  max_score: number
}

interface Props {
  assignmentId: string
  assignment: Assignment
  initialSubmissions: Submission[]
}

export default function AssignmentSubmissionsClient({
  assignmentId,
  assignment,
  initialSubmissions,
}: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  // REMOVED: unused isReloading state (line 44)

  const totalSubmissions = submissions.length
  const gradedCount = submissions.filter(s => s.status === 'graded').length
  const pendingCount = totalSubmissions - gradedCount
  const averageScore = gradedCount > 0
    ? submissions
        .filter(s => s.final_score !== null)
        .reduce((sum, s) => sum + (s.final_score || 0), 0) / gradedCount
    : 0

  const reloadSubmissions = async () => {
    // REMOVED: setIsReloading(true) since state was removed
    try {
      const { getAssignmentSubmissions } = await import('@/lib/actions/grading.actions')
      const { submissions: newSubmissions } = await getAssignmentSubmissions(assignmentId)
      if (newSubmissions) {
        setSubmissions(newSubmissions)
      }
    } catch (error) {
      console.error('Error reloading submissions:', error)
    }
    // REMOVED: finally block with setIsReloading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Submissions</h1>
              <p className="text-sm text-gray-600">{assignment.title}</p>
            </div>
            <Link href={`/lecturer/assignments/${assignmentId}`}>
              <Button variant="outline">← Back to Assignment</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalSubmissions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Graded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{gradedCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {gradedCount > 0 ? averageScore.toFixed(1) : '-'}
                {gradedCount > 0 && <span className="text-lg text-gray-500">/{assignment.max_score}</span>}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        {totalSubmissions === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-4">📭</div>
              <h3 className="text-2xl font-semibold mb-2">No submissions yet</h3>
              <p className="text-gray-600">
                Student submissions will appear here once they submit
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Submissions ({totalSubmissions})</CardTitle>
                {pendingCount > 0 && (
                  <BulkAIGrading
                    onGradeAll={async (rubric) => {
                      const result = await aiGradeAllAssignmentSubmissions(assignmentId, rubric)
                      if (result.success) {
                        await reloadSubmissions()
                      }
                      return result
                    }}
                    itemCount={pendingCount}
                    itemType="submissions"
                    label="Grade Pending with AI"
                    variant="outline"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                        Student
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                        Matric Number
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                        Submitted
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                        Score
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* FIXED: Changed 'any' to 'Submission' type (line 197) */}
                    {submissions?.map((submission: Submission) => (
                      <tr key={submission.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                              {submission.profiles?.first_name?.charAt(0)}
                              {submission.profiles?.last_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {submission.profiles?.first_name} {submission.profiles?.last_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">
                            {submission.profiles?.matric_number}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="text-gray-900">
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <Badge
                              className={
                                submission.status === 'graded'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {submission.status === 'graded' ? 'Graded' : 'Pending'}
                            </Badge>
                            {submission.is_late && (
                              <Badge className="bg-red-100 text-red-800 ml-2">
                                Late ({submission.late_days}d)
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {submission.final_score !== null ? (
                            <span className="font-bold text-green-600">
                              {submission.final_score.toFixed(1)}/{assignment.max_score}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not graded</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/lecturer/assignments/${assignmentId}/submissions/${submission.id}`}>
                            <Button size="sm" variant={submission.status === 'graded' ? 'outline' : 'default'}>
                              {submission.status === 'graded' ? 'View' : 'Grade'}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}