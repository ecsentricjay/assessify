'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: string;
}

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    // Timer
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function loadSession() {
    try {
      setLoading(true);
      
      // Get session data from localStorage (set by config page)
      const sessionData = localStorage.getItem(`practice_session_${sessionId}`);
      
      if (!sessionData) {
        toast.error('Session not found');
        router.push('/student/cbt/courses');
        return;
      }

      const { questions: sessionQuestions } = JSON.parse(sessionData);
      setQuestions(sessionQuestions);
      
      console.log('[PracticeSession] Loaded', sessionQuestions.length, 'questions');
      
    } catch (error) {
      console.error('[loadSession]', error);
      toast.error('Failed to load session');
      router.push('/student/cbt/courses');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswerSelect(answer: 'A' | 'B' | 'C' | 'D') {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Save answer locally
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    // Submit answer to backend
    try {
      const response = await fetch('/api/cbt/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          selectedAnswer: answer,
        }),
      });

      if (!response.ok) {
        console.error('[handleAnswerSelect] Failed to save answer');
      }
    } catch (error) {
      console.error('[handleAnswerSelect] Error:', error);
      // Don't show error to user - answer is saved locally
    }
  }

  function handleNext() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }

  async function handleComplete() {
    const unansweredCount = questions.length - Object.keys(selectedAnswers).length;
    
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to complete?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    
    try {
      console.log('[handleComplete] Completing session:', sessionId);
      
      // Complete the session via API
      const response = await fetch('/api/cbt/complete-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('[handleComplete] ✅ Session completed successfully');
        toast.success('Practice session completed!');
        
        // Clear session data
        localStorage.removeItem(`practice_session_${sessionId}`);
        
        // ✅ Navigate to results page
        router.push(`/student/cbt/practice/results/${sessionId}`);
      } else {
        console.error('[handleComplete] ❌ Error:', result.error);
        toast.error(result.error || 'Failed to complete session');
      }
      
    } catch (error) {
      console.error('[handleComplete] Exception:', error);
      toast.error('An error occurred while completing the session');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading practice session...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-500">No questions available</p>
          <Button onClick={() => router.push('/student/cbt/courses')} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;
  const selectedAnswer = selectedAnswers[currentQuestion.id];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Practice Session</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeElapsed)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {answeredCount} / {questions.length} answered
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">
                Question {currentQuestion.questionNumber}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {currentQuestion.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <p className="text-lg font-medium text-gray-900">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionKey = `option${option}` as keyof Question;
                const optionText = currentQuestion[optionKey] as string;
                const isSelected = selectedAnswer === option;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option as 'A' | 'B' | 'C' | 'D')}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{option}.</span>{' '}
                        <span className="text-gray-700">{optionText}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2 overflow-x-auto">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all shrink-0 ${
                  index === currentQuestionIndex
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : selectedAnswers[questions[index].id]
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={submitting}
              className="min-w-32"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Complete Test'
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>

        {/* Status Card */}
        <Card className="mt-6 bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{answeredCount}</p>
                <p className="text-xs text-gray-600">Answered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {questions.length - answeredCount}
                </p>
                <p className="text-xs text-gray-600">Remaining</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatTime(timeElapsed)}</p>
                <p className="text-xs text-gray-600">Time Elapsed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}