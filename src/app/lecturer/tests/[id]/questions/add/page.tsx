// app/lecturer/tests/[id]/questions/add/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuestionBuilder } from '@/components/test/question-builder'
import { CSVQuestionUpload } from '@/components/test/csv-upload'
import DocumentUpload from '@/components/test/document-upload'
import QuestionPreview from '@/components/test/question-preview'
import { ArrowLeft, Plus, FileText, Table, Trash2, CheckCircle, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { getTestById } from '@/lib/actions/test.actions'
import { getTestQuestions, createQuestion, deleteQuestion, importQuestionsFromDocument } from '@/lib/actions/question.actions'
import { publishTest } from '@/lib/actions/test.actions'
import type { TestWithDetails, QuestionWithOptions, CreateQuestionData } from '@/lib/types/test.types'
import type { ExtractedQuestion } from '@/lib/services/gemini.service'
import { toast } from 'sonner'

export default function AddQuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string

  const [test, setTest] = useState<TestWithDetails | null>(null)
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithOptions | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[] | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const loadTestAndQuestions = useCallback(async () => {
    try {
      setLoading(true)
      
      const [testResult, questionsResult] = await Promise.all([
        getTestById(testId),
        getTestQuestions(testId)
      ])

      if (testResult.error) {
        setError(testResult.error)
        return
      }

      if (testResult.test) {
        setTest(testResult.test)
      }

      if (questionsResult.questions) {
        setQuestions(questionsResult.questions)
      }
    } catch (err) {
      console.error('Error loading test:', err)
      setError('Failed to load test')
    } finally {
      setLoading(false)
    }
  }, [testId])

  useEffect(() => {
    loadTestAndQuestions()
  }, [loadTestAndQuestions])

  const handleSaveQuestion = async (questionData: CreateQuestionData) => {
    try {
      setError('')

      const result = await createQuestion(testId, questionData)

      if (result.error) {
        setError(result.error)
        return
      }

      await loadTestAndQuestions()
      
      setEditingQuestion(null)
      toast.success('Question added successfully!')
    } catch (err) {
      console.error('Error saving question:', err)
      setError('Failed to save question')
      toast.error('Failed to save question')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      setError('')
      const result = await deleteQuestion(questionId)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      await loadTestAndQuestions()
      toast.success('Question deleted successfully!')
    } catch (err) {
      console.error('Error deleting question:', err)
      setError('Failed to delete question')
      toast.error('Failed to delete question')
    }
  }

  const handlePublishTest = async () => {
    if (questions.length === 0) {
      toast.error('Cannot publish test without questions')
      return
    }

    if (!confirm('Are you sure you want to publish this test? Students will be able to access it.')) {
      return
    }

    try {
      setPublishing(true)
      setError('')

      const result = await publishTest(testId)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      toast.success('Test published successfully!')
      router.push(`/lecturer/tests/${testId}`)
    } catch (err) {
      console.error('Error publishing test:', err)
      setError('Failed to publish test')
      toast.error('Failed to publish test')
    } finally {
      setPublishing(false)
    }
  }

  const handleQuestionsExtracted = (questions: ExtractedQuestion[]) => {
    setExtractedQuestions(questions)
  }

  const handleImportDocumentQuestions = async (questions: ExtractedQuestion[]) => {
    setIsImporting(true)
    
    try {
      const result = await importQuestionsFromDocument(testId, questions)
      
      if (result.success) {
        toast.success(`Successfully imported ${result.count} questions!`)
        setExtractedQuestions(null)
        await loadTestAndQuestions()
      } else {
        toast.error(result.error || 'Failed to import questions')
      }
    } catch (err) {
      console.error('Error importing questions:', err)
      toast.error('Failed to import questions')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setExtractedQuestions(null)
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'Multiple Choice'
      case 'true_false': return 'True/False'
      case 'essay': return 'Essay'
      default: return type
    }
  }

  // If questions are being previewed from document import, show preview screen
  if (extractedQuestions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCancelImport}
                  disabled={isImporting}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Preview Imported Questions</h1>
                  <p className="text-sm text-gray-600">Review and import questions from document</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <QuestionPreview
            questions={extractedQuestions}
            onImport={handleImportDocumentQuestions}
            onCancel={handleCancelImport}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test...</p>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Test not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/lecturer/tests/${testId}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Test
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
                <p className="text-sm text-gray-600">Add and manage questions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={test.is_published ? 'default' : 'secondary'}>
                {test.is_published ? 'Published' : 'Draft'}
              </Badge>
              {test.is_standalone && (
                <Badge className="bg-purple-100 text-purple-700">Standalone</Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{questions.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {questions.reduce((sum, q) => sum + q.marks, 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">MCQ Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {questions.filter(q => q.question_type === 'mcq').length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Essay Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {questions.filter(q => q.question_type === 'essay').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different input methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Questions</CardTitle>
            <p className="text-sm text-muted-foreground">Choose how you want to add questions to your test</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="manual">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="csv">
                  <Table className="mr-2 h-4 w-4" />
                  CSV Import
                </TabsTrigger>
                <TabsTrigger value="document">
                  <FileText className="mr-2 h-4 w-4" />
                  Document Import
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-6">
                <QuestionBuilder
                  onSave={handleSaveQuestion}
                  onCancel={() => {
                    setEditingQuestion(null)
                  }}
                  initialData={editingQuestion ? {
                    ...editingQuestion,
                    question_image_url: editingQuestion.question_image_url || undefined
                  } as CreateQuestionData : undefined}
                />
              </TabsContent>

              <TabsContent value="csv" className="mt-6">
                <CSVQuestionUpload
                  testId={testId}
                  onSuccess={() => {
                    loadTestAndQuestions()
                    toast.success('Questions imported from CSV successfully!')
                  }}
                  onCancel={() => {}}
                />
              </TabsContent>

              <TabsContent value="document" className="mt-6">
                <DocumentUpload onQuestionsExtracted={handleQuestionsExtracted} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Publish Button */}
        {questions.length > 0 && !test.is_published && (
          <div className="mb-6 flex justify-end">
            <Button
              onClick={handlePublishTest}
              disabled={publishing}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {publishing ? 'Publishing...' : 'Publish Test'}
            </Button>
          </div>
        )}

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>Questions ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Plus className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600 mb-4">
                  Add questions manually, import from CSV, or extract from documents to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-bold shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                {getQuestionTypeLabel(question.question_type)}
                              </Badge>
                              <Badge variant="secondary">{question.marks} marks</Badge>
                            </div>
                            <p className="text-gray-900 font-medium">{question.question_text}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              onClick={() => handleDeleteQuestion(question.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Options for MCQ and True/False */}
                        {(question.question_type === 'mcq' || question.question_type === 'true_false') && question.options && (
                          <div className="mt-3 space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={option.id}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  option.is_correct ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                }`}
                              >
                                <span className="font-medium text-sm">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span className="text-sm">{option.option_text}</span>
                                {option.is_correct && (
                                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Explanation */}
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                            <p className="font-medium text-blue-900 mb-1">Explanation:</p>
                            <p className="text-blue-800">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Summary */}
        {questions.length > 0 && (
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Total: {questions.length} questions, {questions.reduce((sum, q) => sum + q.marks, 0)} marks
            </p>
            
            {!test.is_published && (
              <Button
                onClick={handlePublishTest}
                disabled={publishing}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {publishing ? 'Publishing...' : 'Publish Test'}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}