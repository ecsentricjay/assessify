// components/test/question-navigation.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle } from 'lucide-react'

interface QuestionNavigationProps {
  totalQuestions: number
  currentQuestion: number
  answeredQuestions: Set<number>
  onNavigate: (index: number) => void
}

export function QuestionNavigation({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onNavigate
}: QuestionNavigationProps) {
  return (
    <div className="sticky top-20 bg-white border rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-primary-dark mb-2">Question Navigation</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-text-gray">Answered: {answeredQuestions.size}</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-border-gray" />
            <span className="text-text-gray">Unanswered: {totalQuestions - answeredQuestions.size}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => i).map((index) => {
          const isAnswered = answeredQuestions.has(index)
          const isCurrent = index === currentQuestion

          return (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={`
                relative h-10 rounded-lg font-semibold text-sm transition-all
                ${isCurrent 
                  ? 'ring-2 ring-primary-blue ring-offset-2' 
                  : ''
                }
                ${isAnswered
                  ? 'bg-green-100 text-success hover:bg-green-200'
                  : 'bg-bg-light text-text-gray hover:bg-gray-200'
                }
              `}
            >
              {index + 1}
              {isAnswered && (
                <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-success bg-white rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border-gray">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-gray">Progress</span>
          <Badge variant="secondary">
            {answeredQuestions.size} / {totalQuestions}
          </Badge>
        </div>
        <div className="mt-2 w-full bg-border-gray rounded-full h-2">
          <div
            className="bg-success h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answeredQuestions.size / totalQuestions) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}