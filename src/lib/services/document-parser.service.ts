import * as mammoth from "mammoth";

/**
 * Parse DOCX file and extract text
 */
export async function parseDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse DOCX file");
  }
}

/**
 * Parse DOCX file and extract text with images
 */
export async function parseDocxWithImages(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract text
    const textResult = await mammoth.extractRawText({ buffer });
    
    // For now, return text only (image extraction can be added later if needed)
    // Image extraction from DOCX is complex and may require additional setup
    
    return {
      text: textResult.value,
      images: [], // Images extraction disabled for now
    };
  } catch (error) {
    console.error("Error parsing DOCX with images:", error);
    throw new Error("Failed to parse DOCX file with images");
  }
}

/**
 * Parse PDF file and extract text
 * NOTE: PDF support temporarily disabled - use DOCX instead
 */
export async function parsePdf(file: File): Promise<string> {
  throw new Error("PDF parsing is currently not supported. Please convert your PDF to DOCX format and upload again.");
}

/**
 * Parse document based on file type
 */
export async function parseDocument(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    return parseDocx(file);
  } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    throw new Error("PDF parsing is currently not supported. Please convert your PDF to DOCX format and upload again.");
  } else {
    throw new Error("Unsupported file type. Please upload a DOCX file.");
  }
}

/**
 * Parse document with image support
 */
export async function parseDocumentWithImages(file: File): Promise<ParsedDocument> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    return parseDocxWithImages(file);
  } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    throw new Error("PDF parsing is currently not supported. Please convert your PDF to DOCX format and upload again.");
  } else {
    throw new Error("Unsupported file type. Please upload a DOCX file.");
  }
}

// Types
export interface DocumentImage {
  data: string; // base64
  mimeType: string;
}

export interface ParsedDocument {
  text: string;
  images: DocumentImage[];
}