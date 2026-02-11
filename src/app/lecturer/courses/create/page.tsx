'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCourse } from '@/lib/actions/course.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function CreateCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState<string>('')
  const [semester, setSemester] = useState<string>('')
  const [totalCaMarks, setTotalCaMarks] = useState<number>(30)
  const [attendanceMarks, setAttendanceMarks] = useState<number>(5)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    const data = {
      courseCode: formData.get('courseCode') as string,
      courseTitle: formData.get('courseTitle') as string,
      description: formData.get('description') as string,
      department: formData.get('department') as string,
      faculty: formData.get('faculty') as string,
      level: parseInt(level),
      semester: parseInt(semester),
      creditUnits: parseInt(formData.get('creditUnits') as string),
      session: formData.get('session') as string,
      totalCaMarks: parseFloat(formData.get('totalCaMarks') as string),
      attendanceMarks: parseFloat(formData.get('attendanceMarks') as string),
    }

    // Validation
    if (data.attendanceMarks >= data.totalCaMarks) {
      setError('Attendance marks must be less than total CA marks')
      setLoading(false)
      return
    }

    const result = await createCourse(data)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/lecturer/courses')
    }
  }

  const assessmentMarks = totalCaMarks - attendanceMarks

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/lecturer/courses">
            <Button variant="outline" size="sm">← Back to Courses</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courseCode">Course Code *</Label>
                    <Input 
                      id="courseCode" 
                      name="courseCode" 
                      placeholder="e.g., CSC 301"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session">Session *</Label>
                    <Input 
                      id="session" 
                      name="session" 
                      placeholder="e.g., 2024/2025"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseTitle">Course Title *</Label>
                  <Input 
                    id="courseTitle" 
                    name="courseTitle" 
                    placeholder="e.g., Data Structures and Algorithms"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Brief description of the course..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty *</Label>
                    <Input 
                      id="faculty" 
                      name="faculty" 
                      placeholder="e.g., Science"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input 
                      id="department" 
                      name="department" 
                      placeholder="e.g., Computer Science"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level *</Label>
                    <Select value={level} onValueChange={setLevel} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester *</Label>
                    <Select value={semester} onValueChange={setSemester} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">First</SelectItem>
                        <SelectItem value="2">Second</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditUnits">Credit Units *</Label>
                    <Input 
                      id="creditUnits" 
                      name="creditUnits" 
                      type="number"
                      min="1"
                      max="6"
                      defaultValue="3"
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* CA Marks Configuration */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">CA Marks Configuration</h3>
                <p className="text-sm text-gray-600">
                  Configure how continuous assessment marks are distributed for this course.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalCaMarks">Total CA Marks *</Label>
                    <Input 
                      id="totalCaMarks" 
                      name="totalCaMarks" 
                      type="number"
                      min="10"
                      max="50"
                      step="0.1"
                      value={totalCaMarks}
                      onChange={(e) => setTotalCaMarks(parseFloat(e.target.value) || 30)}
                      required 
                    />
                    <p className="text-xs text-gray-500">
                      Typically 30 marks in Nigerian universities
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attendanceMarks">Attendance Marks *</Label>
                    <Input 
                      id="attendanceMarks" 
                      name="attendanceMarks" 
                      type="number"
                      min="0"
                      max={totalCaMarks - 5}
                      step="0.1"
                      value={attendanceMarks}
                      onChange={(e) => setAttendanceMarks(parseFloat(e.target.value) || 5)}
                      required 
                    />
                    <p className="text-xs text-gray-500">
                      Marks allocated for attendance
                    </p>
                  </div>
                </div>

                {/* CA Marks Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">CA Marks Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total CA Marks:</span>
                      <span className="font-bold">{totalCaMarks} marks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Attendance:</span>
                      <span className="font-medium">{attendanceMarks} marks</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-300">
                      <span className="text-gray-700">Available for Assignments/Tests:</span>
                      <span className="font-bold text-green-600">{assessmentMarks} marks</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    💡 You&apos;ll distribute the {assessmentMarks} marks across assignments and tests when creating them.
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Course'}
                </Button>
                <Link href="/lecturer/courses" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}