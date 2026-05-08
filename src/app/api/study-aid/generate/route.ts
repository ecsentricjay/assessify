// app/api/study-aid/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface GenerateRequest {
  courseCode: string;
  courseTitle?: string;
  topic?: string;
  questionFormat: 'mcq' | 'theory';
  extractedText: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: GenerateRequest = await request.json();
    const { courseCode, courseTitle, topic, questionFormat, extractedText } = body;

    // Validate input
    if (!courseCode || !extractedText || !questionFormat) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['mcq', 'theory'].includes(questionFormat)) {
      return NextResponse.json(
        { success: false, error: 'Invalid question format' },
        { status: 400 }
      );
    }

    // Validate user
    const user = await getCurrentUser();
    if (!user || user.profile?.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Not authenticated as student' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Check attempts
    const { data: credits, error: creditsError } = await supabase
      .from('study_attempt_credits')
      .select('remaining_free_attempts, remaining_paid_attempts')
      .eq('student_id', user.id)
      .single();

    // If no credits exist, create with defaults
    let freeRemaining = 3;
    let paidRemaining = 0;

    if (credits) {
      freeRemaining = credits.remaining_free_attempts ?? 3;
      paidRemaining = credits.remaining_paid_attempts ?? 0;
    }

    const totalRemaining = freeRemaining + paidRemaining;

    if (totalRemaining === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No attempts remaining',
          needsPurchase: true 
        },
        { status: 403 }
      );
    }

    // Use an attempt
    const { data: attemptResult, error: attemptError } = await supabase.rpc(
      'use_study_attempt',
      { p_student_id: user.id }
    );

    if (attemptError || !attemptResult || attemptResult.length === 0) {
      console.error('[Generate] Use attempt error:', attemptError);
      return NextResponse.json(
        { success: false, error: 'Failed to deduct attempt' },
        { status: 500 }
      );
    }

    const result = attemptResult[0];
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message || 'No attempts remaining',
          needsPurchase: true 
        },
        { status: 403 }
      );
    }

    const isFree = result.is_free;
    const questionCount = questionFormat === 'mcq' ? 25 : 10;

    // Create study attempt record
    const { data: studyAttempt, error: attemptCreateError } = await supabase
      .from('study_attempts')
      .insert({
        student_id: user.id,
        course_code: courseCode,
        course_title: courseTitle || null,
        topic: topic || null,
        question_format: questionFormat,
        question_count: questionCount,
        combined_text: extractedText,
        is_free: isFree,
        cost_naira: isFree ? 0 : 500,
        status: 'processing',
      })
      .select()
      .single();

    if (attemptCreateError) {
      console.error('[Generate] Create attempt error:', attemptCreateError);
      
      // Rollback
      if (isFree) {
        await supabase.rpc('rollback_free_attempt', { p_student_id: user.id });
      } else {
        await supabase.rpc('rollback_paid_attempt', { p_student_id: user.id });
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create study attempt' },
        { status: 500 }
      );
    }

    // Generate questions with Claude
    try {
      const prompt = questionFormat === 'mcq' 
        ? buildMCQPrompt(extractedText, courseCode, courseTitle, topic)
        : buildTheoryPrompt(extractedText, courseCode, courseTitle, topic);

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      let questions;
      try {
        const cleanJson = responseText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        questions = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error('[Generate] JSON parse error:', parseError);
        console.log('[Generate] Raw response:', responseText.substring(0, 500));
        throw new Error('Failed to parse AI response');
      }

      const generationTime = Date.now() - startTime;

      // Update study attempt
      const { error: updateError } = await supabase
        .from('study_attempts')
        .update({
          generated_questions: questions,
          generation_time_ms: generationTime,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', studyAttempt.id);

      if (updateError) {
        console.error('[Generate] Update error:', updateError);
      }

      return NextResponse.json({
        success: true,
        attemptId: studyAttempt.id,
        questions: questions,
        isFree: isFree,
        questionFormat: questionFormat,
        questionCount: questionCount,
        generationTime: generationTime,
        remainingAttempts: totalRemaining - 1,
        message: 'Questions generated successfully',
      });

    } catch (aiError: any) {
      console.error('[Generate] AI error:', aiError);

      await supabase
        .from('study_attempts')
        .update({
          status: 'failed',
          error_message: aiError.message || 'AI generation failed',
        })
        .eq('id', studyAttempt.id);

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate questions',
          details: aiError.message,
          attemptId: studyAttempt.id
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Generate] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Build MCQ prompt (25 questions)
 */
function buildMCQPrompt(
  text: string,
  courseCode: string,
  courseTitle?: string,
  topic?: string
): string {
  return `You are an expert Nigerian exam question generator. Generate 25 high-quality Multiple Choice Questions (MCQs) based on the study material provided below.

**Course Information:**
- Course Code: ${courseCode}
- Course Title: ${courseTitle || 'Not specified'}
- Topic: ${topic || 'General'}

**Study Material:**
${text}

**Requirements:**
1. Generate EXACTLY 25 MCQ questions
2. Each question should have 4 options (A, B, C, D) with ONE correct answer
3. Questions should be relevant to Nigerian curriculum (WAEC, JAMB, UTME style)
4. Mix of difficulty: 40% easy, 40% medium, 20% hard
5. Include brief explanations (1-2 sentences) for each correct answer
6. Questions should test understanding, not just memorization
7. Use Nigerian context and examples where relevant

**Output Format (JSON):**
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correct_answer": "A",
      "explanation": "Brief explanation why A is correct"
    }
  ]
}

Generate ONLY valid JSON. No markdown, no preamble.`;
}

/**
 * Build Theory prompt (10 questions with sub-questions)
 */
function buildTheoryPrompt(
  text: string,
  courseCode: string,
  courseTitle?: string,
  topic?: string
): string {
  return `You are an expert Nigerian exam question generator. Generate 10 high-quality Theory/Essay questions based on the study material provided below.

**Course Information:**
- Course Code: ${courseCode}
- Course Title: ${courseTitle || 'Not specified'}
- Topic: ${topic || 'General'}

**Study Material:**
${text}

**Requirements:**
1. Generate EXACTLY 10 theory questions
2. Each question should have 2 sub-questions (labeled a and b)
3. Questions should be relevant to Nigerian curriculum (WAEC, JAMB style)
4. Each sub-question should have detailed expected answers (NOT just tips)
5. Answers should show what a supervisor expects in a student's response
6. Mix question types: definitions, explanations, comparisons, applications
7. Use Nigerian context and examples where relevant

**Output Format (JSON):**
{
  "questions": [
    {
      "id": 1,
      "question": "Main question stem",
      "sub_questions": [
        {
          "label": "a",
          "question": "First sub-question?",
          "expected_answer": "Detailed answer showing key points, definitions, explanations. 3-5 sentences."
        },
        {
          "label": "b",
          "question": "Second sub-question?",
          "expected_answer": "Detailed answer showing key points, definitions, explanations. 3-5 sentences."
        }
      ]
    }
  ]
}

**Important:** 
- Provide ACTUAL EXPECTED ANSWERS, not "tips on where to read"
- Answers should guide marking and show what points to cover

Generate ONLY valid JSON. No markdown, no preamble.`;
}