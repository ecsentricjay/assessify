// app/lecturer/tests/[id]/attempts/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Download, Eye, Search, CheckCircle, Clock, Award } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import BulkAIGrading from '@/components/grading/bulk-ai-grading'
import { exportTestResults } from '@/lib/actions/test-export.actions'
import { aiGradeAllTestAttempts } from '@/lib/actions/ai-grading.actions'
import { formatDistanceToNow } from 'date-fns'

interface Student {
  id: string
  first_name: string
  last_name: string
  matric_number: string
  level: number
  department: string
}

interface Test {
  id: string
  title: string
  total_marks: number
  pass_mark: number
}

interface AttemptWithStudent {
  id: string
  test_id: string
  student_id: string
  attempt_number: number
  started_at: string
  submitted_at: string | null
  time_taken_minutes: number | null
  total_score: number | null
  percentage: number | null
  passed: boolean
  status: string
  student: Student
  test: Test
}

export default function TestAttemptsPage() {
  const params = useParams()
  const testId = params.id as string

  const [test, setTest] = useState<Test | null>(null)
  const [attempts, setAttempts] = useState<AttemptWithStudent[]>([])
  const [filteredAttempts, setFilteredAttempts] = useState<AttemptWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [testId])

  useEffect(() => {
    // Filter attempts based on search
    if (!searchQuery.trim()) {
      setFilteredAttempts(attempts)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = attempts.filter(attempt => {
      const studentName = `${attempt.student?.first_name} ${attempt.student?.last_name}`.toLowerCase()
      const matricNumber = attempt.student?.matric_number?.toLowerCase() || ''
      
      return studentName.includes(query) || matricNumber.includes(query)
    })
    
    setFilteredAttempts(filtered)
  }, [searchQuery, attempts])

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Get test details
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('id, title, total_marks, pass_mark')
        .eq('id', testId)
        .single()

      if (testError) throw testError
      setTest(testData)

      // Get attempts with student profiles (without email since it's not in profiles table)
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('test_attempts')
        .select(`
          *,
          student:profiles(
            id,
            first_name,
            last_name,
            matric_number,
            level,
            department
          ),
          test:tests(id, title, total_marks, pass_mark)
        `)
        .eq('test_id', testId)
        .order('submitted_at', { ascending: false, nullsFirst: false })

      if (attemptsError) throw attemptsError

      setAttempts(attemptsData as AttemptWithStudent[])
      setFilteredAttempts(attemptsData as AttemptWithStudent[])
    } catch (err) {
      console.error('Error loading attempts:', err)
      setError('Failed to load attempts')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      
      const result = await exportTestResults(testId, 'csv')

      if (result.error) {
        alert(result.error)
        return
      }

      if (result.data && result.filename) {
        const blob = new Blob([result.data], { type: result.contentType })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting results:', err)
      alert('Failed to export results')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attempts...</p>
        </div>
      </div>
    )
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600">{error || 'Test not found'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedAttempts = attempts.filter(a => a.status === 'completed')
  const inProgressAttempts = attempts.filter(a => a.status === 'in_progress')
  const avgScore = completedAttempts.length > 0
    ? completedAttempts.reduce((sum, a) => sum + (a.total_score || 0), 0) / completedAttempts.length
    : 0
  const passRate = completedAttempts.length > 0
    ? (completedAttempts.filter(a => a.passed).length / completedAttempts.length) * 100
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/lecturer/tests/${testId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Test
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Test Attempts</h1>
                <p className="text-sm text-gray-600">{test.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {completedAttempts.length > 0 && (
                <>
                  <BulkAIGrading
                    onGradeAll={async (rubric) => {
                      const result = await aiGradeAllTestAttempts(testId, rubric)
                      if (result.success) {
                        await loadData()
                      }
                      return result
                    }}
                    itemCount={completedAttempts.length}
                    itemType="attempts"
                    label="Grade All with AI"
                    variant="outline"
                  />
                  <Button onClick={handleExport} disabled={exporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {exporting ? 'Exporting...' : 'Export to CSV'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{attempts.length}</p>
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
              <p className="text-3xl font-bold text-green-600">{completedAttempts.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{inProgressAttempts.length}</p>
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
              <p className="text-3xl font-bold text-blue-600">{avgScore.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{passRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or matric number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attempts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Attempts ({filteredAttempts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAttempts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>{searchQuery ? 'No matching attempts found' : 'No attempts yet'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matric Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempt</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Taken</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {filteredAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-700">
                                {attempt.student?.first_name?.[0]}{attempt.student?.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {attempt.student?.first_name} {attempt.student?.last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attempt.student?.level} Level • {attempt.student?.department}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {attempt.student?.matric_number || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge variant="outline">#{attempt.attempt_number}</Badge>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {attempt.status === 'completed' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {attempt.total_score}/{test.total_marks}
                              </span>
                              <Badge variant={attempt.passed ? 'default' : 'destructive'} className="text-xs">
                                {attempt.percentage?.toFixed(0)}%
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {attempt.status === 'completed' ? (
                            <Badge className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              In Progress
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {attempt.time_taken_minutes ? `${attempt.time_taken_minutes} min` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attempt.submitted_at ? formatDistanceToNow(new Date(attempt.submitted_at), { addSuffix: true }) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link href={`/lecturer/tests/attempts/${attempt.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}