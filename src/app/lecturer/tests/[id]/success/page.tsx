// app/lecturer/tests/[id]/success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Copy, Check, ExternalLink, Plus } from 'lucide-react'
import Link from 'next/link'

export default function TestSuccessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const testId = params.id as string
  const accessCode = searchParams.get('code')

  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const shareableLink = `${window.location.origin}/tests/${accessCode}`

  const copyCode = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Test Created Successfully!</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Created Successfully!</h2>
          <p className="text-gray-600">Your test has been created. Now add questions to complete the setup.</p>
        </div>

        {/* Access Code Card */}
        <Card className="mb-6 border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Test Access Code</span>
              <Badge className="bg-purple-600">Standalone</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Share this code with students:</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white p-4 rounded-lg border-2 border-purple-300">
                  <p className="text-3xl font-bold text-purple-700 text-center tracking-wider">
                    {accessCode}
                  </p>
                </div>
                <Button
                  onClick={copyCode}
                  variant={codeCopied ? 'default' : 'outline'}
                  className="h-14"
                >
                  {codeCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Or share this direct link:</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white p-3 rounded-lg border border-gray-300">
                  <p className="text-sm text-gray-700 truncate">{shareableLink}</p>
                </div>
                <Button
                  onClick={copyLink}
                  variant={linkCopied ? 'default' : 'outline'}
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Note */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-orange-900 mb-2">⚠️ Important: Add Questions</h3>
            <p className="text-sm text-orange-800">
              Your test has been created but has no questions yet. You need to add questions before publishing the test. 
              Students won&apos;t be able to access the test until it&apos;s published.
            </p>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">Add Questions</p>
                <p className="text-sm text-gray-600">Create questions manually or import from CSV</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Preview Test</p>
                <p className="text-sm text-gray-600">Review how students will see the test</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Publish Test</p>
                <p className="text-sm text-gray-600">Make the test available to students</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium">Share Access Code</p>
                <p className="text-sm text-gray-600">Give students the code or link to access the test</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/lecturer/tests/${testId}/questions/add`} className="flex-1">
            <Button className="w-full" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add Questions Now
            </Button>
          </Link>
          <Link href={`/lecturer/tests/${testId}`} className="flex-1">
            <Button variant="outline" className="w-full" size="lg">
              <ExternalLink className="mr-2 h-5 w-5" />
              View Test Details
            </Button>
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link href="/lecturer/tests/standalone">
            <Button variant="ghost">
              Back to Standalone Tests
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}