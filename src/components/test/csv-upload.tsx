// components/test/csv-upload.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileUp, Download, AlertCircle, CheckCircle, X } from 'lucide-react'
import { importQuestionsFromCSV } from '@/lib/actions/question.actions'
import type { CSVQuestionRow } from '@/lib/types/test.types'

interface CSVQuestionUploadProps {
  testId: string
  onSuccess: () => void
  onCancel: () => void
}

export function CSVQuestionUpload({ testId, onSuccess, onCancel }: CSVQuestionUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVQuestionRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['Please select a CSV file'])
      return
    }

    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const parseCSV = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setErrors(['CSV file is empty or has no data rows'])
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Validate required headers
      const requiredHeaders = ['question_text', 'question_type', 'marks', 'correct_answer']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        setErrors([`Missing required columns: ${missingHeaders.join(', ')}`])
        return
      }

      const questions: CSVQuestionRow[] = []
      const parseErrors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue

        const values = parseCSVLine(line)
        
        if (values.length < headers.length) {
          parseErrors.push(`Row ${i + 1}: Incomplete data`)
          continue
        }

        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || ''
        })

        // Validate question type
        if (!['mcq', 'true_false', 'essay'].includes(row.question_type)) {
          parseErrors.push(`Row ${i + 1}: Invalid question type "${row.question_type}". Use: mcq, true_false, or essay`)
          continue
        }

        // Validate marks
        const marks = parseFloat(row.marks)
        if (isNaN(marks) || marks <= 0) {
          parseErrors.push(`Row ${i + 1}: Invalid marks value`)
          continue
        }

        questions.push({
          question_text: row.question_text,
          question_type: row.question_type as 'mcq' | 'true_false' | 'essay',
          marks: marks,
          option_a: row.option_a || '',
          option_b: row.option_b || '',
          option_c: row.option_c || '',
          option_d: row.option_d || '',
          option_e: row.option_e || '',
          correct_answer: row.correct_answer,
          explanation: row.explanation || '',
        })
      }

      if (questions.length === 0) {
        setErrors(['No valid questions found in CSV'])
        return
      }

      setPreview(questions)
      setErrors(parseErrors)
    } catch (err) {
      console.error('Error parsing CSV:', err)
      setErrors(['Failed to parse CSV file. Please check the format.'])
    }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }

  const handleUpload = async () => {
    if (preview.length === 0) {
      setErrors(['No questions to upload'])
      return
    }

    try {
      setUploading(true)
      setErrors([])

      const result = await importQuestionsFromCSV(testId, preview)

      if (result.error) {
        setErrors([result.error])
        return
      }

      alert(`Successfully imported ${result.count} questions!`)
      onSuccess()
    } catch (err) {
      console.error('Error uploading questions:', err)
      setErrors(['Failed to upload questions'])
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `question_text,question_type,marks,option_a,option_b,option_c,option_d,option_e,correct_answer,explanation
"What is 2 + 2?",mcq,2,"2","3","4","5","","C","Addition of two numbers"
"The sky is blue",true_false,1,"","","","","","True","Observable fact about the sky"
"Explain photosynthesis",essay,5,"","","","","","","Process by which plants make food"`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Import Questions from CSV</CardTitle>
          <Button onClick={onCancel} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">CSV Format Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Required columns: question_text, question_type, marks, correct_answer</li>
            <li>Question types: mcq, true_false, essay</li>
            <li>For MCQ: Add option_a, option_b, option_c, option_d, option_e columns</li>
            <li>Correct answer: Use letters (A, B, C, etc.) for MCQ, &quot;True&quot;/&quot;False&quot; for true_false</li>
            <li>Optional: explanation column for answer explanations</li>
          </ul>
        </div>

        {/* Download Template */}
        <Button onClick={downloadTemplate} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>

        {/* File Upload */}
        <div>
          <label className="block">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                {file ? file.name : 'Click to select CSV file or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-error rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-error shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-error mb-1">Errors found:</p>
                <ul className="text-sm text-error space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-primary-dark">Preview ({preview.length} questions)</h4>
              <Badge variant="secondary" className="bg-green-100 text-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Valid
              </Badge>
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <div className="divide-y">
                {preview.slice(0, 5).map((question, index) => (
                  <div key={index} className="p-4 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {question.question_type === 'mcq' ? 'MCQ' : 
                             question.question_type === 'true_false' ? 'T/F' : 'Essay'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.marks} marks
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {question.question_text}
                        </p>
                        {question.question_type === 'mcq' && (
                          <div className="text-xs text-gray-600 space-y-1">
                            {question.option_a && <p>A. {question.option_a}</p>}
                            {question.option_b && <p>B. {question.option_b}</p>}
                            {question.option_c && <p>C. {question.option_c}</p>}
                            {question.option_d && <p>D. {question.option_d}</p>}
                            {question.option_e && <p>E. {question.option_e}</p>}
                            <p className="text-success font-medium mt-1">
                              ✓ Correct: {question.correct_answer}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {preview.length > 5 && (
                <div className="p-3 bg-gray-50 text-center text-sm text-gray-600">
                  + {preview.length - 5} more questions
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={preview.length === 0 || uploading || errors.length > 0}
            className="flex-1"
          >
            {uploading ? 'Uploading...' : `Import ${preview.length} Questions`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}