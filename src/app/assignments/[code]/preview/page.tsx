// Create this file: src/app/assignments/[code]/preview/page.tsx

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { getStandaloneAssignmentByCode } from '@/lib/actions/standalone-assignment.actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function AssignmentPreviewPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const user = await getCurrentUser()

  if (!user || user.profile?.role !== 'lecturer') {
    redirect('/auth/login')
  }

  const result = await getStandaloneAssignmentByCode(code)

  if (result.error || !result.assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Assignment Not Found</h2>
            <p className="text-gray-600 mb-4">{result.error}</p>
            <Link href="/lecturer/assignments/standalone">
              <Button>Back to Assignments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const assignment = result.assignment
  const deadline = new Date(assignment.deadline)
  const now = new Date()
  const isOverdue = now > deadline

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-orange-100 text-orange-800 mb-2">
                👁️ PREVIEW MODE - LECTURER VIEW
              </Badge>
              <h1 className="text-2xl font-bold">Assignment Preview</h1>
              <p className="text-sm text-gray-600">This is how students will see this assignment</p>
            </div>
            <Link href="/lecturer/assignments/standalone">
              <Button variant="outline" size="sm">← Back to Assignments</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Preview Notice */}
        <Card className="mb-6 bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">👁️</div>
              <div>
                <h3 className="font-bold text-orange-900">Preview Mode</h3>
                <p className="text-orange-800 text-sm">
                  You&apos;re viewing this assignment as a lecturer. Students will see this same view but with the submission form enabled.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Header */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {assignment.display_course_code}
                  </Badge>
                  <Badge className={isOverdue ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {isOverdue ? 'Overdue' : 'Open'}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {assignment.title}
                </h2>
                <p className="text-gray-700">{assignment.display_course_title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Access Code</p>
                <p className="text-2xl font-bold font-mono text-blue-600">
                  {assignment.access_code}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Assignment Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Description</h4>
                  <p className="text-gray-800">{assignment.description}</p>
                </div>

                {assignment.instructions && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Instructions</h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{assignment.instructions}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Maximum Score</h4>
                    <p className="text-gray-800">{assignment.max_score} points</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Deadline</h4>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                      {deadline.toLocaleDateString()} {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isOverdue ? 'Overdue' : formatDistanceToNow(deadline, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Form Preview */}
            <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Submission Form</span>
                  <Badge variant="outline" className="bg-white">Preview Only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 opacity-60">
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <p className="text-sm text-center text-gray-700">
                      📝 Students will see the submission form here with:
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-gray-600">
                      <li>• Auto-filled student information</li>
                      <li>• Text submission area</li>
                      <li>• File upload section</li>
                      <li>• Submit button</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Lecturer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Lecturer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {assignment.profiles?.first_name?.charAt(0)}
                    {assignment.profiles?.last_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {assignment.profiles?.title && `${assignment.profiles.title}. `}
                      {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>File Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Allowed Types:</span>
                  <p className="text-gray-600">{assignment.allowed_file_types.map((t: string) => t.toUpperCase()).join(', ')}</p>
                </div>
                <div>
                  <span className="font-semibold">Max File Size:</span>
                  <p className="text-gray-600">{assignment.max_file_size_mb} MB per file</p>
                </div>
                {assignment.submission_cost > 0 && (
                  <div>
                    <span className="font-semibold">Submission Cost:</span>
                    <p className="text-green-600 font-bold">₦{assignment.submission_cost}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={assignment.plagiarism_check_enabled ? "text-green-600" : "text-gray-400"}>
                    {assignment.plagiarism_check_enabled ? "✅" : "❌"}
                  </span>
                  <span>Plagiarism Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={assignment.ai_grading_enabled ? "text-green-600" : "text-gray-400"}>
                    {assignment.ai_grading_enabled ? "✅" : "❌"}
                  </span>
                  <span>AI-Assisted Grading</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle>Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600 text-center">
                  {assignment.submissionCount || 0}
                </p>
                <p className="text-sm text-center text-gray-600 mt-1">
                  students have submitted
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/lecturer/assignments/standalone/${assignment.id}`}>
                  <Button className="w-full" variant="default">
                    View Submissions
                  </Button>
                </Link>
                <Link href="/lecturer/assignments/standalone">
                  <Button className="w-full" variant="outline">
                    Back to Assignments
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}