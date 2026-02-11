// app/student/tests/access/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Key, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'

export default function TestAccessPage() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')

  const handleAccessTest = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const code = accessCode.trim().toUpperCase()
    
    if (!code) {
      setError('Please enter an access code')
      return
    }

    if (code.length !== 8) {
      setError('Access code must be 8 characters')
      return
    }

    // Navigate to test
    router.push(`/tests/${code}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/student/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Access Test</h1>
              <p className="text-sm text-gray-600">Enter your test access code to begin</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Enter Test Access Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccessTest} className="space-y-4">
                  <div>
                    <Label htmlFor="accessCode">8-Character Access Code</Label>
                    <Input
                      id="accessCode"
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="e.g., ABC12345"
                      maxLength={8}
                      className="text-2xl font-bold tracking-wider text-center uppercase"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Enter the 8-character code provided by your lecturer
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg">
                    Access Test
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Alternative Options */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Other Ways to Access Tests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/student/courses">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">📚</span>
                        </div>
                        <h4 className="font-semibold mb-1">Course Tests</h4>
                        <p className="text-sm text-gray-600">View tests from your enrolled courses</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/student/tests">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">📝</span>
                        </div>
                        <h4 className="font-semibold mb-1">My Tests</h4>
                        <p className="text-sm text-gray-600">View all your test attempts</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Information Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Where to Find Your Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700 space-y-2">
                <p>Your lecturer will provide you with:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>An 8-character access code</li>
                  <li>OR a direct link to the test</li>
                </ul>
                <p className="pt-2">
                  The code is usually shared via email, WhatsApp, or displayed in class.
                </p>
              </CardContent>
            </Card>

            {/* Using Links Card */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm">Using a Link Instead?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700">
                <p>
                  If your lecturer shared a direct link, just click it! You&apos;ll be taken straight to the test without needing to enter a code.
                </p>
              </CardContent>
            </Card>

            {/* Recent Access History (placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Test Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No recent test access</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}