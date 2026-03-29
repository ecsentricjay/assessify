// Save as: src/app/lecturer/courses/[id]/assignments/create/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createAssignment } from '@/lib/actions/assignment.actions'
import { getCourseById } from '@/lib/actions/course.actions'
import { getDefaultSubmissionCost } from '@/lib/actions/settings.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function CreateCourseAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [defaultSubmissionCost, setDefaultSubmissionCost] = useState(200)
  
  const [assignmentType, setAssignmentType] = useState('general')
  const [lateSubmissionAllowed, setLateSubmissionAllowed] = useState(false)
  const [aiGradingEnabled, setAiGradingEnabled] = useState(false)
  const [plagiarismCheckEnabled, setPlagiarismCheckEnabled] = useState(true)
  const [aiRubric, setAiRubric] = useState('')

  useEffect(() => {
    async function loadData() {
      // CRITICAL: Validate courseId exists
      if (!courseId || courseId === 'undefined' || courseId === 'null') {
        setError('No course selected. Please select a course first.')
        setLoading(false)
        return
      }

      const result = await getCourseById(courseId)
      if (result.course) {
        setCourse(result.course)
      } else {
        setError(result.error || 'Course not found')
      }

      // Fetch default submission cost
      const cost = await getDefaultSubmissionCost()
      setDefaultSubmissionCost(cost)

      setLoading(false)
    }
    loadData()
  }, [courseId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    // CRITICAL: Double-check courseId before submission
    if (!courseId || courseId === 'undefined' || courseId === 'null') {
      setError('Invalid course ID. Cannot create assignment without a valid course.')
      return
    }

    if (!course) {
      setError('Course not loaded. Please refresh and try again.')
      return
    }

    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const data = {
      courseId, // MUST be a valid UUID
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      instructions: formData.get('instructions') as string,
      assignmentType,
      maxScore: parseFloat(formData.get('maxScore') as string),
      allocatedMarks: parseFloat(formData.get('allocatedMarks') as string),
      deadline: formData.get('deadline') as string,
      lateSubmissionAllowed,
      latePenaltyPercentage: lateSubmissionAllowed 
        ? parseFloat(formData.get('latePenaltyPercentage') as string || '0')
        : 0,
      allowedFileTypes: ['pdf', 'docx', 'doc', 'txt', 'jpg', 'png', 'jpeg'],
      maxFileSizeMb: parseInt(formData.get('maxFileSizeMb') as string),
      submissionCost: defaultSubmissionCost, // Auto-set from admin settings
      aiGradingEnabled,
      aiRubric: aiGradingEnabled ? aiRubric : null,
      plagiarismCheckEnabled,
    }

    console.log('📝 Creating course assignment with data:', {
      courseId: data.courseId,
      title: data.title,
      course: course.course_code
    })

    const result = await createAssignment(data)

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      console.log('✅ Assignment created successfully')
      router.push(`/lecturer/courses/${courseId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            {error.includes('No course selected') ? (
              <div className="space-y-2">
                <Link href="/lecturer/courses">
                  <Button className="w-full">View All Courses</Button>
                </Link>
                <Link href="/lecturer/assignments/create">
                  <Button variant="outline" className="w-full">
                    Create Standalone Assignment Instead
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/lecturer/courses">
                <Button>Back to Courses</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableMarks = course.total_ca_marks - course.attendance_marks

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href={`/lecturer/courses/${courseId}`}>
            <Button variant="outline" size="sm">← Back to Course</Button>
          </Link>
        </div>

        {/* Course Context Banner */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-green-600 text-white">Course-Based Assignment</Badge>
            <Badge variant="outline">{course.course_code}</Badge>
          </div>
          <h3 className="font-semibold text-lg text-gray-900">{course.course_title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            This assignment will be linked to this course and affect CA calculations
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Create Course Assignment</CardTitle>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p><strong>Available CA Marks:</strong> {availableMarks} marks (Total: {course.total_ca_marks}, Attendance: {course.attendance_marks})</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Assignment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Assignment Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Mid-Semester Assignment"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignmentType">Assignment Type *</Label>
                  <Select value={assignmentType} onValueChange={setAssignmentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="case_study">Case Study</SelectItem>
                      <SelectItem value="practical">Practical</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of the assignment..."
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Detailed Instructions</Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    placeholder="Provide detailed instructions for students..."
                    rows={6}
                  />
                </div>
              </div>

              {/* Grading Configuration */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">Grading Configuration</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxScore">Maximum Score *</Label>
                    <Input
                      id="maxScore"
                      name="maxScore"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="100"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Total points for this assignment
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allocatedMarks">Allocated CA Marks *</Label>
                    <Input
                      id="allocatedMarks"
                      name="allocatedMarks"
                      type="number"
                      min="0"
                      max={availableMarks}
                      step="0.01"
                      defaultValue="10"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Max {availableMarks} marks available
                    </p>
                  </div>
                </div>



                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>📊 CA Calculation:</strong> Student scores will be converted proportionally to the allocated CA marks.
                    For example, if a student scores 80/100 on a 10-mark assignment, they get 8 CA marks.
                  </p>
                </div>
              </div>

              {/* Deadline & Submission */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">Deadline & Submission</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="datetime-local"
                    required
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>💳 Submission Cost:</strong> Students will be charged <strong>₦{defaultSubmissionCost.toLocaleString()}</strong> to submit this assignment. This is the default rate set by administrators.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lateSubmission"
                    checked={lateSubmissionAllowed}
                    onCheckedChange={(checked) => setLateSubmissionAllowed(checked as boolean)}
                  />
                  <Label htmlFor="lateSubmission" className="cursor-pointer">
                    Allow late submissions
                  </Label>
                </div>

                {lateSubmissionAllowed && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="latePenaltyPercentage">Late Penalty (% per day)</Label>
                    <Input
                      id="latePenaltyPercentage"
                      name="latePenaltyPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      defaultValue="5"
                    />
                  </div>
                )}
              </div>

              {/* File Settings */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">File Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="maxFileSizeMb">Max File Size (MB) *</Label>
                  <Input
                    id="maxFileSizeMb"
                    name="maxFileSizeMb"
                    type="number"
                    min="1"
                    max="50"
                    defaultValue="10"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Allowed types: PDF, DOCX, DOC, TXT, JPG, PNG, JPEG
                  </p>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">Advanced Options</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="plagiarismCheck"
                      checked={plagiarismCheckEnabled}
                      onCheckedChange={(checked) => setPlagiarismCheckEnabled(checked as boolean)}
                    />
                    <Label htmlFor="plagiarismCheck" className="cursor-pointer">
                      Enable plagiarism detection
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aiGrading"
                      checked={aiGradingEnabled}
                      onCheckedChange={(checked) => setAiGradingEnabled(checked as boolean)}
                    />
                    <Label htmlFor="aiGrading" className="cursor-pointer">
                      Enable AI-assisted grading
                    </Label>
                  </div>

                  {aiGradingEnabled && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label htmlFor="aiRubric" className="font-semibold text-blue-900 mb-2 block">
                        AI Grading Rubric & Expectations
                      </Label>
                      <p className="text-sm text-blue-700 mb-3">
                        Provide guidelines for what you expect students to include and how the AI should grade this assignment.
                      </p>
                      <Textarea
                        id="aiRubric"
                        value={aiRubric}
                        onChange={(e) => setAiRubric(e.target.value)}
                        placeholder="e.g., 'Grade based on clarity of writing, critical thinking, proper citations, and accurate financial analysis. Deduct marks for incomplete answers or lack of supporting evidence.'"
                        className="min-h-[120px]"
                      />
                      <p className="text-xs text-blue-600 mt-2">
                        💡 Tip: Be specific about what constitutes good answers, weightage of different aspects, and any common mistakes to look for.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Creating...' : '🚀 Create Assignment (Draft)'}
                </Button>
                <Link href={`/lecturer/courses/${courseId}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>💡 Course Assignment:</strong> This assignment will:
                </p>
                <ul className="text-sm text-green-700 mt-2 ml-4 space-y-1">
                  <li>• Be linked to <strong>{course.course_code}</strong></li>
                  <li>• Contribute to CA calculations for this course</li>
                  <li>• Be visible to students enrolled in this course</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}