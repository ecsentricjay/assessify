// src/lib/services/plagiarism.service.ts
'use server'

interface PlagiarismMatch {
  submission1_id: string;
  submission2_id: string;
  student1_id: string;
  student2_id: string;
  student1_name: string;
  student2_name: string;
  similarity_score: number;
  matched_text_snippets: string[];
}

interface PlagiarismResult {
  assignment_id: string;
  total_submissions: number;
  flagged_pairs: PlagiarismMatch[];
  checked_at: string;
}

/**
 * Calculate similarity between two texts using cosine similarity
 * This is a basic implementation - you can enhance with more sophisticated algorithms
 */
function calculateSimilarity(text1: string, text2: string): number {
  // Helper function - not exported, so doesn't need to be async
  // Normalize texts
  const normalize = (text: string) => 
    text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3); // Ignore short words

  const words1 = normalize(text1);
  const words2 = normalize(text2);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Create word frequency maps
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  words1.forEach(word => freq1.set(word, (freq1.get(word) || 0) + 1));
  words2.forEach(word => freq2.set(word, (freq2.get(word) || 0) + 1));

  // Get all unique words
  const allWords = new Set([...freq1.keys(), ...freq2.keys()]);

  // Calculate cosine similarity
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allWords.forEach(word => {
    const f1 = freq1.get(word) || 0;
    const f2 = freq2.get(word) || 0;
    
    dotProduct += f1 * f2;
    magnitude1 += f1 * f1;
    magnitude2 += f2 * f2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return (dotProduct / (magnitude1 * magnitude2)) * 100;
}

/**
 * Find matching text snippets between two submissions
 */
function findMatchingSnippets(text1: string, text2: string, minLength: number = 50): string[] {
  const snippets: string[] = [];
  const sentences1 = text1.split(/[.!?]+/).filter(s => s.trim().length > minLength);
  const sentences2 = text2.split(/[.!?]+/).filter(s => s.trim().length > minLength);

  sentences1.forEach(sent1 => {
    sentences2.forEach(sent2 => {
      const similarity = calculateSimilarity(sent1, sent2);
      if (similarity > 80) { // 80% similar sentences
        snippets.push(sent1.trim().substring(0, 100) + '...');
      }
    });
  });

  return [...new Set(snippets)].slice(0, 3); // Return top 3 unique snippets
}

/**
 * Check for plagiarism among assignment submissions
 */
export async function detectPlagiarism(
  assignmentId: string,
  similarityThreshold: number = 70
): Promise<PlagiarismResult> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  try {
    // Get all submissions for the assignment
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select(`
        id,
        student_id,
        submission_text,
        plagiarism_score,
        plagiarism_report,
        profiles!assignment_submissions_student_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('assignment_id', assignmentId)
      .eq('status', 'submitted');

    if (submissionsError) throw submissionsError;
    if (!submissions || submissions.length < 2) {
      return {
        assignment_id: assignmentId,
        total_submissions: submissions?.length || 0,
        flagged_pairs: [],
        checked_at: new Date().toISOString()
      };
    }

    const flaggedPairs: PlagiarismMatch[] = [];

    // Compare each submission with every other submission
    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const sub1 = submissions[i];
        const sub2 = submissions[j];

        if (!sub1.submission_text || !sub2.submission_text) continue;

        const similarity = calculateSimilarity(
          sub1.submission_text,
          sub2.submission_text
        );

        if (similarity >= similarityThreshold) {
          const matchedSnippets = findMatchingSnippets(
            sub1.submission_text,
            sub2.submission_text
          );

          flaggedPairs.push({
            submission1_id: sub1.id,
            submission2_id: sub2.id,
            student1_id: sub1.student_id,
            student2_id: sub2.student_id,
            student1_name: `${sub1.profiles[0].first_name} ${sub1.profiles[0].last_name}`,
            student2_name: `${sub2.profiles[0].first_name} ${sub2.profiles[0].last_name}`,
            similarity_score: Math.round(similarity),
            matched_text_snippets: matchedSnippets
          });

          // Update individual submissions with plagiarism scores
          await supabase
            .from('assignment_submissions')
            .update({
              plagiarism_score: similarity,
              plagiarism_report: {
                matched_with: sub2.id,
                similarity: similarity,
                checked_at: new Date().toISOString()
              }
            })
            .eq('id', sub1.id);

          await supabase
            .from('assignment_submissions')
            .update({
              plagiarism_score: similarity,
              plagiarism_report: {
                matched_with: sub1.id,
                similarity: similarity,
                checked_at: new Date().toISOString()
              }
            })
            .eq('id', sub2.id);
        }
      }
    }

    return {
      assignment_id: assignmentId,
      total_submissions: submissions.length,
      flagged_pairs: flaggedPairs.sort((a, b) => b.similarity_score - a.similarity_score),
      checked_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Plagiarism detection error:', error);
    throw new Error('Failed to detect plagiarism');
  }
}

/**
 * Handle lecturer's decision on plagiarism flags
 */
export async function handlePlagiarismDecision(
  submissionIds: string[],
  decision: 'ignore' | 'reject',
  lecturerId: string,
  reason?: string
) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  try {
    if (decision === 'ignore') {
      // Mark submissions as cleared and proceed with grading
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          plagiarism_report: {
            status: 'cleared',
            cleared_by: lecturerId,
            cleared_at: new Date().toISOString()
          }
        })
        .in('id', submissionIds);

      if (error) throw error;

      // Submissions can now be graded normally
      return { success: true, message: 'Submissions cleared for grading' };
    } else {
      // Reject submissions for plagiarism
      const { data: submissions, error: fetchError } = await supabase
        .from('assignment_submissions')
        .select('student_id, assignment_id')
        .in('id', submissionIds);

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('assignment_submissions')
        .update({
          status: 'rejected',
          plagiarism_report: {
            status: 'rejected',
            rejected_by: lecturerId,
            rejected_at: new Date().toISOString(),
            reason: reason || 'Flagged for plagiarism'
          },
          final_score: 0,
          lecturer_feedback: `Submission rejected due to plagiarism. ${reason || ''}`
        })
        .in('id', submissionIds);

      if (updateError) throw updateError;

      // Send notifications to affected students
      for (const submission of submissions) {
        await supabase.from('notifications').insert({
          user_id: submission.student_id,
          type: 'submission_rejected',
          title: 'Assignment Submission Rejected',
          message: `Your submission has been rejected due to plagiarism. Reason: ${reason || 'Similar content detected with another submission.'}`,
          link: `/student/assignments/${submission.assignment_id}`
        });
      }

      return { success: true, message: 'Submissions rejected for plagiarism' };
    }
  } catch (error) {
    console.error('Error handling plagiarism decision:', error);
    throw new Error('Failed to process plagiarism decision');
  }
}

/**
 * Notify lecturer about flagged submissions after deadline
 */
export async function notifyLecturerOfPlagiarism(
  assignmentId: string,
  lecturerId: string,
  flaggedCount: number
) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  try {
    await supabase.from('notifications').insert({
      user_id: lecturerId,
      type: 'plagiarism_detected',
      title: 'Plagiarism Detected in Submissions',
      message: `${flaggedCount} submission pair(s) have been flagged for potential plagiarism. Please review them.`,
      link: `/lecturer/assignments/${assignmentId}/plagiarism`,
      metadata: {
        assignment_id: assignmentId,
        flagged_count: flaggedCount
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error notifying lecturer:', error);
    throw error;
  }
}