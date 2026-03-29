'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import EnrollWithCodeForm from './enroll-code-form'
import SearchCoursesForm from './search-courses-form'

export default function CourseTabs({ enrolledCourses }: { enrolledCourses: any[] }) {
  return (
    <Tabs defaultValue="enrolled" className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="enrolled">
          Enrolled Courses ({enrolledCourses.length})
        </TabsTrigger>
        <TabsTrigger value="enroll">
          Enroll in Course
        </TabsTrigger>
      </TabsList>

      {/* Enrolled Courses Tab */}
      <TabsContent value="enrolled" className="space-y-6">
        {enrolledCourses.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <div className="text-7xl mb-4">📚</div>
              <h3 className="text-2xl font-semibold mb-2">No enrolled courses</h3>
              <p className="text-gray-600 mb-6">
                Get started by enrolling in courses using an enrollment code or search
              </p>
            </CardContent>
          </Card>
        )}

        {enrolledCourses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((item: any) => {
              const course = item.courses
              return (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {course.course_code}
                      </div>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Active
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {course.course_title}
                    </CardTitle>
                    {course.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {course.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Credit Units:</span>
                        <span className="font-medium">{course.credit_units}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Semester:</span>
                        <span className="font-medium">
                          {course.semester === 1 ? 'First' : 'Second'} Semester
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Session:</span>
                        <span className="font-medium">{course.session}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Level:</span>
                        <span className="font-medium">{course.level} Level</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Link href={`/student/courses/${course.id}`}>
                        <Button className="w-full" size="sm">
                          View Course Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>

      {/* Enroll in Course Tab */}
      <TabsContent value="enroll" className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Enroll with Code Card */}
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg 
                    className="w-6 h-6 text-blue-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                    />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Enroll with Code</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Use the enrollment code from your lecturer
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EnrollWithCodeForm />
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> Your lecturer will share an 8-character code via WhatsApp or in class. 
                  Enter it above to instantly enroll.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Search Courses Card */}
          <Card className="border-2 border-green-100">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg 
                    className="w-6 h-6 text-green-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Search Courses</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Find courses by code or title
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SearchCoursesForm />
              
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800">
                  <strong>💡 Tip:</strong> Search by course code (e.g., &quot;CSC 301&quot;) or course title 
                  (e.g., &quot;Data Structures&quot;). Only courses from your institution will appear.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🎓</div>
                <h4 className="font-semibold text-sm mb-1">Institution Courses</h4>
                <p className="text-xs text-gray-700">
                  Only courses from your institution are available for enrollment
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold text-sm mb-1">Instant Enrollment</h4>
                <p className="text-xs text-gray-700">
                  Enroll immediately using the code - no approval needed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl mb-2">📱</div>
                <h4 className="font-semibold text-sm mb-1">Share via WhatsApp</h4>
                <p className="text-xs text-gray-700">
                  Lecturers can easily share enrollment codes through messaging
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}