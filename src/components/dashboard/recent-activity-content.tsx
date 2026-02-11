'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: 'assignment_submission' | 'test_attempt'
  title: string
  course: string
  date: string
}

interface RecentActivityContentProps {
  userId: string
  enrolledCount: number
}

export function RecentActivityContent({ userId, enrolledCount }: RecentActivityContentProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchRecentActivity()
  }, [userId])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch recent assignment submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('id, created_at, assignment_id')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (submissionsError) {
        console.error('Submissions error:', submissionsError?.message || submissionsError)
        // Continue without submissions rather than failing entire activity load
      }

      // Fetch recent test attempts
      const { data: testAttempts, error: testError } = await supabase
        .from('test_attempts')
        .select('id, created_at, test_id')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (testError) {
        console.error('Test attempts error:', testError?.message || testError)
        // Continue without test attempts rather than failing entire activity load
      }

      // Get assignment details
      const assignmentIds = submissions?.map(s => s.assignment_id).filter(Boolean) || []
      const assignmentDetails: { [key: string]: any } = {}
      
      if (assignmentIds.length > 0) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select('id, title, display_course_title')
          .in('id', assignmentIds)

        if (assignmentsError) {
          console.error('Assignments error:', assignmentsError)
        } else if (assignments) {
          assignments.forEach(a => {
            assignmentDetails[a.id] = a
          })
        }
      }

      // Get test details
      const testIds = testAttempts?.map(a => a.test_id).filter(Boolean) || []
      const testDetails: { [key: string]: any } = {}
      
      if (testIds.length > 0) {
        const { data: tests, error: testsError } = await supabase
          .from('tests')
          .select('id, title, display_course_title')
          .in('id', testIds)

        if (testsError) {
          console.error('Tests error:', testsError)
        } else if (tests) {
          tests.forEach(t => {
            testDetails[t.id] = t
          })
        }
      }

      // Combine and sort activities
      const combinedActivities: ActivityItem[] = []

      submissions?.forEach((submission: any) => {
        const assignment = assignmentDetails[submission.assignment_id]
        if (assignment) {
          combinedActivities.push({
            id: submission.id,
            type: 'assignment_submission',
            title: assignment.title || 'Untitled Assignment',
            course: assignment.display_course_title || 'Unknown Course',
            date: new Date(submission.created_at).toLocaleDateString(),
          })
        }
      })

      testAttempts?.forEach((attempt: any) => {
        const test = testDetails[attempt.test_id]
        if (test) {
          combinedActivities.push({
            id: attempt.id,
            type: 'test_attempt',
            title: test.title || 'Untitled Test',
            course: test.display_course_title || 'Unknown Course',
            date: new Date(attempt.created_at).toLocaleDateString(),
          })
        }
      })

      // Sort by date descending
      combinedActivities.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      setActivities(combinedActivities)
      setCurrentPage(1)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Error fetching recent activity:', errorMessage)
      setError('Failed to load recent activity')
    } finally {
      setLoading(false)
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(activities.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedActivities = activities.slice(startIndex, endIndex)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading activity...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (activities.length === 0) {
    return enrolledCount === 0 ? (
      <div className="text-center py-12 text-gray-500">
        <p>No recent activity</p>
        <p className="text-sm mt-2">Enroll in courses to get started</p>
        <Link href="/student/courses">
          <Button className="mt-4">Browse Courses</Button>
        </Link>
      </div>
    ) : (
      <div className="text-center py-12 text-gray-500">
        <p>No recent activity</p>
        <p className="text-sm mt-2">Your assignments, tests, and submissions will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedActivities.map((activity) => (
        <div key={activity.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {activity.type === 'assignment_submission' ? '📝' : '🎯'}
              </span>
              <div>
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.course}</p>
              </div>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm text-gray-600">{activity.date}</p>
            <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {activity.type === 'assignment_submission' ? 'Submitted' : 'Attempted'}
            </span>
          </div>
        </div>
      ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
