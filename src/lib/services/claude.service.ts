import Anthropic from "@anthropic-ai/sdk";

// Initialize Claude AI
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is not set in environment variables");
}

const anthropic = new Anthropic({
  apiKey: apiKey || "",
});

/**
 * Use Claude Sonnet model
 */
const MODEL_NAME = "claude-sonnet-4-20250514";

/**
 * Extract questions from document text using Claude AI
 */
export async function extractQuestionsFromText(
  documentText: string
): Promise<ExtractedQuestion[]> {
  try {
    // Check if API key is available
    if (!apiKey) {
      throw new Error("Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your .env.local file.");
    }

    // Check if document has content
    if (!documentText || documentText.trim().length === 0) {
      throw new Error("Document is empty or contains no text");
    }

    console.log("Extracting questions from text, length:", documentText.length);

    const prompt = `You are an expert at extracting structured questions from educational documents.

Extract ALL questions from the following text into a structured JSON array.

IMPORTANT RULES:
1. Extract ALL questions found in the text
2. Identify the question type: "mcq", "true_false", or "essay"
3. For MCQ questions:
   - Extract all options as an array
   - Identify the correct answer as a letter (A, B, C, D, etc.)
4. For True/False questions:
   - Set correct_answer to "True" or "False"
5. For Essay questions:
   - Set correct_answer to null
   - Set options to an empty array
6. Extract explanations if provided
7. Extract marks/points. If not mentioned, default to 1 mark
8. Preserve question numbering

DOCUMENT TEXT:
${documentText}

Return a JSON array with this exact structure:
[
  {
    "question_text": "The actual question text",
    "question_type": "mcq" | "true_false" | "essay",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_answer": "A" | "True" | "False" | null,
    "explanation": "Explanation text if provided, otherwise empty string",
    "marks": 2
  }
]

CRITICAL: Return ONLY the JSON array, nothing else. No explanation, no markdown, just the raw JSON.`;

    console.log("Sending request to Claude API...");

    const message = await anthropic.messages.create({
      model: MODEL_NAME,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("Received response from Claude");

    // Extract text from Claude's response
    const responseText = message.content[0].type === "text" 
      ? message.content[0].text 
      : "";

    console.log("Response length:", responseText.length);

    // Clean the response (remove markdown if present)
    let jsonText = responseText.trim();
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // Parse JSON
    const questions: ExtractedQuestion[] = JSON.parse(jsonText);

    console.log("Successfully extracted", questions.length, "questions");

    if (questions.length === 0) {
      throw new Error("No questions found in the document. Please ensure your document contains properly formatted questions.");
    }

    return questions;
  } catch (error) {
    console.error("Error extracting questions with Claude:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("401")) {
        throw new Error("Anthropic API key is invalid or not set. Please check your .env.local file.");
      } else if (error.message.includes("JSON")) {
        throw new Error("Failed to parse AI response. The document format might be too complex. Try simplifying your document structure.");
      } else if (error.message.includes("quota") || error.message.includes("429")) {
        throw new Error("API quota exceeded. Please try again later or check your Anthropic API usage.");
      } else {
        throw new Error(`AI extraction failed: ${error.message}`);
      }
    }

    throw new Error("Failed to extract questions from document");
  }
}

/**
 * Extract questions from document with image support
 */
export async function extractQuestionsFromTextWithImages(
  documentText: string,
  images: { data: string; mimeType: string }[]
): Promise<ExtractedQuestion[]> {
  try {
    console.log("Extracting questions with images using Claude...");

    const prompt = `You are an expert at extracting structured questions from educational documents that may contain images.

Extract ALL questions from the text and images below into a structured JSON array.

IMPORTANT RULES:
1. If a question references an image, mention it in the question_text (e.g., "Refer to the diagram above...")
2. Identify question types: "mcq", "true_false", or "essay"
3. For MCQ: provide options array and correct_answer (A, B, C, etc.)
4. For True/False: correct_answer is "True" or "False"
5. For Essay: correct_answer is null, options is empty array
6. Extract marks if mentioned, otherwise default to 1
7. Set has_image to true if the question references an image

DOCUMENT TEXT:
${documentText}

Return a JSON array with this structure:
[
  {
    "question_text": "Question text (mention if image is referenced)",
    "question_type": "mcq" | "true_false" | "essay",
    "options": ["Option A", "Option B", ...],
    "correct_answer": "A" | "True" | "False" | null,
    "explanation": "Explanation if provided",
    "marks": 2,
    "has_image": true | false
  }
]

CRITICAL: Return ONLY the JSON array, nothing else.`;

    // Prepare multimodal content for Claude
    const content: any[] = [
      {
        type: "text",
        text: prompt,
      },
    ];

    // Add images
    for (const image of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: image.mimeType,
          data: image.data,
        },
      });
    }

    const message = await anthropic.messages.create({
      model: MODEL_NAME,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    });

    const responseText = message.content[0].type === "text" 
      ? message.content[0].text 
      : "";

    // Clean and parse
    let jsonText = responseText.trim();
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const questions: ExtractedQuestion[] = JSON.parse(jsonText);

    console.log("Successfully extracted", questions.length, "questions with images");

    return questions;
  } catch (error: unknown) {
    console.error("Error extracting questions with images:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to extract questions from document with images: ${errorMessage}`);
  }
}

/**
 * Grade an essay using Claude AI
 */
