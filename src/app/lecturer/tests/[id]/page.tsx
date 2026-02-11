// app/lecturer/tests/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Users, Clock, Award, Calendar, Eye, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { getTestById, publishTest, unpublishTest, deleteTest } from '@/lib/actions/test.actions'
import { getTestQuestions } from '@/lib/actions/question.actions'
import { getTestStatistics } from '@/lib/actions/test.actions'
import CopyButton from '@/components/assignment/copy-button'
import type { TestWithDetails, QuestionWithOptions, TestStatistics } from '@/lib/types/test.types'
import { formatDistanceToNow } from 'date-fns'

export default function TestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string

  const [test, setTest] = useState<TestWithDetails | null>(null)
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [statistics, setStatistics] = useState<TestStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadTestData()
  }, [testId])

  const loadTestData = async () => {
    try {
      setLoading(true)
      
      const [testResult, questionsResult, statsResult] = await Promise.all([
        getTestById(testId),
        getTestQuestions(testId),
        getTestStatistics(testId)
      ])

      if (testResult.error) {
        setError(testResult.error)
        return
      }

      if (testResult.test) {
        setTest(testResult.test)
      }

      if (questionsResult.questions) {
        setQuestions(questionsResult.questions)
      }

      if (statsResult.statistics) {
        setStatistics(statsResult.statistics)
      }
    } catch (err) {
      console.error('Error loading test:', err)
      setError('Failed to load test')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (questions.length === 0) {
      alert('Cannot publish test without questions')
      return
    }

    try {
      setActionLoading(true)
      const result = await publishTest(testId)
      
      if (result.error) {
        alert(result.error)
        return
      }

      await loadTestData()
      alert('Test published successfully!')
    } catch (err) {
      console.error('Error publishing test:', err)
      alert('Failed to publish test')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this test?')) {
      return
    }

    try {
      setActionLoading(true)
      const result = await unpublishTest(testId)
      
      if (result.error) {
        alert(result.error)
        return
      }

      await loadTestData()
      alert('Test unpublished successfully!')
    } catch (err) {
      console.error('Error unpublishing test:', err)
      alert('Failed to unpublish test')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(true)
      const result = await deleteTest(testId)
      
      if (result.error) {
        alert(result.error)
        return
      }

      router.push('/lecturer/tests/standalone')
    } catch (err) {
      console.error('Error deleting test:', err)
      alert('Failed to delete test')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test...</p>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Test not found</p>
        </div>
      </div>
    )
  }

  const shareableLink = test.access_code ? `${window.location.origin}/tests/${test.access_code}` : ''
  const isExpired = new Date(test.end_time) < new Date()
  const hasStarted = new Date(test.start_time) <= new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/lecturer/tests/standalone">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tests
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Test Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{test.title}</h1>
              {test.description && (
                <p className="text-gray-600">{test.description}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant={test.is_published ? 'default' : 'secondary'} className="text-sm">
                {test.is_published ? 'Published' : 'Draft'}
              </Badge>
              {test.is_standalone && (
                <Badge className="bg-purple-100 text-purple-700">Standalone</Badge>
              )}
              {isExpired && (
                <Badge variant="destructive">Expired</Badge>
              )}
            </div>
          </div>

          {/* Display Course Info if available */}
          {(test.display_course_code || test.display_course_title) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {test.display_course_code && (
                <Badge variant="outline">{test.display_course_code}</Badge>
              )}
              {test.display_course_title && <span>{test.display_course_title}</span>}
            </div>
          )}
        </div>

        {/* Access Code (for standalone) */}
        {test.is_standalone && test.access_code && (
          <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-lg">Test Access Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white p-3 rounded-lg border-2 border-purple-300">
                  <p className="text-2xl font-bold text-purple-700 text-center tracking-wider">
                    {test.access_code}
                  </p>
                </div>
                <CopyButton text={test.access_code} label="Copy Code" />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white p-2 rounded-lg border border-gray-300">
                  <p className="text-sm text-gray-700 truncate">{shareableLink}</p>
                </div>
                <CopyButton text={shareableLink} label="Copy Link" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{statistics?.total_attempts || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {statistics?.completed_attempts || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {statistics?.average_score ? statistics.average_score.toFixed(1) : '0.0'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{questions.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Details */}
            <Card>
              <CardHeader>
                <CardTitle>Test Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Test Type</p>
                    <p className="font-medium capitalize">{test.test_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{test.duration_minutes} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Marks</p>
                    <p className="font-medium">{test.total_marks}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pass Mark</p>
                    <p className="font-medium">{test.pass_mark}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Max Attempts</p>
                    <p className="font-medium">{test.max_attempts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Access Cost</p>
                    <p className="font-medium">₦{test.access_cost}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Time</p>
                  <p className="font-medium">
                    {new Date(test.start_time).toLocaleString()}
                    {!hasStarted && (
                      <Badge variant="outline" className="ml-2">
                        Starts {formatDistanceToNow(new Date(test.start_time), { addSuffix: true })}
                      </Badge>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">End Time</p>
                  <p className="font-medium">
                    {new Date(test.end_time).toLocaleString()}
                    {isExpired ? (
                      <Badge variant="destructive" className="ml-2">Expired</Badge>
                    ) : (
                      <Badge variant="outline" className="ml-2">
                        Ends {formatDistanceToNow(new Date(test.end_time), { addSuffix: true })}
                      </Badge>
                    )}
                  </p>
                </div>

                {test.instructions && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Instructions</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{test.instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Test Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shuffle Questions</span>
                  <Badge variant={test.shuffle_questions ? 'default' : 'secondary'}>
                    {test.shuffle_questions ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Shuffle Options</span>
                  <Badge variant={test.shuffle_options ? 'default' : 'secondary'}>
                    {test.shuffle_options ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Results Immediately</span>
                  <Badge variant={test.show_results_immediately ? 'default' : 'secondary'}>
                    {test.show_results_immediately ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow Review</span>
                  <Badge variant={test.allow_review ? 'default' : 'secondary'}>
                    {test.allow_review ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/lecturer/tests/${testId}/questions/add`} className="block">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {questions.length === 0 ? 'Add Questions' : 'Manage Questions'}
                  </Button>
                </Link>

                <Link href={`/lecturer/tests/${testId}/attempts`} className="block">
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    View Attempts ({statistics?.total_attempts || 0})
                  </Button>
                </Link>

                {test.is_published ? (
                  <Button
                    onClick={handleUnpublish}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Unpublish Test
                  </Button>
                ) : (
                  <Button
                    onClick={handlePublish}
                    disabled={actionLoading || questions.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish Test
                  </Button>
                )}

                <Button
                  onClick={handleDelete}
                  disabled={actionLoading || (statistics?.total_attempts || 0) > 0}
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Test
                </Button>
              </CardContent>
            </Card>

            {/* Creator Info */}
            {test.creator && (
              <Card>
                <CardHeader>
                  <CardTitle>Created By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold">
                        {test.creator.first_name[0]}{test.creator.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {test.creator.title && `${test.creator.title}. `}
                        {test.creator.first_name} {test.creator.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}