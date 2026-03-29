'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAvailableCourses, enrollInCourse } from '@/lib/actions/course.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function SearchCoursesForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSearching(true)
    setError(null)
    setCourses([])

    const formData = new FormData(e.currentTarget)
    const query = formData.get('query') as string

    const result = await getAvailableCourses(query.trim())

    if (result.error) {
      setError(result.error)
    } else {
      setCourses(result.courses || [])
      if (result.courses?.length === 0) {
        setError('No courses found matching your search')
      }
    }

    setSearching(false)
  }

  async function handleEnroll(courseId: string) {
    setLoading(true)
    const result = await enrollInCourse(courseId)

    if (result.error) {
      alert(result.error)
    } else {
      alert(result.message)
      setCourses([])
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="query">Course Code or Title</Label>
          <Input
            id="query"
            name="query"
            placeholder="e.g., CSC 301 or Data Structures"
            required
            disabled={searching}
          />
        </div>

        <Button type="submit" className="w-full" disabled={searching}>
          {searching ? 'Searching...' : 'Search Courses'}
        </Button>
      </form>

      {error && courses.length === 0 && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {courses.length > 0 && (
        <div className="space-y-3 mt-4">
          <p className="text-sm font-medium">Found {courses.length} course(s):</p>
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {course.course_code}
                      </span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {course.enrollment_code}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm">{course.course_title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {course.department} • {course.credit_units} Units
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleEnroll(course.id)}
                    disabled={loading}
                  >
                    Enroll
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}