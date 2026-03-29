// Save as: src/components/grading/document-viewer.tsx
// In-app PDF viewer using PDF.js from CDN

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import mammoth from 'mammoth/mammoth.browser'
import Image from 'next/image'

interface DocumentViewerProps {
  fileUrls: string[]
  currentFileIndex?: number
  onFileChange?: (index: number) => void
}

export default function DocumentViewer({ 
  fileUrls, 
  currentFileIndex = 0,
  onFileChange 
}: DocumentViewerProps) {
  const [activeFileIndex, setActiveFileIndex] = useState(currentFileIndex)
  const [fileType, setFileType] = useState<'pdf' | 'docx' | 'image' | 'unsupported'>('unsupported')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docxHtml, setDocxHtml] = useState<string>('')
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string>('')

  const currentFileUrl = fileUrls[activeFileIndex]

  const loadDocxFile = useCallback(async (url: string) => {
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      
      const result = await mammoth.convertToHtml({ arrayBuffer })
      setDocxHtml(result.value)
      setLoading(false)
    } catch (err) {
      console.error('Error loading DOCX:', err)
      setError('Failed to load document. Please download to view.')
      setLoading(false)
    }
  }, [])

  const detectFileType = useCallback((url: string) => {
    setLoading(true)
    setError(null)
    setDocxHtml('')
    setPdfViewerUrl('')

    const fileName = url.split('/').pop()?.toLowerCase() || ''
    
    if (fileName.endsWith('.pdf')) {
      setFileType('pdf')
      // Use Mozilla's PDF.js viewer hosted on CDN
      const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`
      setPdfViewerUrl(viewerUrl)
      setLoading(false)
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      setFileType('docx')
      loadDocxFile(url)
    } else if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      setFileType('image')
      setLoading(false)
    } else {
      setFileType('unsupported')
      setLoading(false)
    }
  }, [loadDocxFile])

  useEffect(() => {
    if (currentFileUrl) {
       
      const id = window.setTimeout(() => detectFileType(currentFileUrl), 0)
      return () => clearTimeout(id)
    }
  }, [currentFileUrl, detectFileType])

  const handleFileChange = (newIndex: number) => {
    setActiveFileIndex(newIndex)
    if (onFileChange) {
      onFileChange(newIndex)
    }
  }

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'Unknown file'
  }

  if (fileUrls.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600">No files submitted</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* File Navigation */}
      {fileUrls.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Submitted Files ({fileUrls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {fileUrls.map((url, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={activeFileIndex === index ? 'default' : 'outline'}
                  onClick={() => handleFileChange(index)}
                >
                  📄 File {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {getFileName(currentFileUrl)}
            </CardTitle>
            <a 
              href={currentFileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              download
            >
              <Button size="sm" variant="outline">
                📥 Download
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading document...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md text-center">
              <p className="mb-3">{error}</p>
              <a 
                href={currentFileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                download
              >
                <Button size="sm">Download File</Button>
              </a>
            </div>
          )}

          {/* PDF Viewer - Using PDF.js from CDN */}
          {!loading && !error && fileType === 'pdf' && (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                <iframe
                  src={pdfViewerUrl}
                  className="w-full border-0"
                  style={{ height: '800px', minHeight: '600px' }}
                  title="PDF Document Viewer"
                  allow="fullscreen"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-blue-900 mb-1">PDF Viewer Tips:</p>
                    <ul className="text-blue-800 space-y-1">
                      <li>• Use the toolbar controls to zoom in/out and navigate pages</li>
                      <li>• Scroll up/down to move between pages</li>
                      <li>• The viewer loads directly in the browser - no downloads needed</li>
                      <li>• Click download above if you need to save it locally</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCX Viewer */}
          {!loading && !error && fileType === 'docx' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 max-h-150 overflow-y-auto">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                />
              </div>
              <div className="text-center text-xs text-gray-500">
                <p>💡 Formatting has been converted from the original Word document</p>
              </div>
            </div>
          )}

          {/* Image Viewer */}
          {!loading && !error && fileType === 'image' && (
            <div className="bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              <TransformWrapper initialScale={1} minScale={0.5} maxScale={4}>
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="flex items-center justify-center gap-2 p-3 bg-gray-800">
                      <Button size="sm" onClick={() => zoomIn()} variant="secondary">
                        🔍 Zoom In
                      </Button>
                      <Button size="sm" onClick={() => zoomOut()} variant="secondary">
                        🔍 Zoom Out
                      </Button>
                      <Button size="sm" onClick={() => resetTransform()} variant="secondary">
                        🔄 Reset
                      </Button>
                    </div>
                    <TransformComponent
                      wrapperStyle={{
                        width: '100%',
                        height: '600px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f3f4f6'
                      }}
                    >
                      <Image
                        src={currentFileUrl}
                        alt="Submission"
                        width={800}
                        height={600}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        unoptimized
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
          )}

          {/* Unsupported File Type */}
          {!loading && !error && fileType === 'unsupported' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-md text-center">
              <div className="text-5xl mb-3">⚠️</div>
              <p className="font-medium mb-2">Unsupported file type</p>
              <p className="text-sm mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <a 
                href={currentFileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                download
              >
                <Button>Download to View</Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}