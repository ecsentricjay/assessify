// lib/actions/study-aid.actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { generateQuestionsWithClaude } from '@/lib/ai/claude-client';
import { revalidatePath } from 'next/cache';

/**
 * Get student's credit balance
 */
export async function getStudentCredits() {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    
    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data: credits, error } = await supabase
      .from('study_attempt_credits')
      .select('*')
      .eq('student_id', user.id)
      .single();

    if (error) {
      console.error('[getStudentCredits] Error:', error);
      return { error: 'Failed to fetch credits' };
    }

    return {
      success: true,
      credits: credits || {
        total_free_attempts: 3,
        used_free_attempts: 0,
        remaining_free_attempts: 3,
        purchased_attempts: 0,
        used_paid_attempts: 0,
        remaining_paid_attempts: 0,
        total_attempts_used: 0,
      },
    };
  } catch (error) {
    console.error('[getStudentCredits] Error:', error);
    return { error: 'Failed to fetch credits' };
  }
}

/**
 * Check if student can make an attempt
 */
export async function canMakeAttempt() {
  try {
    const creditsResult = await getStudentCredits();
    
    if (creditsResult.error || !creditsResult.credits) {
      return { error: creditsResult.error };
    }

    const credits = creditsResult.credits;

    // Check free attempts first
    if (credits.remaining_free_attempts > 0) {
      return {
        success: true,
        canAttempt: true,
        isFree: true,
        cost: 0,
        attemptsRemaining: credits.remaining_free_attempts,
        message: `You have ${credits.remaining_free_attempts} free attempt(s) remaining`,
      };
    }

    // Check paid attempts
    if (credits.remaining_paid_attempts > 0) {
      return {
        success: true,
        canAttempt: true,
        isFree: false,
        cost: 0,
        attemptsRemaining: credits.remaining_paid_attempts,
        message: `You have ${credits.remaining_paid_attempts} purchased attempt(s) remaining`,
      };
    }

    // Need to purchase
    return {
      success: true,
      canAttempt: false,
      needsToPurchase: true,
      cost: Number(process.env.STUDY_AID_COST_PER_ATTEMPT) || 500,
      message: 'You need to purchase attempts to continue',
    };
  } catch (error) {
    console.error('[canMakeAttempt] Error:', error);
    return { error: 'Failed to check attempt eligibility' };
  }
}

/**
 * Upload study material
 */
export async function uploadStudyMaterial(data: {
  courseCode: string;
  courseTitle: string;
  topic?: string;
  examType?: string;
  materialType: 'notes' | 'outline' | 'past_questions' | 'textbook' | 'lecture';
  fileUrls: string[];
  extractedText: string;
}) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data: material, error } = await supabase
      .from('study_materials')
      .insert({
        student_id: user.id,
        course_code: data.courseCode,
        course_title: data.courseTitle,
        topic: data.topic,
        exam_type: data.examType,
        material_type: data.materialType,
        upload_method: 'images',
        file_urls: data.fileUrls,
        extracted_text: data.extractedText,
        total_pages: data.fileUrls.length,
        is_processed: true,
        processing_status: 'completed',
      })
      .select()
      .single();

    if (error) {
      console.error('[uploadStudyMaterial] Error:', error);
      return { error: 'Failed to save study material' };
    }

    return { success: true, material };
  } catch (error) {
    console.error('[uploadStudyMaterial] Error:', error);
    return { error: 'Failed to upload study material' };
  }
}

/**
 * Create a study attempt (generate questions)
 */
