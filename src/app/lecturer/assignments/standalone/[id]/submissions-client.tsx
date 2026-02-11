'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import BulkAIGrading from '@/components/grading/bulk-ai-grading'
import ExportButton from './export-button'
import CopyCodeButton from '@/components/copy-code-button'
import DeleteAssignmentButton from '@/components/delete-assignment-button'
import { aiGradeAllStandaloneSubmissions } from '@/lib/actions/ai-grading.actions'

interface Submission {
  id: string
  student_name: string
  student_email: string
  submitted_at: string
  status: string
  final_score: number | null
  is_late: boolean
  late_days: number
  profiles?: {
    level: number
    department: string
    matric_number: string
  }
}

interface Assignment {
  id: string
  title: string
  display_course_code: string
  display_course_title: string
  access_code: string
  max_score: number
}

interface Props {
  assignmentId: string
  assignment: Assignment
  initialSubmissions: Submission[]
}

export default function StandaloneSubmissionsClient({
  assignmentId,
  assignment,
  initialSubmissions,
}: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [, setIsReloading] = useState(false)

  const totalSubmissions = submissions.length
  const gradedCount = submissions.filter(s => s.status === 'graded').length
  const pendingCount = totalSubmissions - gradedCount

  const reloadSubmissions = async () => {
    setIsReloading(true)
    try {
      // Reload submissions from the server
      const { getStandaloneAssignmentSubmissions } = await import('@/lib/actions/standalone-assignment.actions')
      const { submissions: newSubmissions } = await getStandaloneAssignmentSubmissions(assignmentId)
      if (newSubmissions) {
        setSubmissions(newSubmissions)
      }
    } catch (error) {
      console.error('Error reloading submissions:', error)
    } finally {
      setIsReloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                <Badge className="bg-purple-100 text-purple-800">Standalone</Badge>
              </div>
              <p className="text-sm text-gray-600">
                {assignment.display_course_code} • {assignment.display_course_title}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/lecturer/assignments/standalone">
                <Button variant="outline">← Back</Button>
              </Link>
              <DeleteAssignmentButton 
                assignmentId={assignmentId}
                assignmentTitle={assignment.title}
                submissionCount={totalSubmissions}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning if has submissions */}
        {totalSubmissions > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ℹ️ This assignment has <strong>{totalSubmissions}</strong> submission(s) and cannot be deleted until all submissions are removed.
            </p>
          </div>
        )}

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
                Access Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono text-blue-600">
                {assignment.access_code}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        {totalSubmissions === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-4">🔭</div>
              <h3 className="text-2xl font-semibold mb-2">No submissions yet</h3>
              <p className="text-gray-600 mb-4">
                Share the access code with students to start receiving submissions
              </p>
              <div className="max-w-md mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Access Code:</p>
                  <p className="text-3xl font-bold font-mono text-blue-600 mb-3">
                    {assignment.access_code}
                  </p>
                  <CopyCodeButton code={assignment.access_code} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Submissions ({totalSubmissions})</CardTitle>
                <div className="flex gap-2">
                  {pendingCount > 0 && (
                    <BulkAIGrading
                      onGradeAll={async (rubric) => {
                        const result = await aiGradeAllStandaloneSubmissions(assignmentId, rubric)
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
                  <ExportButton assignmentId={assignmentId} />
                </div>
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
                        Email
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
                    {submissions.map((submission: any) => (
                      <tr key={submission.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium">{submission.student_name}</p>
                          {submission.profiles && (
                            <p className="text-xs text-gray-500">
                              {submission.profiles.level} Level • {submission.profiles.department}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono text-sm">
                            {submission.profiles?.matric_number || 'N/A'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600">{submission.student_email}</p>
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
                          <Link href={`/lecturer/grading/standalone/${submission.id}`}>
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
