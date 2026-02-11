"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { parseAndExtractQuestions } from "@/lib/actions/document-import.actions";
import { ExtractedQuestion } from "@/lib/services/gemini.service";

interface DocumentUploadProps {
  onQuestionsExtracted: (questions: ExtractedQuestion[]) => void;
}

export default function DocumentUpload({ onQuestionsExtracted }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.toLowerCase().endsWith(".docx")) {
        setError("Please upload a DOCX file");
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;

        // Call server action to parse and extract questions
        const result = await parseAndExtractQuestions(
          fileData,
          file.name,
          true // Include images
        );

        if (result.success && result.questions) {
          setSuccess(true);
          onQuestionsExtracted(result.questions);
        } else {
          setError(result.error || "Failed to extract questions");
        }

        setIsProcessing(false);
      };

      reader.onerror = () => {
        setError("Failed to read file");
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setError("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Upload Question Document</h3>
          <p className="text-sm text-muted-foreground">
            Upload a DOCX file containing your questions. Our AI will extract and format them automatically.
          </p>
        </div>

        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="document-upload"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing}
          />
          <label
            htmlFor="document-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            {file ? (
              <>
                <FileText className="h-12 w-12 text-blue-500 mb-2" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm font-medium">Click to upload document</p>
                <p className="text-xs text-muted-foreground">DOCX only (Max 10MB)</p>
              </>
            )}
          </label>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-success bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">
              Questions extracted successfully! Review them below.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting Questions...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Extract Questions
              </>
            )}
          </Button>

          {file && !isProcessing && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setError(null);
                setSuccess(false);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Supported Question Formats:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Multiple Choice Questions (MCQ) with options A, B, C, D</li>
            <li>• True/False questions</li>
            <li>• Essay questions</li>
            <li>• Questions with images (DOCX only)</li>
            <li>• Questions with marks/points specified</li>
            <li>• Questions with explanations/answers</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}