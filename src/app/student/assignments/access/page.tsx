// Save as: src/app/student/assignments/access/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function StudentAssignmentAccessPage() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const code = accessCode.trim().toUpperCase()

    if (code.length !== 8) {
      setError('Access code must be 8 characters')
      return
    }

    setLoading(true)

    // Navigate to the assignment page
    router.push(`/assignments/${code}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Access Assignment</h1>
              <p className="text-sm text-gray-600">Enter your assignment code</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline">← Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Card */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <CardTitle className="text-2xl">Enter Assignment Code</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Enter the 8-character code provided by your lecturer
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="accessCode" className="text-base">
                  Assignment Access Code
                </Label>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase())
                    setError(null)
                  }}
                  placeholder="e.g., AB12CD34"
                  maxLength={8}
                  className="text-center text-2xl font-mono tracking-wider h-16"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 text-center">
                  8 characters (letters and numbers)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm text-center">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-lg" 
                disabled={loading || accessCode.length !== 8}
              >
                {loading ? 'Accessing...' : 'Access Assignment'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <Link href="/student/assignments">
                <Button variant="outline" className="w-full">
                  📚 View My Course Assignments
                </Button>
              </Link>
              <Link href="/student/courses">
                <Button variant="outline" className="w-full">
                  🎓 View My Courses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl mb-2">💡</div>
                <h4 className="font-semibold text-sm mb-1">Where to find the code?</h4>
                <p className="text-xs text-gray-700">
                  Your lecturer will share the 8-character access code via WhatsApp, 
                  email, or in class. It looks like &quot;AB12CD34&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🔗</div>
                <h4 className="font-semibold text-sm mb-1">Have a link instead?</h4>
                <p className="text-xs text-gray-700">
                  If your lecturer shared a link, just click it directly. 
                  The code is included in the link.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Access (Future Enhancement) */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No recent assignments</p>
              <p className="text-xs mt-1">Assignments you access will appear here</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}