// ============================================================================
// components/admin/user-courses-tab.tsx
// ============================================================================
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

export function UserCoursesTab({ userId, userRole }: { userId: string, userRole: string }) {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      const supabase = createClient()
      
      console.log('Fetching courses for user:', userId, 'role:', userRole)
      
      if (userRole === 'student') {
        // For students, get enrollments with course details
        const { data, error } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            enrollment_status,
            enrolled_at,
            course:course_id (
              id,
              course_code,
              course_title,
              department,
              level,
              semester
            )
          `)
          .eq('student_id', userId)
        
        console.log('Student courses query:', {
          userId,
          data,
          error,
          dataLength: data?.length
        })
        
        if (error) {
          console.error('Error fetching student courses:', error)
        }
        
        if (data) {
          console.log('First enrollment:', data[0])
        }
        
        setCourses(data || [])
      } else if (userRole === 'lecturer') {
        // For lecturers, get courses they created
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('created_by', userId)
        
        console.log('Lecturer courses query result:', { data, error })
        
        if (error) {
          console.error('Error fetching lecturer courses:', error)
        }
        
        setCourses(data || [])
      }
      
      setLoading(false)
    }
    fetchCourses()
  }, [userId, userRole])

  console.log('Rendering courses tab with:', { coursesLength: courses.length, loading })

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-8 text-gray-500">Loading courses...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {userRole === 'student' ? 'Enrolled Courses' : 'Created Courses'}
        </CardTitle>
        <CardDescription>
          {userRole === 'student' 
            ? `Courses this student is enrolled in (${courses.length} total)`
            : 'Courses created by this lecturer'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No courses yet</p>
            <p className="text-xs text-gray-400 mt-2">
              Debug: userId={userId}, role={userRole}, coursesLength={courses.length}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((item, index) => {
              // For students, course is nested; for lecturers, item IS the course
              const course = userRole === 'student' ? item.course : item
              
              console.log(`Rendering course ${index}:`, { item, course })
              
              return (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{course?.course_title || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{course?.course_code || 'N/A'}</p>
                      {course?.department && (
                        <p className="text-xs text-gray-500 mt-1">{course.department}</p>
                      )}
                      {course?.level && (
                        <p className="text-xs text-gray-500">
                          Level {course.level} • Semester {course.semester || 'N/A'}
                        </p>
                      )}
                    </div>
                    {userRole === 'student' && (
                      <Badge variant={item.enrollment_status === 'active' ? 'default' : 'secondary'}>
                        {item.enrollment_status}
                      </Badge>
                    )}
                    {userRole === 'lecturer' && (
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
