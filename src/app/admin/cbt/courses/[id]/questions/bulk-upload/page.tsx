'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { bulkUploadQuestions, getCourseById, getTopicsByCourse } from '@/lib/actions/admin-cbt-courses.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Download, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Course {
  id: string;
  course_code: string;
  course_title: string;
  description: string;
}

interface ParsedQuestion {
  topicName?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rowNumber: number;
  errors: string[];
}

const CSV_TEMPLATE = `Topic Name,Question Text,Option A,Option B,Option C,Option D,Correct Answer,Difficulty,Solution
Physics,What is Newton's first law?,An object remains at rest,No object exists,Energy is conserved,Forces always balance,A,easy,An object at rest stays at rest unless acted upon
Physics,What is the SI unit of force?,Newton,Joule,Watt,Pascal,A,medium,Force is measured in Newtons (N)
Chemistry,What is the atomic number of Carbon?,6,8,12,4,A,easy,Carbon has 6 protons
Chemistry,What is photosynthesis?,Respiration process,Plant process using sunlight,Decomposition of organic matter,Fermentation,B,hard,Photosynthesis converts light energy to chemical energy`;

export default function BulkUploadQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [uploadResult, setUploadResult] = useState<
    | { imported: number; failed: number; errors: string[] }
    | { success: boolean; error: string }
    | null
  >(null);

  useEffect(() => {
    loadCourseAndTopics();
  }, [courseId]);

  async function loadCourseAndTopics() {
    try {
      setLoading(true);
      const [courseRes, topicsRes] = await Promise.all([
        getCourseById(courseId),
        getTopicsByCourse(courseId),
      ]);

      if (courseRes.success && courseRes.course) {
        setCourse(courseRes.course as Course);
      }

      if (topicsRes.success && topicsRes.topics) {
        setTopics(topicsRes.topics);
      }
    } catch (error) {
      console.error('[loadCourseAndTopics]', error);
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(CSV_TEMPLATE));
    element.setAttribute('download', 'questions-template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Template downloaded successfully');
  }

  function parseCSV(content: string): ParsedQuestion[] {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      toast.error('CSV file is empty or has only headers');
      return [];
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredColumns = ['question text', 'option a', 'option b', 'option c', 'option d', 'correct answer', 'difficulty'];
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
      return [];
    }

    const colIndex = {
      topicName: headers.indexOf('topic name'),
      questionText: headers.indexOf('question text'),
      optionA: headers.indexOf('option a'),
      optionB: headers.indexOf('option b'),
      optionC: headers.indexOf('option c'),
      optionD: headers.indexOf('option d'),
      correctAnswer: headers.indexOf('correct answer'),
      difficulty: headers.indexOf('difficulty'),
      solution: headers.indexOf('solution'),
    };

    const parsed: ParsedQuestion[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.some((v) => v) === false) continue; // Skip empty rows
      
      const errors: string[] = [];
      const questionText = values[colIndex.questionText] || '';
      const optionA = values[colIndex.optionA] || '';
      const optionB = values[colIndex.optionB] || '';
      const optionC = values[colIndex.optionC] || '';
      const optionD = values[colIndex.optionD] || '';
      const correctAnswerRaw = values[colIndex.correctAnswer]?.toUpperCase() || '';
      const difficulty = (values[colIndex.difficulty] || '').toLowerCase();
      const solution = colIndex.solution >= 0 ? values[colIndex.solution] : undefined;
      const topicName = colIndex.topicName >= 0 ? values[colIndex.topicName] : undefined;

      // Validation
      if (!questionText) errors.push('Missing question text');
      if (!optionA) errors.push('Missing option A');
      if (!optionB) errors.push('Missing option B');
      if (!optionC) errors.push('Missing option C');
      if (!optionD) errors.push('Missing option D');
      if (!['A', 'B', 'C', 'D'].includes(correctAnswerRaw)) {
        errors.push(`Invalid correct answer: "${correctAnswerRaw}" (must be A, B, C, or D)`);
      }
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        errors.push(`Invalid difficulty: "${difficulty}" (must be easy, medium, or hard)`);
      }
      if (questionText.length > 1000) errors.push('Question text is too long (max 1000 characters)');
      if ([optionA, optionB, optionC, optionD].some((opt) => opt.length > 500)) {
        errors.push('One or more options are too long (max 500 characters each)');
      }

      parsed.push({
        topicName: topicName || undefined,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer: correctAnswerRaw as 'A' | 'B' | 'C' | 'D',
        solution: solution || undefined,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        rowNumber: i + 1,
        errors,
      });
    }

    return parsed;
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      const parsed = parseCSV(content);
      setParsedQuestions(parsed);
      setUploadResult(null);
    };
    reader.readAsText(file);
  }

  function handlePasteCSV() {
    const content = prompt('Paste CSV content here:');
    if (content) {
      setCsvContent(content);
      const parsed = parseCSV(content);
      setParsedQuestions(parsed);
      setUploadResult(null);
    }
  }

  async function handleImport() {
    const validQuestions = parsedQuestions.filter((q) => q.errors.length === 0);

    if (validQuestions.length === 0) {
      toast.error('No valid questions to import. Fix errors first.');
      return;
    }

    setUploading(true);
    try {
      const result = await bulkUploadQuestions(
        courseId,
        validQuestions.map((q) => ({
          topicName: q.topicName,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          solution: q.solution,
          difficulty: q.difficulty,
        }))
      );

      setUploadResult(result);

      if ('imported' in result && result.imported !== undefined) {
        if (result.imported > 0) {
          toast.success(`${result.imported} questions imported successfully!`);
          setTimeout(() => {
            router.push(`/admin/cbt/courses/${courseId}/questions`);
          }, 2000);
        }

        if (result.errors && result.errors.length > 0) {
          toast.error(`${result.failed} questions failed to import`);
        }
      } else if ('error' in result) {
        toast.error(result.error || 'Failed to import questions');
      }
    } catch (error) {
      console.error('[handleImport]', error);
      toast.error('Failed to import questions');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-500">
            <p>Course not found</p>
            <Button asChild className="mt-4">
              <Link href="/admin/cbt/courses">Back to Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalQuestions = parsedQuestions.length;
  const validQuestions = parsedQuestions.filter((q) => q.errors.length === 0).length;
  const invalidQuestions = totalQuestions - validQuestions;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/admin/cbt/courses/${courseId}/questions`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Upload Questions</h1>
            <p className="text-gray-600 mt-1">
              {course.course_code} • {course.course_title}
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instructions */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <p className="font-medium mb-2">CSV Format Requirements:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Headers (case-insensitive): Topic Name (optional), Question Text, Option A-D, Correct Answer, Difficulty, Solution (optional)</li>  
                  <li>• Correct Answer values: A, B, C, or D</li>
                  <li>• Difficulty values: easy, medium, or hard</li>
                  <li>• Maximum 1000 characters per question, 500 per option</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* File Upload Options */}
            <div className="space-y-3">
              <Label htmlFor="csv-file" className="text-base font-medium">
                Choose File or Paste CSV
              </Label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                </div>
                <Button variant="outline" onClick={handlePasteCSV}>
                  Paste CSV
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>
            </div>

            {/* CSV Preview */}
            {csvContent && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">CSV Preview</Label>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 max-h-32 overflow-auto font-mono text-sm">
                  {csvContent.slice(0, 500)}
                  {csvContent.length > 500 && '...'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parsing Results & Preview */}
        {parsedQuestions.length > 0 && (
          <>
            {/* Summary Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{totalQuestions}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{validQuestions}</div>
                    <div className="text-sm text-gray-600">Valid</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${invalidQuestions > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {invalidQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview & Validation ({parsedQuestions.length} questions)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {parsedQuestions.map((question) => (
                  <div
                    key={`q-${question.rowNumber}`}
                    className={`border rounded-lg p-4 ${
                      question.errors.length > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    {/* Status & Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {question.errors.length > 0 ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          Row {question.rowNumber}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {question.topicName && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                            {question.topicName}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                          {question.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Question & Options */}
                    <p className="font-medium text-gray-900 mb-2">{question.questionText}</p>
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div className="text-gray-700">
                        <span className="font-medium">A:</span> {question.optionA}
                      </div>
                      <div className="text-gray-700">
                        <span className="font-medium">B:</span> {question.optionB}
                      </div>
                      <div className="text-gray-700">
                        <span className="font-medium">C:</span> {question.optionC}
                      </div>
                      <div className="text-gray-700">
                        <span className="font-medium">D:</span> {question.optionD}
                      </div>
                    </div>

                    {/* Correct Answer */}
                    <div className="mb-3 text-sm">
                      <span className="font-medium text-gray-700">Correct Answer: </span>
                      <span className="font-bold text-blue-600">{question.correctAnswer}</span>
                    </div>

                    {/* Solution */}
                    {question.solution && (
                      <div className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">Solution: </span>
                        {question.solution}
                      </div>
                    )}

                    {/* Errors */}
                    {question.errors.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {question.errors.map((error, idx) => (
                          <div key={idx} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Import Results */}
            {uploadResult && (
              <Alert className={('imported' in uploadResult && uploadResult.imported > 0) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                <CheckCircle className={`h-4 w-4 ${('imported' in uploadResult && uploadResult.imported > 0) ? 'text-green-600' : 'text-red-600'}`} />
                <AlertDescription className={('imported' in uploadResult && uploadResult.imported > 0) ? 'text-green-900' : 'text-red-900'}>
                  {'imported' in uploadResult ? (
                    <>
                      <p className="font-medium mb-2">
                        Import Result: {uploadResult.imported} imported, {uploadResult.failed} failed
                      </p>
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <ul className="text-sm space-y-1 ml-4">
                          {uploadResult.errors.slice(0, 5).map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                          {uploadResult.errors.length > 5 && (
                            <li>... and {uploadResult.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className="font-medium">Error: {uploadResult.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button asChild variant="outline">
                <Link href={`/admin/cbt/courses/${courseId}/questions`}>
                  Cancel
                </Link>
              </Button>
              <Button
                onClick={handleImport}
                disabled={validQuestions === 0 || uploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Importing...' : `Import ${validQuestions} Questions`}
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
        {parsedQuestions.length === 0 && csvContent === '' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Upload a CSV file to get started</p>
                <p className="text-gray-400 text-xs mt-2">Download the template for the correct format</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
