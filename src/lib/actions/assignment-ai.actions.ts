// src/lib/actions/assignment-ai.actions.ts
'use server'

import {
  generateAssignment,
  deductAssignmentCost,
  logAssignmentGeneration,
  calculateAssignmentCost,
  type AssignmentRequest,
} from '@/lib/services/assignment-ai.service';

export async function createAIAssignment(
  userId: string,
  request: AssignmentRequest
) {
  try {
    // Calculate cost first
    const cost = await calculateAssignmentCost(request.wordCount);

    // Check wallet balance before generating
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (!wallet || wallet.balance < cost) {
      return {
        success: false,
        error: `Insufficient balance. You need ₦${cost} but have ₦${wallet?.balance || 0}. Please fund your wallet.`,
      };
    }

    // Generate the assignment
    const response = await generateAssignment(request);

    // Deduct cost from wallet
    const paymentResult = await deductAssignmentCost(
      userId,
      response.cost,
      `${request.courseName} - ${request.wordCount} words`
    );

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error || 'Payment failed',
      };
    }

    // Log the generation
    await logAssignmentGeneration(userId, request, response);

    return {
      success: true,
      data: {
        content: response.content,
        wordCount: response.wordCount,
        cost: response.cost,
        newBalance: paymentResult.newBalance,
      },
    };
  } catch (error) {
    console.error('Error creating AI assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate assignment',
    };
  }
}

export async function getAssignmentCostEstimate(wordCount: number) {
  try {
    const cost = await calculateAssignmentCost(wordCount);
    return { success: true, cost };
  } catch (error) {
    return { success: false, cost: 0, error: 'Failed to calculate cost' };
  }
}

export async function getUserWalletBalance(userId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { success: true, balance: wallet.balance };
  } catch (error) {
    return { success: false, error: 'Failed to get wallet balance' };
  }
}