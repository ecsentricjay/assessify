// components/test/timer.tsx
'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TimerProps {
  startTime: Date
  durationMinutes: number
  onTimeUp: () => void
}

export function Timer({ startTime, durationMinutes, onTimeUp }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [hasWarned, setHasWarned] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000) // seconds
      const totalSeconds = durationMinutes * 60
      const remaining = totalSeconds - elapsed

      return Math.max(0, remaining)
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      // Show warning at 5 minutes
      if (remaining <= 300 && remaining > 0 && !hasWarned) {
        setHasWarned(true)
        alert('⏰ Warning: Only 5 minutes remaining!')
      }

      // Time's up
      if (remaining === 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, durationMinutes, onTimeUp, hasWarned])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const isLowTime = timeLeft <= 300 // 5 minutes or less
  const isCritical = timeLeft <= 60 // 1 minute or less

  return (
    <div className={`sticky top-0 z-50 px-4 py-3 shadow-md ${
      isCritical ? 'bg-red-600' : isLowTime ? 'bg-orange-500' : 'bg-blue-600'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-white" />
          <div>
            <p className="text-xs text-white/80">Time Remaining</p>
            <p className={`text-2xl font-bold text-white ${isCritical ? 'animate-pulse' : ''}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        {isLowTime && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-white animate-pulse" />
            <span className="text-sm font-semibold text-white">
              {isCritical ? 'Time almost up!' : 'Low time warning'}
            </span>
          </div>
        )}

        {timeLeft === 0 && (
          <Badge variant="destructive" className="text-sm">
            Time&apos;s Up - Submitting...
          </Badge>
        )}
      </div>
    </div>
  )
}