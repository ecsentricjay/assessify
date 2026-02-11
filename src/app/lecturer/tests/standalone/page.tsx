// app/lecturer/tests/standalone/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Users, Clock, Calendar, Eye, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { getLecturerStandaloneTests } from '@/lib/actions/test.actions'
import CopyButton from '@/components/assignment/copy-button'
import { formatDistanceToNow } from 'date-fns'
import type { TestWithDetails } from '@/lib/types/test.types'

export default function StandaloneTestsPage() {
  const [tests, setTests] = useState<TestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      setLoading(true)
      const result = await getLecturerStandaloneTests()

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.tests) {
        setTests(result.tests as TestWithDetails[])
      }
    } catch (err) {
      console.error('Error loading tests:', err)
      setError('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (test: TestWithDetails) => {
    const now = new Date()
    const startTime = new Date(test.start_time)
    const endTime = new Date(test.end_time)

    if (!test.is_published) {
      return <Badge variant="secondary">Draft</Badge>
    }

    if (now < startTime) {
      return <Badge variant="outline" className="border-blue-500 text-blue-700">Upcoming</Badge>
    }

    if (now > endTime) {
      return <Badge variant="destructive">Expired</Badge>
    }

    return <Badge variant="default" className="bg-green-600">Active</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/lecturer/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Standalone Tests</h1>
                <p className="text-sm text-gray-600">Quick tests without course setup</p>
              </div>
            </div>
            <Link href="/lecturer/tests/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Test
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tests.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {tests.filter(t => t.is_published).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-600">
                {tests.filter(t => !t.is_published).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {tests.reduce((sum, t) => sum + (t.attempts_count || 0), 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <Plus className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No standalone tests yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first standalone test to get started
                </p>
                <Link href="/lecturer/tests/create">
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Test
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => {
              const shareableLink = `${window.location.origin}/tests/${test.access_code}`
              const isExpired = new Date(test.end_time) < new Date()
              
              return (
                <Card key={test.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(test)}
                          <Badge variant="outline" className="capitalize">
                            {test.test_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 truncate">
                          {test.title}
                        </h3>
                        {test.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {test.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Access Code */}
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-900">Access Code</span>
                        <CopyButton text={test.access_code || ''} label="Copy" />
                      </div>
                      <p className="text-lg font-bold text-purple-700 tracking-wider">
                        {test.access_code}
                      </p>
                    </div>

                    {/* Shareable Link */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-gray-50 rounded border text-xs text-gray-700 truncate">
                        {shareableLink}
                      </div>
                      <CopyButton text={shareableLink} label="Copy Link" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Questions</p>
                        <p className="text-lg font-bold text-gray-900">{test.questions_count || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Attempts</p>
                        <p className="text-lg font-bold text-blue-600">{test.attempts_count || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="text-lg font-bold text-gray-900">{test.duration_minutes}m</p>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Starts: {new Date(test.start_time).toLocaleDateString()} at{' '}
                          {new Date(test.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          Ends: {new Date(test.end_time).toLocaleDateString()} at{' '}
                          {new Date(test.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-500">
                        Created {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {test.shuffle_questions && (
                        <Badge variant="outline" className="text-xs">Shuffle Q&apos;s</Badge>
                      )}
                      {test.show_results_immediately && (
                        <Badge variant="outline" className="text-xs">Instant Results</Badge>
                      )}
                      {test.access_cost > 0 && (
                        <Badge variant="outline" className="text-xs">₦{test.access_cost}</Badge>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/lecturer/tests/${test.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/lecturer/tests/${test.id}/attempts`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Users className="h-4 w-4 mr-2" />
                          Attempts
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}