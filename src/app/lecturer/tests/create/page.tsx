// app/lecturer/tests/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createStandaloneTest } from '@/lib/actions/test.actions'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import type { CreateQuestionData } from '@/lib/types/test.types'

export default function CreateStandaloneTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Test configuration
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [testType, setTestType] = useState<'quiz' | 'midterm' | 'final_exam' | 'practice'>('quiz')
  const [instructions, setInstructions] = useState('')
  const [totalMarks, setTotalMarks] = useState(100)
  const [allocatedMarks, setAllocatedMarks] = useState(10)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [passmark, setPassmark] = useState(40)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [accessCost, setAccessCost] = useState(0)
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleOptions, setShuffleOptions] = useState(true)
  const [showResultsImmediately, setShowResultsImmediately] = useState(false)
  const [allowReview, setAllowReview] = useState(true)

  // Optional course info for display
  const [displayCourseCode, setDisplayCourseCode] = useState('')
  const [displayCourseTitle, setDisplayCourseTitle] = useState('')

  // Questions state
  const [questions, setQuestions] = useState<CreateQuestionData[]>([])
  const [currentStep, setCurrentStep] = useState<'config' | 'questions'>('config')

  const handleCreateTest = async () => {
    try {
      setLoading(true)
      setError('')

      // Validation
      if (!title.trim()) {
        setError('Test title is required')
        return
      }

      if (!startTime || !endTime) {
        setError('Start time and end time are required')
        return
      }

      const start = new Date(startTime)
      const end = new Date(endTime)
      if (end <= start) {
        setError('End time must be after start time')
        return
      }

      if (durationMinutes <= 0) {
        setError('Duration must be greater than 0')
        return
      }

      // Create test
      const result = await createStandaloneTest({
        title: title.trim(),
        description: description.trim() || undefined,
        test_type: testType,
        instructions: instructions.trim() || undefined,
        total_marks: totalMarks,
        allocated_marks: allocatedMarks,
        duration_minutes: durationMinutes,
        start_time: startTime,
        end_time: endTime,
        pass_mark: passmark,
        max_attempts: maxAttempts,
        access_cost: accessCost,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        show_results_immediately: showResultsImmediately,
        allow_review: allowReview,
        is_standalone: true,
        display_course_code: displayCourseCode.trim() || undefined,
        display_course_title: displayCourseTitle.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      // Redirect to add questions or success page
      if (result.test && result.accessCode) {
        router.push(`/lecturer/tests/${result.test.id}/success?code=${result.accessCode}`)
      }
    } catch (err) {
      console.error('Error creating test:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/lecturer/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Standalone Test</h1>
              <p className="text-sm text-gray-600">Create a quick test without course setup</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Standalone Mode
          </Badge>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleCreateTest(); }} className="space-y-6">
          {/* Test Information */}
          <Card>
            <CardHeader>
              <CardTitle>Test Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Test Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Introduction to Algorithms Quiz"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the test..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testType">Test Type</Label>
                  <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
                    <SelectTrigger id="testType">
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="midterm">Midterm</SelectItem>
                      <SelectItem value="final_exam">Final Exam</SelectItem>
                      <SelectItem value="practice">Practice Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="durationMinutes">Duration (minutes) *</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Special instructions for students taking this test..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Optional Course Display Info */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information (Optional)</CardTitle>
              <p className="text-sm text-gray-600">Display course info without linking to a course</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayCourseCode">Course Code</Label>
                  <Input
                    id="displayCourseCode"
                    value={displayCourseCode}
                    onChange={(e) => setDisplayCourseCode(e.target.value)}
                    placeholder="e.g., CSC 301"
                  />
                </div>

                <div>
                  <Label htmlFor="displayCourseTitle">Course Title</Label>
                  <Input
                    id="displayCourseTitle"
                    value={displayCourseTitle}
                    onChange={(e) => setDisplayCourseTitle(e.target.value)}
                    placeholder="e.g., Data Structures"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grading Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Grading Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalMarks">Total Marks *</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="allocatedMarks">CA Marks (if applicable)</Label>
                  <Input
                    id="allocatedMarks"
                    type="number"
                    value={allocatedMarks}
                    onChange={(e) => setAllocatedMarks(parseInt(e.target.value))}
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">For course-based CA tracking</p>
                </div>

                <div>
                  <Label htmlFor="passmark">Pass Mark (%)</Label>
                  <Input
                    id="passmark"
                    type="number"
                    value={passmark}
                    onChange={(e) => setPassmark(parseInt(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Access */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule & Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxAttempts">Maximum Attempts Allowed</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Number of times a student can take this test</p>
              </div>
            </CardContent>
          </Card>

          {/* Test Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Test Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                  <p className="text-sm text-gray-600">Randomize question order for each student</p>
                </div>
                <input
                  id="shuffleQuestions"
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="shuffleOptions">Shuffle Options</Label>
                  <p className="text-sm text-gray-600">Randomize answer options for MCQ questions</p>
                </div>
                <input
                  id="shuffleOptions"
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showResults">Show Results Immediately</Label>
                  <p className="text-sm text-gray-600">Display score right after submission</p>
                </div>
                <input
                  id="showResults"
                  type="checkbox"
                  checked={showResultsImmediately}
                  onChange={(e) => setShowResultsImmediately(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowReview">Allow Review</Label>
                  <p className="text-sm text-gray-600">Let students review their answers after submission</p>
                </div>
                <input
                  id="allowReview"
                  type="checkbox"
                  checked={allowReview}
                  onChange={(e) => setAllowReview(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Link href="/lecturer/dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Test & Add Questions'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}