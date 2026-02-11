// Save as: src/app/lecturer/assignments/[id]/edit/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getAssignmentById, updateAssignment } from '@/lib/actions/assignment.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function EditAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string

  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [assignmentType, setAssignmentType] = useState('general')
  const [lateSubmissionAllowed, setLateSubmissionAllowed] = useState(false)
  const [aiGradingEnabled, setAiGradingEnabled] = useState(false)
  const [plagiarismCheckEnabled, setPlagiarismCheckEnabled] = useState(true)

  useEffect(() => {
    async function loadAssignment() {
      const result = await getAssignmentById(assignmentId)
      if (result.assignment) {
        const a = result.assignment
        setAssignment(a)
        setAssignmentType(a.assignment_type)
        setLateSubmissionAllowed(a.late_submission_allowed)
        setAiGradingEnabled(a.ai_grading_enabled)
        setPlagiarismCheckEnabled(a.plagiarism_check_enabled)
      } else {
        setError(result.error || 'Assignment not found')
      }
      setLoading(false)
    }
    loadAssignment()
  }, [assignmentId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const data = {
      assignmentId,
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
      maxFileSizeMb: parseInt(formData.get('maxFileSizeMb') as string),
      aiGradingEnabled,
      plagiarismCheckEnabled,
    }

    const { assignmentId: _, ...formDataWithoutId } = data
    const result = await updateAssignment(assignmentId, formDataWithoutId)

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      router.push(`/lecturer/assignments/${assignmentId}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/lecturer/courses">
              <Button>Back to Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const deadline = new Date(assignment.deadline).toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href={`/lecturer/assignments/${assignmentId}`}>
            <Button variant="outline" size="sm">← Back to Assignment</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-2xl">Edit Assignment</CardTitle>
              <Badge className="bg-blue-100 text-blue-800">Course-Based</Badge>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Course:</strong> {assignment.courses?.course_code} - {assignment.courses?.course_title}</p>
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
                    defaultValue={assignment.title}
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
                    defaultValue={assignment.description}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Detailed Instructions</Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    defaultValue={assignment.instructions || ''}
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
                      defaultValue={assignment.max_score}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allocatedMarks">Allocated CA Marks *</Label>
                    <Input
                      id="allocatedMarks"
                      name="allocatedMarks"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={assignment.allocated_marks}
                      required
                    />
                  </div>
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
                    defaultValue={deadline}
                    required
                  />
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
                      defaultValue={assignment.late_penalty_percentage}
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
                    defaultValue={assignment.max_file_size_mb}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Allowed types: {assignment.allowed_file_types.join(', ').toUpperCase()}
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
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Saving...' : '💾 Save Changes'}
                </Button>
                <Link href={`/lecturer/assignments/${assignmentId}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Note:</strong> If students have already submitted, changing the max score or allocated marks may affect their grades.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}