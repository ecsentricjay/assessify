// src/lib/actions/plagiarism.actions.ts
'use server'

import { revalidatePath } from 'next/cache';
import { 
  detectPlagiarism, 
  handlePlagiarismDecision,
  notifyLecturerOfPlagiarism 
} from '@/lib/services/plagiarism.service';

export async function checkAssignmentPlagiarism(assignmentId: string) {
  try {
    const result = await detectPlagiarism(assignmentId);
    
    // If plagiarism detected, notify lecturer
    if (result.flagged_pairs.length > 0) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      
      const { data: assignment } = await supabase
        .from('assignments')
        .select('created_by')
        .eq('id', assignmentId)
        .single();

      if (assignment) {
        await notifyLecturerOfPlagiarism(
          assignmentId,
          assignment.created_by,
          result.flagged_pairs.length
        );
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error checking plagiarism:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check plagiarism' 
    };
  }
}

export async function getFlaggedSubmissions(assignmentId: string) {
  try {
    const result = await detectPlagiarism(assignmentId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching flagged submissions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch flagged submissions' 
    };
  }
}

export async function decidePlagiarismCase(
  submissionIds: string[],
  decision: 'ignore' | 'reject',
  lecturerId: string,
  reason?: string
) {
  try {
    const result = await handlePlagiarismDecision(
      submissionIds,
      decision,
      lecturerId,
      reason
    );

    revalidatePath('/lecturer/assignments');
    
    return { success: true, message: result.message };
  } catch (error) {
    console.error('Error deciding plagiarism case:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process decision' 
    };
  }
}

/**
 * Automatically check plagiarism when assignment deadline passes
 * This should be called by a cron job or scheduled task
 */
export async function autoCheckPlagiarismAfterDeadline() {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Find assignments whose deadline just passed (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('id, created_by')
      .gte('deadline', oneHourAgo)
      .lte('deadline', now)
      .eq('plagiarism_check_enabled', true);

    if (error) throw error;

    const results = [];
    for (const assignment of assignments || []) {
      const result = await checkAssignmentPlagiarism(assignment.id);
      results.push(result);
    }

    return { 
      success: true, 
      message: `Checked ${assignments?.length || 0} assignments`,
      results 
    };
  } catch (error) {
    console.error('Error in auto plagiarism check:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Auto check failed' 
    };
  }
}