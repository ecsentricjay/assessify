// lib/ai/claude-client.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface QuestionGenerationRequest {
  extractedText: string;
  courseCode: string;
  courseTitle: string;
  topic?: string;
  examType?: 'UTME' | 'WAEC' | 'JAMB' | 'NECO' | 'Internal' | 'Other';
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
  questionTypes?: ('mcq' | 'theory' | 'fill-blank')[];
}

export interface GeneratedQuestion {
  type: 'mcq' | 'theory' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation: string;
  markAllocation?: number;
  keyPoints?: string[];
}

export interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
  studyTips: string[];
  keyTopics: string[];
  summary: string;
  tokensUsed: number;
}

/**
 * Generate practice questions using Claude AI
 */
export async function generateQuestionsWithClaude(
  request: QuestionGenerationRequest
): Promise<QuestionGenerationResponse> {
  const {
    extractedText,
    courseCode,
    courseTitle,
    topic,
    examType = 'Internal',
    difficulty = 'medium',
    questionCount = 10,
    questionTypes = ['mcq', 'theory'],
  } = request;

  // Build prompt
  const prompt = buildQuestionPrompt({
    extractedText,
    courseCode,
    courseTitle,
    topic,
    examType,
    difficulty,
    questionCount,
    questionTypes,
  });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Parse the structured response
    const parsed = parseClaudeResponse(responseText);

    return {
      ...parsed,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    };
  } catch (error) {
    console.error('[generateQuestionsWithClaude] Error:', error);
    throw new Error('Failed to generate questions with AI');
  }
}

/**
 * Build the AI prompt
 */
function buildQuestionPrompt(params: QuestionGenerationRequest & { questionCount: number }): string {
  const {
    extractedText,
    courseCode,
    courseTitle,
    topic,
    examType,
    difficulty,
    questionCount = 10,
    questionTypes,
  } = params;

  const mcqCount = Math.floor(questionCount * 0.6);
  const theoryCount = questionCount - mcqCount;

  return `You are an expert Nigerian exam question generator specializing in creating high-quality practice questions for students.

**STUDY MATERIAL:**
Course: ${courseCode} - ${courseTitle}
${topic ? `Topic: ${topic}` : ''}
Exam Type: ${examType}
Difficulty Level: ${difficulty}

**CONTENT:**
${extractedText}

**TASK:**
Generate exactly ${questionCount} practice questions based on the study material above.
- ${mcqCount} Multiple Choice Questions (MCQ)
- ${theoryCount} Theory/Essay Questions

**OUTPUT FORMAT (STRICT JSON):**
Return your response as a valid JSON object with this exact structure:

{
  "questions": [
    {
      "type": "mcq",
      "question": "What is photosynthesis?",
      "options": ["A) Process of...", "B) Process of...", "C) Process of...", "D) Process of..."],
      "correctAnswer": "A",
      "explanation": "Photosynthesis is... because..."
    },
    {
      "type": "theory",
      "question": "Explain the process of photosynthesis in detail.",
      "explanation": "Expected answer should cover: chlorophyll, light energy, glucose production...",
      "keyPoints": ["Chlorophyll absorbs light", "Converts CO2 and H2O", "Produces glucose and O2"],
      "markAllocation": 10
    }
  ],
  "studyTips": [
    "Focus on understanding the process rather than memorizing",
    "Draw diagrams to visualize the concept",
    "Practice past questions regularly"
  ],
  "keyTopics": [
    "Photosynthesis process",
    "Role of chlorophyll",
    "Products of photosynthesis"
  ],
  "summary": "Brief overview of what the material covers"
}

**REQUIREMENTS:**
1. Questions must be based ONLY on the provided study material
2. Use Nigerian exam standards and terminology
3. MCQ options should have clear correct answers
4. Theory questions should have detailed explanations
5. Include practical study tips
6. Focus on exam-relevant content
7. ${difficulty === 'easy' ? 'Use simple, straightforward questions' : difficulty === 'hard' ? 'Use complex, analytical questions' : 'Use moderate difficulty questions'}
8. Ensure questions test understanding, not just recall
9. Return ONLY valid JSON, no additional text

Generate the questions now:`;
}

/**
 * Parse Claude's response into structured format
 */
function parseClaudeResponse(responseText: string): Omit<QuestionGenerationResponse, 'tokensUsed'> {
  try {
    // Try to extract JSON from the response
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(jsonText);
    
    return {
      questions: parsed.questions || [],
      studyTips: parsed.studyTips || [],
      keyTopics: parsed.keyTopics || [],
      summary: parsed.summary || 'Study material processed successfully',
    };
  } catch (error) {
    console.error('[parseClaudeResponse] Error:', error);
    console.error('[parseClaudeResponse] Response:', responseText);
    
    // Fallback: return a basic structure
    return {
      questions: [],
      studyTips: ['Review the material carefully', 'Practice regularly', 'Test yourself often'],
      keyTopics: ['Review required'],
      summary: 'Unable to parse AI response. Please try again.',
    };
  }
}

/**
 * Generate flashcards from questions
 */
export async function generateFlashcards(
  questions: GeneratedQuestion[]
): Promise<Array<{ question: string; answer: string; hint: string }>> {
  return questions.map((q) => ({
    question: q.question,
    answer: q.correctAnswer || q.keyPoints?.join(', ') || 'See explanation',
    hint: q.explanation,
  }));
}

/**
 * Estimate cost of AI call
 */
export function estimateAICost(inputTokens: number, outputTokens: number): number {
  // Claude Sonnet 4 pricing (as of 2024)
  // Input: $3 per 1M tokens = ₦0.0045 per token (at ₦1,500/$)
  // Output: $15 per 1M tokens = ₦0.0225 per token
  
  const inputCost = (inputTokens / 1000000) * 3 * 1500; // in Naira
  const outputCost = (outputTokens / 1000000) * 15 * 1500; // in Naira
  
  return inputCost + outputCost;
}