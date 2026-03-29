"use server";

import { parseDocument, parseDocumentWithImages } from "@/lib/services/document-parser.service";
import {
  extractQuestionsFromText,
  extractQuestionsFromTextWithImages,
  type ExtractedQuestion,
} from "@/lib/services/claude.service";

/**
 * Parse document and extract questions using AI
 */
export async function parseAndExtractQuestions(
  fileData: string, // base64 file data
  fileName: string,
  includeImages: boolean = false
): Promise<{
  success: boolean;
  questions?: ExtractedQuestion[];
  error?: string;
}> {
  try {
    console.log("Starting document parsing for:", fileName);
    
    // Convert base64 to File object
    const byteString = atob(fileData.split(",")[1]);
    const mimeType = fileData.split(",")[0].split(":")[1].split(";")[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([uint8Array], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    console.log("File created, size:", file.size, "type:", file.type);

    // Parse document
    let documentText: string;
    let questions: ExtractedQuestion[];
    
    if (includeImages) {
      console.log("Parsing document with image support...");
      const parsed = await parseDocumentWithImages(file);
      documentText = parsed.text;
      
      console.log("Document parsed, text length:", documentText.length, "images:", parsed.images.length);
      
      if (parsed.images.length > 0) {
        // Use vision model for documents with images
        console.log("Using vision model for image extraction...");
        questions = await extractQuestionsFromTextWithImages(
          parsed.text,
          parsed.images
        );
      } else {
        // No images, use regular extraction
        console.log("No images found, using text-only extraction...");
        questions = await extractQuestionsFromText(parsed.text);
      }
    } else {
      console.log("Parsing document (text only)...");
      documentText = await parseDocument(file);
      
      console.log("Document parsed, text length:", documentText.length);
      
      questions = await extractQuestionsFromText(documentText);
    }

    console.log("Extraction complete, found", questions.length, "questions");

    return {
      success: true,
      questions,
    };
  } catch (error) {
    console.error("Error parsing and extracting questions:", error);
    
    let errorMessage = "Failed to process document";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate extracted questions before import
 */
export async function validateExtractedQuestions(
  questions: ExtractedQuestion[]
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  questions.forEach((q, index) => {
    // Check question text
    if (!q.question_text || q.question_text.trim().length === 0) {
      errors.push(`Question ${index + 1}: Missing question text`);
    }

    // Check question type
    if (!["mcq", "true_false", "essay"].includes(q.question_type)) {
      errors.push(`Question ${index + 1}: Invalid question type`);
    }

    // Validate MCQ questions
    if (q.question_type === "mcq") {
      if (!q.options || q.options.length < 2) {
        errors.push(`Question ${index + 1}: MCQ must have at least 2 options`);
      }
      if (!q.correct_answer) {
        errors.push(`Question ${index + 1}: MCQ must have a correct answer`);
      }
    }

    // Validate True/False questions
    if (q.question_type === "true_false") {
      if (!q.correct_answer || !["True", "False"].includes(q.correct_answer)) {
        errors.push(`Question ${index + 1}: True/False must have correct answer (True or False)`);
      }
    }

    // Check marks
    if (!q.marks || q.marks <= 0) {
      errors.push(`Question ${index + 1}: Invalid marks value`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}