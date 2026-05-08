'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StudyAidHeader from '@/components/study-aid/StudyAidHeader'
import { Download, ArrowLeft, CheckCircle, BookOpen, Sparkles } from 'lucide-react'

interface MCQQuestion {
  id: number
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correct_answer: string
  explanation: string
}

interface TheorySubQuestion {
  label: string
  question: string
  expected_answer: string
}

interface TheoryQuestion {
  id: number
  question: string
  sub_questions: TheorySubQuestion[]
}

export default function AttemptViewPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.id as string

  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState<any>(null)

  useEffect(() => {
    loadAttempt()
  }, [attemptId])

  async function loadAttempt() {
    try {
      const response = await fetch(`/api/study-aid/attempts/${attemptId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load attempt')
      }

      const data = await response.json()

      if (data.success) {
        setAttempt(data.attempt)
      } else {
        alert(data.error || 'Failed to load attempt')
        router.push('/student/study-aid')
      }
    } catch (error) {
      console.error('Load attempt error:', error)
      alert('Failed to load attempt')
      router.push('/student/study-aid')
    } finally {
      setLoading(false)
    }
  }

  function downloadPDF() {
    // TODO: Implement PDF generation
    alert('PDF download coming soon!')
  }

  if (loading) {
    return (
      <>
        <StudyAidHeader />
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-gradient-to-br from-[#2E3192] via-[#3F51B5] to-[#2E3192]">
          <div className="text-white text-2xl animate-pulse">Loading questions...</div>
        </div>
      </>
    )
  }

  if (!attempt || !attempt.generated_questions) {
    return (
      <>
        <StudyAidHeader />
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-gradient-to-br from-[#2E3192] via-[#3F51B5] to-[#2E3192]">
          <div className="text-center text-white">
            <p className="text-2xl mb-4">No questions found</p>
            <button
              onClick={() => router.push('/student/study-aid')}
              className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    )
  }

  const questions = attempt.generated_questions?.questions || attempt.generated_questions || []
  const isMCQ = attempt.question_format === 'mcq'

  return (
    <>
      <StudyAidHeader />
      <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-[#2E3192] via-[#3F51B5] to-[#2E3192] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#4FC3F7] rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#2EC4B6] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <button
              onClick={() => router.push('/student/study-aid')}
              className="flex items-center gap-2 text-purple-200 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Upload
            </button>

            <button
              onClick={downloadPDF}
              className="px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-white font-semibold hover:bg-white/20 transition flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>

          {/* Course Info Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {attempt.course_code} {attempt.course_title && `- ${attempt.course_title}`}
            </h1>
            {attempt.topic && (
              <p className="text-2xl text-purple-200 mb-4 font-semibold">
                Topic: {attempt.topic}
              </p>
            )}
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`px-4 py-2 rounded-full font-bold text-sm ${
                isMCQ 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-pink-100 text-pink-700'
              }`}>
                {isMCQ ? 'Multiple Choice' : 'Theory'}
              </span>
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold text-sm">
                {questions.length} Questions
              </span>
              {attempt.is_free && (
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm">
                  Free Attempt
                </span>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((question: MCQQuestion | TheoryQuestion, index: number) => (
            <div
              key={question.id || index}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:border-purple-400 transition"
            >
              {/* Question Number */}
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                  Question {index + 1}
                </span>
                {isMCQ && (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                    MCQ
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h3 className="text-xl font-semibold text-white mb-6">
                {question.question}
              </h3>

              {/* MCQ Options */}
              {isMCQ && 'options' in question && (
                <>
                  <div className="space-y-3 mb-6">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div
                        key={key}
                        className={`p-4 rounded-xl border-2 ${
                          key === question.correct_answer
                            ? 'bg-green-900/30 border-green-400 text-white'
                            : 'bg-white/5 border-white/20 text-purple-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-lg">{key}.</span>
                          <span className="flex-1">{value}</span>
                          {key === question.correct_answer && (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div className="bg-green-900/20 border border-green-400/50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-green-400" />
                      <h4 className="text-green-300 font-bold">Explanation:</h4>
                    </div>
                    <p className="text-white leading-relaxed">{question.explanation}</p>
                  </div>
                </>
              )}

              {/* Theory Sub-questions */}
              {!isMCQ && 'sub_questions' in question && (
                <div className="space-y-6">
                  {question.sub_questions.map((sub, subIndex) => (
                    <div key={subIndex} className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="bg-pink-600 text-white px-3 py-1 rounded-lg font-bold">
                          {sub.label}
                        </span>
                        <p className="flex-1 text-white font-semibold text-lg">
                          {sub.question}
                        </p>
                      </div>

                      <div className="bg-pink-900/20 border border-pink-400/50 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-5 h-5 text-pink-400" />
                          <h5 className="text-pink-300 font-bold">Expected Answer:</h5>
                        </div>
                        <p className="text-white leading-relaxed">{sub.expected_answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <button
              onClick={() => router.push('/student/study-aid')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white text-lg font-bold hover:scale-105 transition"
            >
              Generate More Questions
            </button>
          </div>
        </div>
      </div>
    </>
  )
}