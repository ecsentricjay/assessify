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

/**
 * Get previous AI assignments for a student
 * Fetches from ai_assignments table
 */
export async function getPreviousAIAssignments(
  userId: string,
  limit: number = 20
) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    console.log('📚 Fetching previous AI assignments for user:', userId)

    const { data: assignments, error } = await supabase
      .from('ai_assignments')
      .select('*')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Error fetching assignments:', error)
      return { success: false, error: error.message, assignments: [] }
    }

    console.log(`✅ Found ${assignments?.length || 0} previous assignments`)

    return {
      success: true,
      assignments: assignments || []
    }
  } catch (error) {
    console.error('❌ Exception fetching assignments:', error)
    return { success: false, error: 'Failed to fetch assignments', assignments: [] }
  }
}

/**
 * Get a single AI assignment by ID
 * Includes ownership verification
 */
export async function getAIAssignmentById(assignmentId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: assignment, error } = await supabase
      .from('ai_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('student_id', user.id) // Verify ownership
      .single()

    if (error) {
      console.error('❌ Error fetching assignment:', error)
      return { success: false, error: error.message }
    }

    if (!assignment) {
      return { success: false, error: 'Assignment not found or unauthorized' }
    }

    return {
      success: true,
      assignment
    }
  } catch (error) {
    console.error('❌ Exception fetching assignment:', error)
    return { success: false, error: 'Failed to fetch assignment' }
  }
}

/**
 * Delete an AI assignment
 * Verifies ownership before deletion
 */
export async function deleteAIAssignment(assignmentId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify ownership before deleting
    const { data: assignment, error: fetchError } = await supabase
      .from('ai_assignments')
      .select('student_id')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return { success: false, error: 'Assignment not found' }
    }

    if (assignment.student_id !== user.id) {
      return { success: false, error: 'Unauthorized: You can only delete your own assignments' }
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from('ai_assignments')
      .delete()
      .eq('id', assignmentId)

    if (deleteError) {
      console.error('❌ Error deleting assignment:', deleteError)
      return { success: false, error: 'Failed to delete assignment' }
    }

    console.log('✅ Assignment deleted successfully:', assignmentId)

    return { success: true }
  } catch (error) {
    console.error('❌ Exception deleting assignment:', error)
    return { success: false, error: 'Failed to delete assignment' }
  }
}

/**
 * Get AI assignment statistics for a student
 * Returns total spent, total words, assignment count
 */
export async function getAIAssignmentStats(userId: string) {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from('ai_assignments')
      .select('cost, actual_word_count, created_at')
      .eq('student_id', userId)

    if (error) {
      console.error('❌ Error fetching stats:', error)
      return {
        success: false,
        stats: {
          totalSpent: 0,
          totalWords: 0,
          assignmentCount: 0,
          averageCost: 0,
          averageWords: 0
        }
      }
    }

    const totalSpent = assignments?.reduce((sum, a) => sum + Number(a.cost || 0), 0) || 0
    const totalWords = assignments?.reduce((sum, a) => sum + Number(a.actual_word_count || 0), 0) || 0
    const assignmentCount = assignments?.length || 0

    return {
      success: true,
      stats: {
        totalSpent,
        totalWords,
        assignmentCount,
        averageCost: assignmentCount > 0 ? totalSpent / assignmentCount : 0,
        averageWords: assignmentCount > 0 ? totalWords / assignmentCount : 0,
        lastGenerated: assignments && assignments.length > 0 
          ? assignments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null
      }
    }
  } catch (error) {
    console.error('❌ Exception fetching stats:', error)
    return {
      success: false,
      stats: {
        totalSpent: 0,
        totalWords: 0,
        assignmentCount: 0,
        averageCost: 0,
        averageWords: 0
      }
    }
  }
}