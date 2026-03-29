// components/test/question-builder.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { CreateQuestionData, CreateQuestionOptionData, QuestionType } from '@/lib/types/test.types'

interface QuestionBuilderProps {
  onSave: (question: CreateQuestionData) => void
  onCancel: () => void
  initialData?: CreateQuestionData
}

export function QuestionBuilder({ onSave, onCancel, initialData }: QuestionBuilderProps) {
  const [questionType, setQuestionType] = useState<QuestionType>(initialData?.question_type || 'mcq')
  const [questionText, setQuestionText] = useState(initialData?.question_text || '')
  const [marks, setMarks] = useState(initialData?.marks || 1)
  const [explanation, setExplanation] = useState(initialData?.explanation || '')
  const [options, setOptions] = useState<CreateQuestionOptionData[]>(
    initialData?.options || [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ]
  )

  const handleAddOption = () => {
    setOptions([...options, { option_text: '', is_correct: false }])
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleUpdateOption = (index: number, field: 'option_text' | 'is_correct', value: any) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!questionText.trim()) {
      alert('Question text is required')
      return
    }

    if (questionType === 'mcq' || questionType === 'true_false') {
      const hasCorrectAnswer = options.some(opt => opt.is_correct)
      if (!hasCorrectAnswer) {
        alert('Please mark at least one option as correct')
        return
      }

      const hasEmptyOptions = options.some(opt => !opt.option_text.trim())
      if (hasEmptyOptions) {
        alert('All options must have text')
        return
      }
    }

    const questionData: CreateQuestionData = {
      question_type: questionType,
      question_text: questionText.trim(),
      marks,
      explanation: explanation.trim() || undefined,
      options: (questionType === 'mcq' || questionType === 'true_false') ? options : undefined,
    }

    onSave(questionData)
  }

  // Auto-setup for True/False
  const handleQuestionTypeChange = (type: QuestionType) => {
    setQuestionType(type)
    
    if (type === 'true_false') {
      setOptions([
        { option_text: 'True', is_correct: false },
        { option_text: 'False', is_correct: false },
      ])
    } else if (type === 'mcq' && options.length < 2) {
      setOptions([
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
      ])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Type */}
          <div>
            <Label htmlFor="questionType">Question Type *</Label>
            <Select value={questionType} onValueChange={(value) => handleQuestionTypeChange(value as QuestionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="essay">Essay/Written Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question Text */}
          <div>
            <Label htmlFor="questionText">Question *</Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              rows={4}
              required
            />
          </div>

          {/* Marks */}
          <div>
            <Label htmlFor="marks">Marks *</Label>
            <Input
              id="marks"
              type="number"
              value={marks}
              onChange={(e) => setMarks(parseFloat(e.target.value))}
              min="0.5"
              step="0.5"
              required
              className="max-w-xs"
            />
          </div>

          {/* Options for MCQ */}
          {questionType === 'mcq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Answer Options *</Label>
                <Button
                  type="button"
                  onClick={handleAddOption}
                  variant="outline"
                  size="sm"
                  disabled={options.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>

              {options.map((option, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center pt-2">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0">Option {String.fromCharCode(65 + index)}</Badge>
                      <Input
                        value={option.option_text}
                        onChange={(e) => handleUpdateOption(index, 'option_text', e.target.value)}
                        placeholder={`Enter option ${String.fromCharCode(65 + index)}...`}
                        required
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={option.is_correct}
                        onChange={(e) => handleUpdateOption(index, 'is_correct', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label className="text-sm">Mark as correct answer</Label>
                    </div>
                  </div>

                  {options.length > 2 && (
                    <Button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      variant="ghost"
                      size="sm"
                      className="text-error hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <p className="text-sm text-text-gray">
                ℹ️ Check the box next to the correct answer(s). You can have multiple correct answers.
              </p>
            </div>
          )}

          {/* Options for True/False */}
          {questionType === 'true_false' && (
            <div className="space-y-4">
              <Label>Correct Answer *</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
                  <input
                    type="radio"
                    name="trueFalseAnswer"
                    checked={option.is_correct}
                    onChange={() => {
                      const newOptions = options.map((opt, i) => ({
                        ...opt,
                        is_correct: i === index,
                      }))
                      setOptions(newOptions)
                    }}
                    className="h-4 w-4"
                  />
                  <Label className="flex-1">{option.option_text}</Label>
                </div>
              ))}
            </div>
          )}

          {/* Essay Question Info */}
          {questionType === 'essay' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ Essay questions require manual grading by the lecturer. Students will have a text area to type their answer.
              </p>
            </div>
          )}

          {/* Explanation */}
          <div>
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide an explanation for the correct answer..."
              rows={3}
            />
            <p className="text-sm text-gray-600 mt-1">
              This will be shown to students after they submit the test (if review is enabled).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              Save Question
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}