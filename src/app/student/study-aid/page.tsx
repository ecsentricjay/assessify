'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Tesseract from 'tesseract.js'
import StudyAidHeader from '@/components/study-aid/StudyAidHeader'
import { Upload, X, FileText, Loader2, Sparkles, Camera } from 'lucide-react'

export default function StudyAidUploadPage() {
  const router = useRouter()
  const [images, setImages] = useState<File[]>([])
  const [extractedTexts, setExtractedTexts] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  
  // Form fields
  const [courseCode, setCourseCode] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [questionFormat, setQuestionFormat] = useState<'mcq' | 'theory'>('mcq')

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/')
    )
    
    if (images.length + imageFiles.length > 15) {
      alert('Maximum 15 images allowed')
      return
    }
    
    setImages(prev => [...prev, ...imageFiles])
  }, [images])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 15,
  })

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setExtractedTexts(prev => prev.filter((_, i) => i !== index))
  }

  // OCR Processing
  async function processImages() {
    if (images.length === 0) {
      alert('Please upload at least one image')
      return
    }

    setProcessing(true)
    setOcrProgress(0)
    const texts: string[] = []

    try {
      for (let i = 0; i < images.length; i++) {
        const { data: { text } } = await Tesseract.recognize(
          images[i],
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                const progress = ((i / images.length) + (m.progress / images.length)) * 100
                setOcrProgress(Math.round(progress))
              }
            }
          }
        )
        texts.push(text)
      }

      setExtractedTexts(texts)
      setOcrProgress(100)
      alert('✅ OCR complete! Review the text and fill in course details.')
    } catch (error) {
      console.error('OCR Error:', error)
      alert('OCR processing failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Generate Questions
  async function generateQuestions() {
    if (!courseCode || !courseTitle) {
      alert('Please fill in course code and title')
      return
    }

    if (extractedTexts.length === 0) {
      alert('Please process images first')
      return
    }

    setGenerating(true)

    try {
      const combinedText = extractedTexts.join('\n\n')
      
      const response = await fetch('/api/study-aid/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode,
          courseTitle,
          topic,
          questionFormat,
          extractedText: combinedText,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/student/study-aid/attempt/${data.attemptId}`)
      } else if (data.needsPurchase) {
        if (confirm('No attempts remaining. Would you like to purchase more?')) {
          router.push('/student/study-aid/purchase')
        }
      } else {
        alert(data.error || 'Failed to generate questions')
      }
    } catch (error) {
      console.error('Generate Error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <StudyAidHeader />
      <div className="min-h-[calc(100vh-160px)] bg-gradient-to-br from-[#2E3192] via-[#3F51B5] to-[#2E3192] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#4FC3F7] rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#2EC4B6] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
          {/* Upload Section */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Step 1: Upload Study Materials
            </h2>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
                isDragActive
                  ? 'border-[#4FC3F7] bg-[#4FC3F7]/20'
                  : 'border-blue-300/50 hover:border-[#4FC3F7] hover:bg-white/5'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 mx-auto mb-4 text-blue-200" />
              <p className="text-white text-lg mb-2">
                {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
              </p>
              <p className="text-blue-200 text-sm">
                or click to browse (max 15 images)
              </p>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-6">
                <p className="text-white mb-3 font-semibold">
                  {images.length} image{images.length !== 1 ? 's' : ''} uploaded
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={processImages}
                  disabled={processing}
                  className="w-full py-3 bg-gradient-to-r from-[#2EC4B6] to-[#4FC3F7] rounded-lg font-semibold hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing OCR... {ocrProgress}%
                    </span>
                  ) : (
                    '🔍 Extract Text from Images'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Course Details */}
          {extractedTexts.length > 0 && (
            <>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Step 2: Course Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-blue-200 mb-2 font-medium">
                      Course Code *
                    </label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="e.g., BIO101"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-200 mb-2 font-medium">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g., General Biology"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-200 mb-2 font-medium">
                      Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Cell Structure"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-[#4FC3F7]"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-200 mb-2 font-medium">
                      Question Format *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setQuestionFormat('mcq')}
                        className={`p-4 rounded-lg border-2 transition ${
                          questionFormat === 'mcq'
                            ? 'bg-[#3F51B5] border-[#4FC3F7] text-white'
                            : 'bg-white/5 border-white/20 text-blue-200 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold text-lg mb-1">Multiple Choice</div>
                        <div className="text-sm opacity-80">25 MCQ questions</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setQuestionFormat('theory')}
                        className={`p-4 rounded-lg border-2 transition ${
                          questionFormat === 'theory'
                            ? 'bg-[#3F51B5] border-[#2EC4B6] text-white'
                            : 'bg-white/5 border-white/20 text-blue-200 hover:bg-white/10'
                        }`}
                      >
                        <div className="font-bold text-lg mb-1">Theory</div>
                        <div className="text-sm opacity-80">10 essay questions</div>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={generateQuestions}
                  disabled={generating || !courseCode || !courseTitle}
                  className="mt-6 w-full py-4 bg-gradient-to-r from-[#2EC4B6] via-[#4FC3F7] to-[#2EC4B6] rounded-lg font-bold text-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Generating Questions...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-6 h-6" />
                      Generate {questionFormat === 'mcq' ? 'MCQ' : 'Theory'} Questions
                    </span>
                  )}
                </button>
              </div>

              {/* Text Preview */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Extracted Text Preview
                </h2>
                <div className="bg-black/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-blue-100 text-sm whitespace-pre-wrap font-mono">
                    {extractedTexts.join('\n\n---\n\n').substring(0, 1000)}
                    {extractedTexts.join('\n\n').length > 1000 && '\n\n... (text truncated)'}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}