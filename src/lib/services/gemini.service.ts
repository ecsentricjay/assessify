import { GoogleGenAI } from "@google/genai";

// 1. Solve the "undefined" error by asserting the key exists
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const client = new GoogleGenAI({ apiKey });

// 2. Use a model that exists in 2026
const MODEL_ID = "gemini-2.0-flash";

export async function extractQuestionsFromText(
  documentText: string
): Promise<ExtractedQuestion[]> {
  try {
    const response = await client.models.generateContent({
      model: MODEL_ID,
      contents: [{ parts: [{ text: `Extract questions from: ${documentText}` }] }],
      config: {
        // 3. FIX: Property is camelCase 'responseMimeType'
        responseMimeType: "application/json",
        // 4. FIX: Use string literals for types (e.g., "ARRAY", "OBJECT")
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question_text: { type: "STRING" },
              question_type: { type: "STRING", enum: ["mcq", "true_false", "essay"] },
              options: { type: "ARRAY", items: { type: "STRING" }, nullable: true },
              correct_answer: { type: "STRING", nullable: true },
              explanation: { type: "STRING" },
              marks: { type: "NUMBER" },
            },
            required: ["question_text", "question_type", "marks"],
          },
        },
      },
    });

    // 5. FIX: 'text' is a property, not a function. Fallback to empty array string.
    const resultText = response.text || "[]";
    return JSON.parse(resultText);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Extraction error:", message);
    throw new Error(`AI extraction failed: ${message}`);
  }
}

export async function extractQuestionsFromTextWithImages(
  documentText: string,
  images: { data: string; mimeType: string }[]
): Promise<ExtractedQuestion[]> {
  // 6. FIX: Use 'inlineData' (camelCase) and remove 'role' from inside parts
  const imageParts = images.map(img => ({
    inlineData: { data: img.data, mimeType: img.mimeType }
  }));

  const response = await client.models.generateContent({
    model: MODEL_ID,
    contents: [{
      parts: [
        { text: `Extract questions from text and images: ${documentText}` },
        ...imageParts
      ]
    }],
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || "[]");
}

// Interfaces
export interface ExtractedQuestion {
  question_text: string;
  question_type: "mcq" | "true_false" | "essay";
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  marks: number;
}