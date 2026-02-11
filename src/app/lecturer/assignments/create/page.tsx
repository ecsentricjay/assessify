// Save as: src/app/lecturer/assignments/create/page.tsx
// This replaces the existing page that showed "no course selected"

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createStandaloneAssignment } from '@/lib/actions/standalone-assignment.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function CreateStandaloneAssignmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ accessCode: string; shareableLink: string } | null>(null)
  
  const [assignmentType, setAssignmentType] = useState('general')
  const [lateSubmissionAllowed, setLateSubmissionAllowed] = useState(false)
  const [aiGradingEnabled, setAiGradingEnabled] = useState(false)
  const [plagiarismCheckEnabled, setPlagiarismCheckEnabled] = useState(true)
  const [aiRubric, setAiRubric] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    const data = {
      displayCourseCode: formData.get('displayCourseCode') as string,
      displayCourseTitle: formData.get('displayCourseTitle') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      instructions: formData.get('instructions') as string,
      assignmentType,
      maxScore: parseFloat(formData.get('maxScore') as string),
      deadline: formData.get('deadline') as string,
      lateSubmissionAllowed,
      latePenaltyPercentage: lateSubmissionAllowed 
        ? parseFloat(formData.get('latePenaltyPercentage') as string || '0')
        : 0,
      allowedFileTypes: ['pdf', 'docx', 'txt', 'jpg', 'png'],
      maxFileSizeMb: parseInt(formData.get('maxFileSizeMb') as string),
      submissionCost: 0, // Set by system, not lecturer
      aiGradingEnabled,
      aiRubric: aiGradingEnabled ? aiRubric : null,
      plagiarismCheckEnabled,
    }

    const result = await createStandaloneAssignment(data)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess({
        accessCode: result.accessCode!,
        shareableLink: result.shareableLink!
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <CardTitle className="text-2xl text-green-800">
                  Assignment Created Successfully!
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Access Code */}
              <div className="bg-white p-6 rounded-lg border-2 border-green-300">
                <h3 className="font-semibold mb-3 text-center">Share this Access Code</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-blue-50 p-4 rounded border-2 border-blue-300 text-center">
                    <p className="text-4xl font-bold font-mono text-blue-600 tracking-wider">
                      {success.accessCode}
                    </p>
                  </div>
                  <Button onClick={() => copyToClipboard(success.accessCode)}>
                    📋 Copy
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Students can use this code to access the assignment
                </p>
              </div>

              {/* Shareable Link */}
              <div className="bg-white p-6 rounded-lg border-2 border-green-300">
                <h3 className="font-semibold mb-3 text-center">Or Share this Link</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-blue-50 p-3 rounded border border-blue-300">
                    <p className="text-sm text-blue-600 break-all">
                      {success.shareableLink}
                    </p>
                  </div>
                  <Button onClick={() => copyToClipboard(success.shareableLink)}>
                    📋 Copy
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Share this link via WhatsApp, Email, or any platform
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t">
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/lecturer/assignments/standalone')}
                >
                  View All Standalone Assignments
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push('/lecturer/dashboard')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/lecturer/dashboard">
            <Button variant="outline" size="sm">← Back to Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">Quick Assignment Creation</CardTitle>
              <Badge className="bg-purple-100 text-purple-800">Standalone Mode</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Create a standalone assignment without course setup. Perfect for quick testing or one-off assignments.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Display Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>📚</span> Course Display Information
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  This information is for display purposes only and helps students identify the assignment.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayCourseCode">Course Code *</Label>
                    <Input
                      id="displayCourseCode"
                      name="displayCourseCode"
                      placeholder="e.g., CSC 301"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayCourseTitle">Course Title *</Label>
                    <Input
                      id="displayCourseTitle"
                      name="displayCourseTitle"
                      placeholder="e.g., Data Structures"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Assignment Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Binary Search Trees Implementation"
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

              {/* Grading */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">Grading Configuration</h3>
                
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
                    The maximum score students can earn
                  </p>
                </div>
              </div>

              {/* Deadline */}
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
                    Allowed types: PDF, DOCX, TXT, JPG, PNG
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
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : '🚀 Create & Publish Assignment'}
                </Button>
                <Link href="/lecturer/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <strong>💡 Note:</strong> This is a standalone assignment. It will not be linked to any course 
                  and won&apos;t affect CA calculations. Perfect for quick testing or one-off assignments!
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}