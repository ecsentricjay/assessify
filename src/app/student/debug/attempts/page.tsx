// app/student/debug/attempts/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import { RefreshCw, AlertCircle } from 'lucide-react'

export default function DebugAttemptsPage() {
  const [user, setUser] = useState<any>(null)
  const [attempts, setAttempts] = useState<any[]>([])
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDebugData()
  }, [])

  const loadDebugData = async () => {
    try {
      setLoading(true)
      setError('')

      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (!currentUser) {
        setError('Not logged in')
        return
      }

      const supabase = await (await import('@/lib/supabase/client')).createClient()

      // Get all attempts for this user
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('test_attempts')
        .select(`
          *,
          test:tests(*)
        `)
        .eq('student_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (attemptsError) {
        console.error('Attempts error:', attemptsError)
        setError(`Attempts error: ${attemptsError.message}`)
      } else {
        setAttempts(attemptsData || [])
      }

      // Get all published tests
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (testsError) {
        console.error('Tests error:', testsError)
      } else {
        setTests(testsData || [])
      }
    } catch (err: unknown) {
      console.error('Debug error:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Debug: Test Attempts</h1>
          <Button onClick={loadDebugData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div><strong>ID:</strong> {user?.id || 'N/A'}</div>
              <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
              <div><strong>Role:</strong> {user?.profile?.role || 'N/A'}</div>
              <div><strong>Name:</strong> {user?.profile?.first_name} {user?.profile?.last_name}</div>
            </div>
          </CardContent>
        </Card>

        {/* Attempts List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Test Attempts ({attempts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-gray-500">No attempts found</p>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="p-4 border rounded-lg bg-white">
                    <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                      <div>
                        <strong>Attempt ID:</strong>
                        <p className="text-xs text-gray-600 break-all">{attempt.id}</p>
                      </div>
                      <div>
                        <strong>Test ID:</strong>
                        <p className="text-xs text-gray-600 break-all">{attempt.test_id}</p>
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <Badge className="ml-2">{attempt.status}</Badge>
                      </div>
                      <div>
                        <strong>Attempt #:</strong> {attempt.attempt_number}
                      </div>
                      <div>
                        <strong>Started:</strong>
                        <p className="text-xs">{new Date(attempt.started_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <strong>Submitted:</strong>
                        <p className="text-xs">{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not yet'}</p>
                      </div>
                      {attempt.test && (
                        <>
                          <div className="col-span-2">
                            <strong>Test Title:</strong> {attempt.test.title}
                          </div>
                          <div>
                            <strong>Test Published:</strong> {attempt.test.is_published ? 'Yes' : 'No'}
                          </div>
                          <div>
                            <strong>Test Access Code:</strong> {attempt.test.access_code || 'N/A'}
                          </div>
                          <div>
                            <strong>Is Standalone:</strong> {attempt.test.is_standalone ? 'Yes' : 'No'}
                          </div>
                          <div>
                            <strong>Course ID:</strong> {attempt.test.course_id || 'N/A'}
                          </div>
                        </>
                      )}
                      <div className="col-span-2">
                        <strong>Resume URL:</strong>
                        <p className="text-xs text-blue-600 break-all">
                          {attempt.test?.access_code 
                            ? `/tests/${attempt.test.access_code}/take/${attempt.id}`
                            : 'No access code available'}
                        </p>
                        {attempt.test?.access_code && attempt.status === 'in_progress' && (
                          <a 
                            href={`/tests/${attempt.test.access_code}/take/${attempt.id}`}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            → Try to resume this test
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Published Tests ({tests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tests.length === 0 ? (
              <p className="text-gray-500">No published tests found</p>
            ) : (
              <div className="space-y-4">
                {tests.map((test) => (
                  <div key={test.id} className="p-4 border rounded-lg bg-white">
                    <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                      <div className="col-span-2">
                        <strong>Test ID:</strong>
                        <p className="text-xs text-gray-600 break-all">{test.id}</p>
                      </div>
                      <div className="col-span-2">
                        <strong>Title:</strong> {test.title}
                      </div>
                      <div>
                        <strong>Type:</strong> {test.test_type}
                      </div>
                      <div>
                        <strong>Published:</strong> {test.is_published ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <strong>Access Code:</strong> {test.access_code || 'N/A'}
                      </div>
                      <div>
                        <strong>Is Standalone:</strong> {test.is_standalone ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <strong>Course ID:</strong> {test.course_id || 'N/A'}
                      </div>
                      <div>
                        <strong>Created By:</strong>
                        <p className="text-xs text-gray-600 break-all">{test.created_by}</p>
                      </div>
                      {test.access_code && (
                        <div className="col-span-2">
                          <strong>Access URL:</strong>
                          <a 
                            href={`/tests/${test.access_code}`}
                            className="text-blue-600 hover:underline text-xs block"
                          >
                            /tests/{test.access_code}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>Common Issues:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>If &quot;Attempt not found&quot; error: Check if the test has an access_code</li>
              <li>If test is not loading: Verify the test is published (is_published = true)</li>
              <li>If can&apos;t resume: Make sure status is &quot;in_progress&quot;</li>
              <li>If URL is wrong: Test might not be standalone or missing access_code</li>
            </ol>
            <p className="mt-4"><strong>What to check:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Does your attempt have a valid test_id?</li>
              <li>Does that test exist and is it published?</li>
              <li>Does the test have an access_code?</li>
              <li>Are you the correct student (student_id matches)?</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}