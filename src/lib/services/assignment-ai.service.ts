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
 * N100 per 1-2000 words
 */
export async function calculateAssignmentCost(wordCount: number): Promise<number> {
  const brackets = Math.ceil(wordCount / 2000);
  return brackets * 100;
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
 * Log assignment generation for analytics
 */
export async function logAssignmentGeneration(
  userId: string,
  request: AssignmentRequest,
  response: AssignmentResponse
) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  try {
    // You can create an 'ai_assignments' table to track this
    // For now, we'll use notifications as a log
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: 'Assignment Generated',
      message: `AI generated a ${response.wordCount}-word assignment for ₦${response.cost}`,
      metadata: {
        service: 'ai_assignment',
        word_count: response.wordCount,
        cost: response.cost,
        course: request.courseName,
      },
    });
  } catch (error) {
    console.error('Error logging assignment generation:', error);
  }
}