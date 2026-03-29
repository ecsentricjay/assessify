'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubmissionItem {
  id: string
  student_name: string
  assignment_title: string
  course_name: string
  submitted_at: string
  status: 'submitted' | 'graded'
}

interface RecentSubmissionsContentProps {
  userId: string
}

export function RecentSubmissionsContent({ userId }: RecentSubmissionsContentProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchRecentSubmissions()
  }, [userId])

  const fetchRecentSubmissions = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // First, get all assignments created by this lecturer
      const { data: lecturerassignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id')
        .eq('created_by', userId)

      if (assignmentsError) {
        console.error('Assignments error:', assignmentsError)
        throw assignmentsError
      }

      const assignmentIds = lecturerassignments?.map(a => a.id) || []

      if (assignmentIds.length === 0) {
        setSubmissions([])
        setLoading(false)
        return
      }

      // Fetch submissions for these assignments
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('id, created_at, graded_at, assignment_id, student_id')
        .in('assignment_id', assignmentIds)
        .order('created_at', { ascending: false })
        .limit(50)

      if (submissionsError) {
        console.error('Submissions error:', submissionsError)
        throw submissionsError
      }

      // Get student details
      const studentIds = submissionsData?.map(s => s.student_id).filter(Boolean) || []
      const studentDetails: { [key: string]: any } = {}

      if (studentIds.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', studentIds)

        if (studentsError) {
          console.error('Students error:', studentsError)
        } else if (students) {
          students.forEach(s => {
            studentDetails[s.id] = s
          })
        }
      }

      // Get assignment details
      const { data: assignments, error: assignDetailsError } = await supabase
        .from('assignments')
        .select('id, title, display_course_title')
        .in('id', assignmentIds)

      if (assignDetailsError) {
        console.error('Assignment details error:', assignDetailsError)
      }

      const assignmentTitles: { [key: string]: any } = {}
      if (assignments) {
        assignments.forEach(a => {
          assignmentTitles[a.id] = a
        })
      }

      // Format submissions
      const formattedSubmissions: SubmissionItem[] = (submissionsData || []).map((submission: any) => {
        const student = studentDetails[submission.student_id]
        const assignment = assignmentTitles[submission.assignment_id]

        return {
          id: submission.id,
          student_name: student
            ? `${student.first_name} ${student.last_name}`.trim()
            : 'Unknown Student',
          assignment_title: assignment?.title || 'Untitled Assignment',
          course_name: assignment?.display_course_title || 'Unknown Course',
          submitted_at: new Date(submission.created_at).toLocaleDateString(),
          status: submission.graded_at ? 'graded' : 'submitted',
        }
      })

      setSubmissions(formattedSubmissions)
      setCurrentPage(1)
    } catch (err) {
      console.error('Error fetching submissions:', err)
      setError('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(submissions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSubmissions = submissions.slice(startIndex, endIndex)

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
    return <div className="text-center py-8 text-gray-500">Loading submissions...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No recent submissions</p>
        <p className="text-sm mt-2">Student submissions will appear here for grading</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedSubmissions.map((submission) => (
        <div key={submission.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📬</span>
              <div>
                <p className="font-medium text-gray-900">{submission.student_name}</p>
                <p className="text-sm text-gray-600">{submission.assignment_title}</p>
                <p className="text-xs text-gray-500">{submission.course_name}</p>
              </div>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm text-gray-600">{submission.submitted_at}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-1 rounded font-medium ${
              submission.status === 'graded'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {submission.status === 'graded' ? '✓ Graded' : 'Pending'}
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
