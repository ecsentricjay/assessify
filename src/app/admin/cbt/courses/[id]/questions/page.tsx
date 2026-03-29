'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import Link from 'next/link';
import { getQuestionsByCourse, deleteQuestion, toggleQuestionStatus } from '@/lib/actions/admin-cbt-courses.actions';
import { getCourseById } from '@/lib/actions/admin-cbt-courses.actions';
import { toast } from 'sonner';

interface Course {
  id: string;
  course_code: string;
  course_title: string;
  description: string;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  is_active: boolean;
  times_attempted?: number;
  times_correct?: number;
}

export default function CourseQuestionsPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadCourseAndQuestions();
  }, [courseId]);

  useEffect(() => {
    let filtered = questions;

    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((q) =>
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQuestions(filtered);
  }, [searchTerm, difficultyFilter, questions]);

  async function loadCourseAndQuestions() {
    try {
      setLoading(true);
      const [courseRes, questionsRes] = await Promise.all([
        getCourseById(courseId),
        getQuestionsByCourse(courseId),
      ]);

      if (courseRes.success && courseRes.course) {
        setCourse(courseRes.course as Course);
      }

      if (questionsRes.success && questionsRes.questions) {
        setQuestions(questionsRes.questions as Question[]);
      }
    } catch (error) {
      console.error('[loadCourseAndQuestions]', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(questionId: string) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      setDeleting(questionId);
      const res = await deleteQuestion(questionId);
      if (res.success) {
        setQuestions(questions.filter((q) => q.id !== questionId));
        toast.success('Question deleted successfully');
      } else {
        toast.error(res.error || 'Failed to delete question');
      }
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleStatus(questionId: string) {
    try {
      const res = await toggleQuestionStatus(questionId);
      if (res.success) {
        setQuestions(
          questions.map((q) => (q.id === questionId ? { ...q, is_active: !q.is_active } : q))
        );
        toast.success('Question status updated');
      } else {
        toast.error(res.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('[handleToggleStatus]', error);
      toast.error('Failed to update status');
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCorrectAnswerBadge = (answer: string) => {
    const colors: Record<string, string> = {
      A: 'bg-blue-100 text-blue-700',
      B: 'bg-purple-100 text-purple-700',
      C: 'bg-pink-100 text-pink-700',
      D: 'bg-indigo-100 text-indigo-700',
    };
    return colors[answer] || 'bg-gray-100 text-gray-700';
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-600 mb-2">{course?.course_code}</div>
            <h1 className="text-3xl font-bold text-gray-900">{course?.course_title}</h1>
            <p className="text-gray-600 mt-1">{course?.description}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/admin/cbt/courses/${courseId}/questions/create`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/cbt/courses/${courseId}/questions/bulk-upload`}>
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Search</label>
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Difficulty</label>
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{questions.length === 0 ? 'No questions yet' : 'No matching questions'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">
                          Question {index + 1}
                        </div>
                        <p className="text-gray-900 font-medium">{question.question_text}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCorrectAnswerBadge(question.correct_answer)}`}>
                          {question.correct_answer}
                        </span>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      <div className="text-gray-700">A: {question.option_a}</div>
                      <div className="text-gray-700">B: {question.option_b}</div>
                      <div className="text-gray-700">C: {question.option_c}</div>
                      <div className="text-gray-700">D: {question.option_d}</div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {question.times_attempted !== undefined && (
                          <>
                            <span>{question.times_attempted} attempts</span>
                            {question.times_correct !== undefined && (
                              <span>
                                {' '}
                                • {Math.round((question.times_correct / (question.times_attempted || 1)) * 100)}% correct
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(question.id)}
                          className="text-sm p-1"
                          title={question.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {question.is_active ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/cbt/courses/${courseId}/questions/${question.id}/edit`}>
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(question.id)}
                          disabled={deleting === question.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
