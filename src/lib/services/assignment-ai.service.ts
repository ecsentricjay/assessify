// src/lib/services/assignment-ai.service.ts
'use server'

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AssignmentRequest {
  question: string;
  courseOfStudy: string;
  courseName: string;
  wordCount: number;
  citationStyle: 'APA' | 'MLA' | 'Harvard' | 'Chicago' | 'IEEE';
  additionalInfo?: string;
}

export interface AssignmentResponse {
  content: string;
  wordCount: number;
  cost: number;
  generatedAt: string;
}

/**
 * Calculate cost based on word count
 * ₦100 for 1-1000 words, then +₦100 for each additional 1-1000 words
 * e.g., 1-1000 = ₦100, 1001-2000 = ₦200, 2001-3000 = ₦300, etc.
 */
export async function calculateAssignmentCost(wordCount: number): Promise<number> {
  if (wordCount <= 1000) {
    return 100; // ₦100 for up to 1000 words
  }
  // For words beyond 1000, add ₦100 for each additional 1000-word bracket
  const additionalBrackets = Math.ceil((wordCount - 1000) / 1000);
  return 100 + (additionalBrackets * 100);
}

/**
 * Generate assignment using Claude AI
 */
export async function generateAssignment(
  request: AssignmentRequest
): Promise<AssignmentResponse> {
  try {
    const systemPrompt = `You are an expert academic writing assistant helping university students write high-quality assignments. Your role is to:

1. Generate well-researched, original academic content
2. Follow proper academic writing conventions
3. Use the specified citation style correctly
4. Write at an appropriate academic level
5. Ensure the content is unique and plagiarism-free
6. Match the requested word count as closely as possible

IMPORTANT GUIDELINES:
- Write in a formal academic tone
- Use proper paragraph structure
- Include an introduction, body paragraphs, and conclusion
- Cite sources appropriately (you can create realistic hypothetical citations)
- Ensure logical flow and coherent arguments
- Use discipline-appropriate terminology
- Avoid casual language or contractions
- Make each assignment unique by varying sentence structures and vocabulary`;

    const userPrompt = `Please write an academic assignment with the following specifications:

**Assignment Question/Topic:**
${request.question}

**Student's Course of Study:**
${request.courseOfStudy}

**Course Name:**
${request.courseName}

**Required Word Count:**
${request.wordCount} words

**Citation/Referencing Style:**
${request.citationStyle}

${request.additionalInfo ? `**Additional Instructions:**
${request.additionalInfo}` : ''}

Please write a complete, well-structured assignment that:
1. Directly addresses the question/topic
2. Is appropriate for a ${request.courseOfStudy} student
3. Contains approximately ${request.wordCount} words
4. Uses ${request.citationStyle} citation style
5. Includes proper academic formatting
6. Has clear introduction, body, and conclusion sections
7. Includes in-text citations and a reference list

Generate the assignment now:`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.8, // Higher temperature for more varied/creative writing
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Calculate actual word count
    const actualWordCount = content.split(/\s+/).length;
    const cost = await calculateAssignmentCost(actualWordCount);

    return {
      content,
      wordCount: actualWordCount,
      cost,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Assignment generation error:', error);
    throw new Error('Failed to generate assignment. Please try again.');
  }
}

/**
 * Calculate cost based on submission word count
 * ₦200 for 1-1000 words, then +₦100 for each additional 1-1000 words
 * e.g., 1-1000 = ₦200, 1001-2000 = ₦300, 2001-3000 = ₦400, etc.
 */
export async function calculateSubmissionCost(wordCount: number): Promise<number> {
  if (wordCount <= 1000) {
    return 200; // ₦200 for up to 1000 words
  }
  // For words beyond 1000, add ₦100 for each additional 1000-word bracket
  const additionalBrackets = Math.ceil((wordCount - 1000) / 1000);
  return 200 + (additionalBrackets * 100);
}

/**
 * Deduct cost from student's wallet
 */
export async function deductAssignmentCost(
  userId: string,
  cost: number,
  assignmentDetails: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  try {
    // Get student's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    // Check if sufficient balance
    if (wallet.balance < cost) {
      return { 
        success: false, 
        error: `Insufficient balance. You need ₦${cost} but have ₦${wallet.balance}` 
      };
    }

    const newBalance = wallet.balance - cost;

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        total_spent: wallet.total_spent + cost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id);

    if (updateError) throw updateError;

    // Create transaction record
    await supabase.from('transactions').insert({
      wallet_id: wallet.id,
      type: 'debit',
      purpose: 'ai_assignment',
      amount: cost,
      balance_before: wallet.balance,
      balance_after: newBalance,
      description: `AI Assignment Generation: ${assignmentDetails}`,
      metadata: {
        service: 'ai_assignment_writer',
        details: assignmentDetails,
      },
      status: 'completed',
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error deducting assignment cost:', error);
    return { 
      success: false, 
      error: 'Failed to process payment. Please try again.' 
    };
  }
}

/**
 * Log assignment generation to database
 * Saves to ai_assignments table for history
 */
export async function logAssignmentGeneration(
  userId: string,
  request: AssignmentRequest,
  response: { content: string; wordCount: number; cost: number }
) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    console.log('📝 Logging assignment generation to database...');

    // Insert into ai_assignments table
    const { data: assignment, error } = await supabase
      .from('ai_assignments')
      .insert({
        student_id: userId,
        question: request.question,
        course_of_study: request.courseOfStudy,
        course_name: request.courseName,
        word_count: request.wordCount,
        citation_style: request.citationStyle,
        additional_info: request.additionalInfo || null,
        generated_content: response.content,
        actual_word_count: response.wordCount,
        cost: response.cost,
        ai_model: 'claude-3.5-sonnet', // or whichever model you're using
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error logging assignment:', error);
      // Don't throw - logging failure shouldn't break the flow
      return { success: false, error: error.message };
    }

    console.log('✅ Assignment logged successfully:', assignment.id);

    // Optional: Also create a notification for the student
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: 'AI Assignment Generated',
      message: `Your assignment for ${request.courseName} (${response.wordCount} words) has been generated successfully.`,
      metadata: {
        service: 'ai_assignment',
        assignment_id: assignment.id,
        course: request.courseName,
        word_count: response.wordCount,
        cost: response.cost,
      },
    });

    return { success: true, assignment };
  } catch (error) {
    console.error('❌ Exception logging assignment:', error);
    return { success: false, error: 'Failed to log assignment' };
  }
}