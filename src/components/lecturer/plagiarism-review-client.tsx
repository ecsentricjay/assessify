// src/components/lecturer/plagiarism-review-client.tsx
'use client';

import { useState } from 'react';
import { decidePlagiarismCase } from '@/lib/actions/plagiarism.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

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

interface PlagiarismData {
  assignment_id: string;
  total_submissions: number;
  flagged_pairs: PlagiarismMatch[];
  checked_at: string;
}

export default function PlagiarismReviewClient({
  assignmentId,
  lecturerId,
  plagiarismData,
}: {
  assignmentId: string;
  lecturerId: string;
  plagiarismData: PlagiarismData;
}) {
  const [processingPairs, setProcessingPairs] = useState<Set<string>>(new Set());
  const [decidedPairs, setDecidedPairs] = useState<Set<string>>(new Set());
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const handleDecision = async (
    match: PlagiarismMatch,
    decision: 'ignore' | 'reject'
  ) => {
    const pairKey = `${match.submission1_id}-${match.submission2_id}`;
    setProcessingPairs(prev => new Set(prev).add(pairKey));

    try {
      const result = await decidePlagiarismCase(
        [match.submission1_id, match.submission2_id],
        decision,
        lecturerId,
        decision === 'reject' ? rejectionReasons[pairKey] : undefined
      );

      if (result.success) {
        toast.success(result.message);
        setDecidedPairs(prev => new Set(prev).add(pairKey));
      } else {
        toast.error(result.error || 'Failed to process decision');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setProcessingPairs(prev => {
        const newSet = new Set(prev);
        newSet.delete(pairKey);
        return newSet;
      });
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 90) return 'destructive';
    if (score >= 80) return 'default';
    return 'secondary';
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 90) return 'Very High';
    if (score >= 80) return 'High';
    if (score >= 70) return 'Moderate';
    return 'Low';
  };

  if (plagiarismData.flagged_pairs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Plagiarism Detected</h3>
            <p className="text-muted-foreground">
              All {plagiarismData.total_submissions} submissions appear to be unique.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Found {plagiarismData.flagged_pairs.length} potential plagiarism case(s) among{' '}
            {plagiarismData.total_submissions} submissions
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {plagiarismData.flagged_pairs.map((match, index) => {
          const pairKey = `${match.submission1_id}-${match.submission2_id}`;
          const isProcessing = processingPairs.has(pairKey);
          const isDecided = decidedPairs.has(pairKey);

          return (
            <Card key={pairKey} className={isDecided ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      Case #{index + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(match.similarity_score)}>
                        {match.similarity_score}% Similar
                      </Badge>
                      <Badge variant="outline">
                        {getSeverityLabel(match.similarity_score)} Risk
                      </Badge>
                    </div>
                  </div>
                  {isDecided && (
                    <Badge variant="secondary" className="ml-2">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Decided
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Students Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Student 1</p>
                    <p className="text-lg">{match.student1_name}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Student 2</p>
                    <p className="text-lg">{match.student2_name}</p>
                  </div>
                </div>

                {/* Matched Snippets */}
                {match.matched_text_snippets.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <p className="text-sm font-medium">Matching Content:</p>
                    </div>
                    <div className="space-y-2">
                      {match.matched_text_snippets.map((snippet, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded text-sm"
                        >
                          {snippet}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection Reason (only when rejecting) */}
                {!isDecided && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Rejection Reason (optional)
                    </label>
                    <Textarea
                      placeholder="Provide a reason if rejecting these submissions..."
                      value={rejectionReasons[pairKey] || ''}
                      onChange={(e) =>
                        setRejectionReasons(prev => ({
                          ...prev,
                          [pairKey]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {!isDecided && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDecision(match, 'ignore')}
                      disabled={isProcessing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Ignore & Allow Grading
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDecision(match, 'reject')}
                      disabled={isProcessing}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject for Plagiarism
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}