export async function gradeEssayWithAI(
  essayText: string,
  question: string,
  maxScore: number,
  rubric?: string
): Promise<AIGradingResult> {
  try {
    const defaultRubric = `
Grade this essay based on the following criteria (out of ${maxScore} marks):
1. Content Quality (40%): Relevance, accuracy, depth of understanding
2. Structure & Organization (25%): Logical flow, clear introduction/conclusion
3. Critical Thinking (20%): Analysis, reasoning, original insights
4. Language & Grammar (15%): Clarity, grammar, vocabulary

Provide a detailed breakdown and constructive feedback.
`;

    const prompt = `You are an expert academic grader. Grade the following essay carefully and provide detailed feedback.

QUESTION:
${question}

GRADING RUBRIC:
${rubric || defaultRubric}

STUDENT'S ESSAY:
${essayText}

Provide your grading in this JSON format:
{
  "score": <number between 0 and ${maxScore}>,
  "percentage": <percentage score>,
  "feedback": "<overall detailed feedback>",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "gradingBreakdown": {
    "content": <score out of ${maxScore * 0.4}>,
    "structure": <score out of ${maxScore * 0.25}>,
    "criticalThinking": <score out of ${maxScore * 0.2}>,
    "languageGrammar": <score out of ${maxScore * 0.15}>
  }
}

Be fair, constructive, and encouraging in your feedback.
CRITICAL: Return ONLY the JSON object, nothing else.`;

    console.log("Sending essay grading request to Claude...");

    const message = await anthropic.messages.create({
      model: MODEL_NAME,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === "text" 
      ? message.content[0].text 
      : "";

    // Clean and parse
    let jsonText = responseText.trim();
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const gradingResult: AIGradingResult = JSON.parse(jsonText);

    console.log("Essay graded successfully, score:", gradingResult.score);

    return gradingResult;
  } catch (error: unknown) {
    console.error("Error grading essay with Claude:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to grade essay with AI: ${errorMessage}`);
  }
}

/**
 * Grade essay using file attachments (PDFs, images, etc.) instead of text extraction
 */
export async function gradeEssayWithFileAttachments(
  fileUrls: string[],
  question: string,
  maxScore: number,
  rubric?: string
): Promise<AIGradingResult> {
  try {
    console.log("Grading essay with file attachments, file count:", fileUrls.length);

    const defaultRubric = `
Grade this essay based on the following criteria (out of ${maxScore} marks):
1. Content Quality (40%): Relevance, accuracy, depth of understanding
2. Structure & Organization (25%): Logical flow, clear introduction/conclusion
3. Critical Thinking (20%): Analysis, reasoning, original insights
4. Language & Grammar (15%): Clarity, grammar, vocabulary

Provide a detailed breakdown and constructive feedback.
`;

    // Fetch and encode files
    const fileAttachments: any[] = [];

    for (const fileUrl of fileUrls) {
      try {
        console.log("Fetching file for attachment:", fileUrl);
        const response = await fetch(fileUrl);
        if (!response.ok) {
          console.error(`Failed to fetch file: ${response.statusText}`);
          continue;
        }

        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");
        const contentType = response.headers.get("content-type") || "application/octet-stream";

        // Determine attachment type and media type
        let attachmentType: "document" | "image" = "document";
        let mediaType = contentType;

        if (contentType.includes("image/png")) {
          attachmentType = "image";
          mediaType = "image/png";
        } else if (contentType.includes("image/jpeg") || contentType.includes("image/jpg")) {
          attachmentType = "image";
          mediaType = "image/jpeg";
        } else if (contentType.includes("image/webp")) {
          attachmentType = "image";
          mediaType = "image/webp";
        } else if (contentType.includes("image/gif")) {
          attachmentType = "image";
          mediaType = "image/gif";
        } else if (contentType.includes("pdf")) {
          attachmentType = "document";
          mediaType = "application/pdf";
        }

        fileAttachments.push({
          type: attachmentType,
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64Data,
          },
        });

        console.log(`Successfully prepared ${attachmentType} attachment: ${mediaType}`);
      } catch (error) {
        console.error("Error preparing file attachment:", error);
        // Continue with other files
      }
    }

    if (fileAttachments.length === 0) {
      throw new Error("No files could be prepared for grading");
    }

    const prompt = `You are an expert academic grader. Grade the submitted document(s) carefully and provide detailed feedback.

QUESTION/ASSIGNMENT:
${question}

GRADING RUBRIC:
${rubric || defaultRubric}

The student's submission is provided in the document(s) above. Please review the content and provide a grade.

Provide your grading in this JSON format:
{
  "score": <number between 0 and ${maxScore}>,
  "percentage": <percentage score>,
  "feedback": "<overall detailed feedback about the submitted work>",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "gradingBreakdown": {
    "content": <score out of ${maxScore * 0.4}>,
    "structure": <score out of ${maxScore * 0.25}>,
    "criticalThinking": <score out of ${maxScore * 0.2}>,
    "languageGrammar": <score out of ${maxScore * 0.15}>
  }
}

Be fair, constructive, and encouraging in your feedback.
CRITICAL: Return ONLY the JSON object, nothing else.`;

    console.log("Sending file grading request to Claude with", fileAttachments.length, "attachment(s)...");

    const message = await anthropic.messages.create({
      model: MODEL_NAME,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            ...fileAttachments,
          ],
        },
      ],
    });

    const responseText = message.content[0].type === "text" 
      ? message.content[0].text 
      : "";

    // Clean and parse
    let jsonText = responseText.trim();
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const gradingResult: AIGradingResult = JSON.parse(jsonText);

    console.log("File-based essay graded successfully, score:", gradingResult.score);

    return gradingResult;
  } catch (error: unknown) {
    console.error("Error grading essay with file attachments:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to grade document with AI: ${errorMessage}`);
  }
}

// Types
export interface ExtractedQuestion {
  question_text: string;
  question_type: "mcq" | "true_false" | "essay";
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  marks: number;
  has_image?: boolean;
}

export interface AIGradingResult {
  score: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  gradingBreakdown: {
    content: number;
    structure: number;
    criticalThinking: number;
    languageGrammar: number;
  };
}