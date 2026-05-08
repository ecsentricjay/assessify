// TEMPORARY DEBUG FILE - Use this to find the exact issue
// Place this as: app/student/study-aid/purchase/debug/page.tsx

'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [results, setResults] = useState<any>({})

  useEffect(() => {
    testAPIs()
  }, [])

  async function testAPIs() {
    const tests = {
      walletBalance: { url: '/api/wallet/balance', method: 'GET' },
      studyAidCredits: { url: '/api/study-aid/credits', method: 'GET' },
      purchaseAPI: { url: '/api/study-aid/purchase-from-wallet', method: 'POST' },
    }

    const results: any = {}

    for (const [name, config] of Object.entries(tests)) {
      try {
        console.log(`Testing ${name}...`)
        
        const response = await fetch(config.url, {
          method: config.method,
          headers: { 'Content-Type': 'application/json' },
          body: config.method === 'POST' ? JSON.stringify({ test: true }) : undefined,
        })

        const contentType = response.headers.get('content-type')
        const isJson = contentType?.includes('application/json')
        
        let data
        if (isJson) {
          data = await response.json()
        } else {
          const text = await response.text()
          data = text.substring(0, 500) // First 500 chars
        }

        results[name] = {
          status: response.status,
          ok: response.ok,
          contentType,
          isJson,
          data,
        }
      } catch (error) {
        results[name] = {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }

    setResults(results)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Debug Results</h1>
      
      <div className="space-y-4">
        {Object.entries(results).map(([name, result]: [string, any]) => (
          <div key={name} className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">{name}</h2>
            
            {result.error ? (
              <div className="text-red-600">
                <p className="font-semibold">Error:</p>
                <pre className="bg-red-50 p-2 rounded overflow-auto">
                  {result.error}
                </pre>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={result.ok ? 'text-green-600' : 'text-red-600'}>
                    {result.status} {result.ok ? '✓' : '✗'}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Content-Type:</span> {result.contentType || 'N/A'}
                </p>
                <p>
                  <span className="font-semibold">Is JSON:</span>{' '}
                  <span className={result.isJson ? 'text-green-600' : 'text-red-600'}>
                    {result.isJson ? 'Yes ✓' : 'No ✗'}
                  </span>
                </p>
                <div>
                  <p className="font-semibold mb-1">Response:</p>
                  <pre className="bg-white p-3 rounded border overflow-auto max-h-64 text-xs">
                    {typeof result.data === 'string' 
                      ? result.data 
                      : JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg">
        <h3 className="font-bold mb-2">What to look for:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>All APIs should return status 200 or 401</li>
          <li>All APIs should have Content-Type: application/json</li>
          <li>If you see HTML (starts with &lt;!DOCTYPE), the route doesn't exist</li>
          <li>If status is 404, create the missing API route</li>
          <li>If status is 500, check server logs for errors</li>
        </ul>
      </div>
    </div>
  )
}