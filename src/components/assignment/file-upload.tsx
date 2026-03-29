// Save as: src/components/assignment/file-upload.tsx
// Updated to support up to 10 files

'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  allowedTypes: string[]
  maxSizeMb: number
  onUploadComplete: (urls: string[]) => void
  maxFiles?: number
}

export default function FileUpload({ 
  allowedTypes, 
  maxSizeMb, 
  onUploadComplete,
  maxFiles = 10 // Updated default to 10
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const validateFile = (file: File): string | null => {
    // Check file size
    const sizeMb = file.size / (1024 * 1024)
    if (sizeMb > maxSizeMb) {
      return `File "${file.name}" exceeds ${maxSizeMb}MB limit`
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !allowedTypes.includes(extension)) {
      return `File type ".${extension}" is not allowed. Allowed: ${allowedTypes.join(', ')}`
    }

    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setError(null)

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. You currently have ${files.length} file(s).`)
      return
    }

    // Validate each file
    for (const file of selectedFiles) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setError(null)
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `submissions/${fileName}`

        const { data, error: uploadError } = await supabase.storage
          .from('assignment-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error details:', uploadError)
          
          if (uploadError.message.includes('not found')) {
            throw new Error('Storage bucket not accessible. Please check your Supabase configuration.')
          } else if (uploadError.message.includes('policies')) {
            throw new Error('Permission denied. Please check your storage bucket policies.')
          } else if (uploadError.message.includes('JWT')) {
            throw new Error('Authentication error. Please ensure you are logged in.')
          } else {
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
          }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('assignment-files')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      onUploadComplete(uploadedUrls)
      setFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload Files</Label>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          multiple
          accept={allowedTypes.map(t => `.${t}`).join(',')}
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-gray-500">
          Allowed: {allowedTypes.map(t => t.toUpperCase()).join(', ')} • Max {maxSizeMb}MB per file • Up to {maxFiles} files total
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} file(s) selected {files.length < maxFiles && `(${maxFiles - files.length} more allowed)`}
            </p>
            {!uploading && (
              <Button onClick={uploadFiles} size="sm">
                Upload {files.length} File{files.length > 1 ? 's' : ''}
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    <span className="text-xs text-gray-400">•</span>
                    <p className="text-xs text-gray-500">{file.type || 'Unknown type'}</p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    onClick={() => removeFile(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-center text-gray-600">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}