'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPracticeConfigOptions, startPracticeSession } from '@/lib/actions/student-cbt-practice.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ConfigOptions {
  courseTitle: string;
  totalQuestions: number;
  questionsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export default function PracticeConfigPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [config, setConfig] = useState<ConfigOptions | null>(null);
  const [formData, setFormData] = useState({
    questionCount: 10,
    difficulty: 'all' as 'all' | 'easy' | 'medium' | 'hard',
    timePerQuestion: 60,
  });

  useEffect(() => {
    loadConfig();
  }, [courseId]);

  async function loadConfig() {
    try {
      setLoading(true);
      const res = await getPracticeConfigOptions(courseId);
      
      if (res.success && res.config) {
        setConfig(res.config);
        // Set initial question count to min(10, available questions)
        setFormData((prev) => ({
          ...prev,
          questionCount: Math.min(10, res.config.totalQuestions),
        }));
      } else {
        toast.error(res.error || 'Failed to load practice options');
        router.push('/student/cbt/courses');
      }
    } catch (error) {
      console.error('[loadConfig]', error);
      toast.error('An error occurred');
      router.push('/student/cbt/courses');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartPractice() {
    if (!config) return;

    if (formData.questionCount < 1) {
      toast.error('Please select at least 1 question');
      return;
    }

    setStarting(true);
    try {
      console.log('[handleStartPractice] Starting with:', { courseId, questionCount: formData.questionCount });
      
      const res = await startPracticeSession({
        courseId,
        questionCount: formData.questionCount,
      });

      console.log('[handleStartPractice] Response:', res);

      if (!res) {
        toast.error('No response from server');
        return;
      }

      if (res.success && res.session) {
        console.log('[handleStartPractice] ✅ Session created:', res.session.id);
        
        // ✅ Store session data in localStorage for the practice page
        localStorage.setItem(
          `practice_session_${res.session.id}`,
          JSON.stringify(res.session)
        );
        
        toast.success('Practice session started!');
        router.push(`/student/cbt/practice/session/${res.session.id}`);
      } else {
        console.error('[handleStartPractice] ❌ Error:', res);
        toast.error(!res.success ? res.error : 'Failed to start practice session');
      }
    } catch (error) {
      console.error('[handleStartPractice] Exception:', error);
      toast.error('An error occurred while starting the session');
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading practice options...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/student/cbt/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
          <div className="text-center py-12 text-gray-500">
            <p>Unable to load practice configuration</p>
          </div>
        </div>
      </div>
    );
  }

  const maxQuestions = config.totalQuestions;
  const totalTime = formData.questionCount * formData.timePerQuestion;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/student/cbt/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Configure Your Practice Session</h1>
          <p className="text-gray-600 mt-2">{config.courseTitle}</p>
        </div>

        {/* Available Questions Info */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-600">Available Questions in Course</p>
              <p className="text-2xl font-bold text-blue-600">{config.totalQuestions}</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Easy: {config.questionsByDifficulty.easy}</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Medium: {config.questionsByDifficulty.medium}</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Hard: {config.questionsByDifficulty.hard}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Session Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Number of Questions */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-base font-medium">Number of Questions</Label>
                <span className="text-xs text-gray-500">({maxQuestions} available)</span>
              </div>
              <div className="flex gap-3 items-center">
                <Input
                  type="range"
                  min="1"
                  max={maxQuestions}
                  value={formData.questionCount}
                  onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="1"
                  max={maxQuestions}
                  value={formData.questionCount}
                  onChange={(e) => {
                    const val = Math.min(maxQuestions, Math.max(1, parseInt(e.target.value) || 1));
                    setFormData({ ...formData, questionCount: val });
                  }}
                  className="w-20 text-center"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                You will answer {formData.questionCount} question{formData.questionCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Difficulty Filter */}
            <div>
              <Label className="text-base font-medium mb-3 block">Difficulty Level (Optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormData({ ...formData, difficulty: 'all' })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.difficulty === 'all'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">All Levels</div>
                  <p className="text-xs text-gray-600 mt-1">Mix of all difficulties</p>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, difficulty: 'easy' })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.difficulty === 'easy'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={config.questionsByDifficulty.easy === 0}
                >
                  <div className="font-medium text-gray-900">Easy</div>
                  <p className="text-xs text-gray-600 mt-1">{config.questionsByDifficulty.easy} questions</p>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, difficulty: 'medium' })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.difficulty === 'medium'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={config.questionsByDifficulty.medium === 0}
                >
                  <div className="font-medium text-gray-900">Medium</div>
                  <p className="text-xs text-gray-600 mt-1">{config.questionsByDifficulty.medium} questions</p>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, difficulty: 'hard' })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.difficulty === 'hard'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={config.questionsByDifficulty.hard === 0}
                >
                  <div className="font-medium text-gray-900">Hard</div>
                  <p className="text-xs text-gray-600 mt-1">{config.questionsByDifficulty.hard} questions</p>
                </button>
              </div>
            </div>

            {/* Time Per Question */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-base font-medium">Time Per Question (seconds)</Label>
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full mb-2 left-0 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                    This helps you manage your time during the practice session
                  </div>
                </div>
              </div>
              <Input
                type="number"
                min="30"
                max="300"
                step="15"
                value={formData.timePerQuestion}
                onChange={(e) => setFormData({ ...formData, timePerQuestion: Math.max(30, parseInt(e.target.value) || 60) })}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-2">
                Estimated total time: <strong>{Math.floor(totalTime / 60)} min {totalTime % 60} sec</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="mb-6 bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Session Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Questions to answer:</span>
                <span className="font-medium text-gray-900">{formData.questionCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Difficulty level:</span>
                <span className="font-medium text-gray-900 capitalize">{formData.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time per question:</span>
                <span className="font-medium text-gray-900">{formData.timePerQuestion}s</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-gray-600 font-medium">Estimated total time:</span>
                <span className="font-bold text-blue-600">{Math.floor(totalTime / 60)}m {totalTime % 60}s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/student/cbt/courses">Cancel</Link>
          </Button>
          <Button
            onClick={handleStartPractice}
            disabled={starting}
            className="flex-1"
          >
            {starting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Session...
              </>
            ) : (
              `Start Practice (${formData.questionCount} Questions)`
            )}
          </Button>
        </div>

        {/* Tips */}
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-base text-green-900">💡 Tips for Better Performance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-800 space-y-2">
            <p>• Start with medium difficulty questions to build confidence</p>
            <p>• Set a time limit that allows you to think through questions</p>
            <p>• Practice regularly to improve your score over time</p>
            <p>• Review the solutions after each practice session</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}