export async function createStudyAttempt(data: {
  materialId?: string;
  courseCode: string;
  courseTitle: string;
  topic?: string;
  examType?: string;
  extractedText: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
}) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Check if student can make attempt
    const eligibility = await canMakeAttempt();
    if (eligibility.error || !eligibility.canAttempt) {
      return {
        error: eligibility.message || 'You need to purchase attempts',
        needsToPurchase: true,
      };
    }

    // Get current attempt count
    const { data: credits } = await supabase
      .from('study_attempt_credits')
      .select('total_attempts_used')
      .eq('student_id', user.id)
      .single();

    const attemptNumber = (credits?.total_attempts_used || 0) + 1;
    const isFree = eligibility.isFree || false;

    // Create attempt record (pending)
    const { data: attempt, error: attemptError } = await supabase
      .from('study_attempts')
      .insert({
        student_id: user.id,
        material_id: data.materialId,
        attempt_number: attemptNumber,
        is_free: isFree,
        amount_paid: isFree ? 0 : 0, // Will be updated if payment required
        course_code: data.courseCode,
        course_title: data.courseTitle,
        topic: data.topic,
        student_request: `Generate ${data.questionCount || 10} practice questions`,
        difficulty_level: data.difficulty || 'medium',
        question_count: data.questionCount || 10,
        question_types: ['mcq', 'theory'],
        status: 'processing',
      })
      .select()
      .single();

    if (attemptError) {
      console.error('[createStudyAttempt] Attempt error:', attemptError);
      return { error: 'Failed to create attempt' };
    }

    // Generate questions using Claude AI
    try {
      const aiResponse = await generateQuestionsWithClaude({
        extractedText: data.extractedText,
        courseCode: data.courseCode,
        courseTitle: data.courseTitle,
        topic: data.topic,
        examType: data.examType as any,
        difficulty: data.difficulty,
        questionCount: data.questionCount,
      });

      // Update attempt with AI response
      const { error: updateError } = await supabase
        .from('study_attempts')
        .update({
          ai_response: aiResponse,
          generated_questions: aiResponse.questions,
          study_tips: aiResponse.studyTips,
          tokens_used: aiResponse.tokensUsed,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', attempt.id);

      if (updateError) {
        console.error('[createStudyAttempt] Update error:', updateError);
        return { error: 'Failed to save AI response' };
      }

      // Generate flashcards (optional)
      if (aiResponse.questions.length > 0) {
        const flashcards = aiResponse.questions.map((q) => ({
          student_id: user.id,
          material_id: data.materialId,
          attempt_id: attempt.id,
          course_code: data.courseCode,
          topic: data.topic,
          question: q.question,
          answer: q.correctAnswer || q.keyPoints?.join(', ') || '',
          hint: q.explanation,
          difficulty: data.difficulty || 'medium',
        }));

        await supabase.from('study_flashcards').insert(flashcards);
      }

      revalidatePath('/student/study-aid');
      
      return {
        success: true,
        attempt: {
          ...attempt,
          ai_response: aiResponse,
        },
      };
    } catch (aiError) {
      console.error('[createStudyAttempt] AI error:', aiError);
      
      // Update attempt status to failed
      await supabase
        .from('study_attempts')
        .update({
          status: 'failed',
          error_message: 'AI generation failed',
        })
        .eq('id', attempt.id);

      return { error: 'Failed to generate questions. Please try again.' };
    }
  } catch (error) {
    console.error('[createStudyAttempt] Error:', error);
    return { error: 'Failed to create study attempt' };
  }
}

/**
 * Get attempt history
 */
export async function getAttemptHistory() {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data: attempts, error } = await supabase
      .from('study_attempts')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAttemptHistory] Error:', error);
      return { error: 'Failed to fetch attempt history' };
    }

    return { success: true, attempts: attempts || [] };
  } catch (error) {
    console.error('[getAttemptHistory] Error:', error);
    return { error: 'Failed to fetch attempt history' };
  }
}

/**
 * Get attempt by ID
 */
export async function getAttemptById(attemptId: string) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data: attempt, error } = await supabase
      .from('study_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('student_id', user.id)
      .single();

    if (error) {
      console.error('[getAttemptById] Error:', error);
      return { error: 'Attempt not found' };
    }

    return { success: true, attempt };
  } catch (error) {
    console.error('[getAttemptById] Error:', error);
    return { error: 'Failed to fetch attempt' };
  }
}

/**
 * Get student's study materials
 */
export async function getStudyMaterials(courseCode?: string) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    let query = supabase
      .from('study_materials')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (courseCode) {
      query = query.eq('course_code', courseCode);
    }

    const { data: materials, error } = await query;

    if (error) {
      console.error('[getStudyMaterials] Error:', error);
      return { error: 'Failed to fetch materials' };
    }

    return { success: true, materials: materials || [] };
  } catch (error) {
    console.error('[getStudyMaterials] Error:', error);
    return { error: 'Failed to fetch materials' };
  }
}

/**
 * Get student statistics
 */
export async function getStudyStatistics() {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data: stats, error } = await supabase
      .from('study_statistics')
      .select('*')
      .eq('student_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error is ok
      console.error('[getStudyStatistics] Error:', error);
      return { error: 'Failed to fetch statistics' };
    }

    return {
      success: true,
      stats: stats || {
        total_materials_uploaded: 0,
        total_attempts: 0,
        total_questions_generated: 0,
        study_streak_days: 0,
      },
    };
  } catch (error) {
    console.error('[getStudyStatistics] Error:', error);
    return { error: 'Failed to fetch statistics' };
  }
}