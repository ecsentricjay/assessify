'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createQuestion, getTopicsByCourse } from '@/lib/actions/admin-cbt-courses.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [formData, setFormData] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
    solution: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    topicId: '',
  });

  useEffect(() => {
    loadTopics();
  }, [courseId]);

  async function loadTopics() {
    try {
      const res = await getTopicsByCourse(courseId);
      if (res.success && res.topics) {
        setTopics(res.topics as Topic[]);
        if (res.topics.length > 0) {
          setFormData((prev) => ({ ...prev, topicId: res.topics[0].id }));
        }
      }
    } catch (error) {
      console.error('[loadTopics]', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.questionText ||
      !formData.optionA ||
      !formData.optionB ||
      !formData.optionC ||
      !formData.optionD
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const res = await createQuestion({
      courseId,
      topicId: formData.topicId || undefined,
      questionText: formData.questionText,
      optionA: formData.optionA,
      optionB: formData.optionB,
      optionC: formData.optionC,
      optionD: formData.optionD,
      correctAnswer: formData.correctAnswer,
      solution: formData.solution || undefined,
      difficulty: formData.difficulty,
    });

    if (res.success) {
      toast.success('Question created successfully!');
      router.push(`/admin/cbt/courses/${courseId}/questions`);
    } else {
      toast.error(res.error || 'Failed to create question');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link
              href={`/admin/cbt/courses/${courseId}/questions`}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Questions
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create Question</h1>
          <p className="text-gray-600 mt-1">Add a new practice question to this course</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Question Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Question Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Text */}
              <div>
                <Label htmlFor="questionText" className="text-base font-medium">
                  Question Text *
                </Label>
                <Textarea
                  id="questionText"
                  placeholder="Enter the full question text..."
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  rows={3}
                  required
                  className="mt-2"
                />
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">Answer Options *</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => (
                    <div key={option}>
                      <Label htmlFor={`option${option}`} className="text-sm font-medium">
                        Option {option}
                      </Label>
                      <Input
                        id={`option${option}`}
                        placeholder={`Enter option ${option}...`}
                        value={formData[`option${option.toLowerCase()}` as keyof typeof formData] as string}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [`option${option.toLowerCase()}`]: e.target.value,
                          })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer & Difficulty */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="correctAnswer" className="text-base font-medium">
                    Correct Answer *
                  </Label>
                  <select
                    id="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: e.target.value as any })
                    }
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="difficulty" className="text-base font-medium">
                    Difficulty Level *
                  </Label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value as any })
                    }
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Topic & Solution */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="topicId" className="text-base font-medium">
                    Topic
                  </Label>
                  <select
                    id="topicId"
                    value={formData.topicId}
                    onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- No Topic --</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Optional</p>
                </div>
              </div>

              {/* Solution */}
              <div>
                <Label htmlFor="solution" className="text-base font-medium">
                  Solution/Explanation
                </Label>
                <Textarea
                  id="solution"
                  placeholder="Optional: Explain why the correct answer is right..."
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  rows={3}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-2">Question:</p>
                <p className="text-gray-700">{formData.questionText || '(No question entered yet)'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['A', 'B', 'C', 'D'] as const).map((option) => (
                  <div
                    key={option}
                    className={`p-2 rounded text-sm ${
                      formData.correctAnswer === option
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    <strong>{option}:</strong> {formData[`option${option.toLowerCase()}` as keyof typeof formData] || '(empty)'}
                  </div>
                ))}
              </div>

              <div className="flex gap-4 text-xs">
                <span className="bg-white px-2 py-1 rounded">
                  <strong>Difficulty:</strong> {formData.difficulty}
                </span>
                <span className="bg-white px-2 py-1 rounded">
                  <strong>Correct:</strong> {formData.correctAnswer}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Question'}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href={`/admin/cbt/courses/${courseId}/questions`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
