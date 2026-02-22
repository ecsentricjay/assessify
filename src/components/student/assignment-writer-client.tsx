// src/components/student/assignment-writer-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { createAIAssignment, getAssignmentCostEstimate, getPreviousAIAssignments, getAIAssignmentById, deleteAIAssignment } from '@/lib/actions/assignment-ai.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Copy, Wallet, AlertCircle, Loader2, CheckCircle, Clock, Eye, Trash2, RefreshCw, Download } from 'lucide-react';
import { FormattedAssignmentContent } from './formatted-assignment-content';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AIAssignment {
  id: string;
  question: string;
  course_of_study: string;
  course_name: string;
  word_count: number;
  citation_style: string;
  additional_info?: string;
  generated_content: string;
  actual_word_count: number;
  cost: number;
  created_at: string;
}

export default function AssignmentWriterClient({
  userId,
  initialBalance,
}: {
  userId: string;
  initialBalance: number;
}) {
  const [question, setQuestion] = useState('');
  const [courseOfStudy, setCourseOfStudy] = useState('');
  const [courseName, setCourseName] = useState('');
  const [wordCount, setWordCount] = useState(1000);
  const [citationStyle, setCitationStyle] = useState<'APA' | 'MLA' | 'Harvard' | 'Chicago' | 'IEEE'>('APA');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(100);
  const [balance, setBalance] = useState(initialBalance);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [actualWordCount, setActualWordCount] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [previousAssignments, setPreviousAssignments] = useState<AIAssignment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [viewingAssignment, setViewingAssignment] = useState<AIAssignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Update cost estimate when word count changes
  useEffect(() => {
    const updateCost = async () => {
      const result = await getAssignmentCostEstimate(wordCount);
      if (result.success) {
        setEstimatedCost(result.cost);
      }
    };
    updateCost();
  }, [wordCount]);

  // Fetch previous assignments on component mount
  const loadPreviousAssignments = async () => {
    setIsLoadingHistory(true);
    const result = await getPreviousAIAssignments(userId, 20);
    if (result.success) {
      setPreviousAssignments(result.assignments);
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    loadPreviousAssignments();
  }, [userId]);

  const handleGenerate = async () => {
    // Validation
    if (!question.trim()) {
      toast.error('Please enter the assignment question');
      return;
    }
    if (!courseOfStudy.trim()) {
      toast.error('Please enter your course of study');
      return;
    }
    if (!courseName.trim()) {
      toast.error('Please enter the course name');
      return;
    }
    if (wordCount < 100 || wordCount > 10000) {
      toast.error('Word count must be between 100 and 10,000');
      return;
    }
    if (balance < estimatedCost) {
      toast.error(`Insufficient balance. You need ₦${estimatedCost} but have ₦${balance}`);
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const result = await createAIAssignment(userId, {
        question,
        courseOfStudy,
        courseName,
        wordCount,
        citationStyle,
        additionalInfo,
      });

      if (result.success && result.data) {
        setGeneratedContent(result.data.content);
        setActualWordCount(result.data.wordCount);
        setActualCost(result.data.cost);
        setBalance(result.data.newBalance || balance - result.data.cost);
        toast.success(`Assignment generated successfully! ₦${result.data.cost} deducted from your wallet.`);
        
        // Reload history to show new assignment
        loadPreviousAssignments();
      } else {
        toast.error(result.error || 'Failed to generate assignment');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (content?: string) => {
    const textToCopy = content || generatedContent;
    navigator.clipboard.writeText(textToCopy);
    toast.success('Assignment copied to clipboard!');
  };

  const handleReset = () => {
    setGeneratedContent('');
    setQuestion('');
    setAdditionalInfo('');
  };

  const handleViewAssignment = async (assignmentId: string) => {
    const result = await getAIAssignmentById(assignmentId);
    if (result.success && result.assignment) {
      setViewingAssignment(result.assignment);
    } else {
      toast.error('Failed to load assignment');
    }
  };

  const handleReuseAssignment = (assignment: AIAssignment) => {
    setQuestion(assignment.question);
    setCourseOfStudy(assignment.course_of_study);
    setCourseName(assignment.course_name);
    setWordCount(assignment.word_count);
    setCitationStyle(assignment.citation_style as any);
    setAdditionalInfo(assignment.additional_info || '');
    toast.info('Assignment details loaded. Modify as needed and generate.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    const result = await deleteAIAssignment(assignmentId);
    if (result.success) {
      toast.success('Assignment deleted');
      setPreviousAssignments(prev => prev.filter(a => a.id !== assignmentId));
      setDeletingId(null);
    } else {
      toast.error(result.error || 'Failed to delete assignment');
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Assignment downloaded');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Assignment Writer
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate high-quality academic assignments with AI assistance
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Wallet Balance</p>
                <p className="text-2xl font-bold">₦{balance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900">How it works</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• ₦100 for 1-1000 words</li>
                <li>• ₦200 for 1001-2000 words</li>
                <li>• ₦300 for 2001-3000 words (and so on...)</li>
                <li>• Each assignment is unique and plagiarism-free</li>
                <li>• Proper academic citations are included</li>
                <li>• All previous assignments are saved in your history</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Form - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                Fill in the details to generate your assignment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignment Question */}
              <div className="space-y-2">
                <Label htmlFor="question">Assignment Question/Topic *</Label>
                <Textarea
                  id="question"
                  placeholder="E.g., Discuss the impact of artificial intelligence on modern healthcare systems"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  disabled={isGenerating}
                />
              </div>

              {/* Course of Study */}
              <div className="space-y-2">
                <Label htmlFor="courseOfStudy">Course of Study *</Label>
                <Input
                  id="courseOfStudy"
                  placeholder="E.g., Computer Science, Medicine, Business Administration"
                  value={courseOfStudy}
                  onChange={(e) => setCourseOfStudy(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              {/* Course Name */}
              <div className="space-y-2">
                <Label htmlFor="courseName">Course Name *</Label>
                <Input
                  id="courseName"
                  placeholder="E.g., Introduction to AI, Medical Ethics"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Word Count */}
                <div className="space-y-2">
                  <Label htmlFor="wordCount">Number of Words *</Label>
                  <Input
                    id="wordCount"
                    type="number"
                    min={100}
                    max={10000}
                    step={100}
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Estimated: ₦{estimatedCost}
                  </p>
                </div>

                {/* Citation Style */}
                <div className="space-y-2">
                  <Label htmlFor="citationStyle">Citation Style *</Label>
                  <Select
                    value={citationStyle}
                    onValueChange={(value: any) => setCitationStyle(value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger id="citationStyle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APA">APA</SelectItem>
                      <SelectItem value="MLA">MLA</SelectItem>
                      <SelectItem value="Harvard">Harvard</SelectItem>
                      <SelectItem value="Chicago">Chicago</SelectItem>
                      <SelectItem value="IEEE">IEEE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Any specific instructions, focus areas, or additional context..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              {/* Generate Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || balance < estimatedCost}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Assignment (₦{estimatedCost})
                  </>
                )}
              </Button>

              {balance < estimatedCost && (
                <p className="text-sm text-destructive text-center">
                  Insufficient balance. Please fund your wallet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Output Area */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Assignment</CardTitle>
                    <CardDescription>
                      {actualWordCount} words • ₦{actualCost} charged
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopy()}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownload(generatedContent, `assignment-${Date.now()}`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Generation Complete</span>
                  </div>
                  <div className="prose prose-sm max-w-none max-h-[600px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
                    <FormattedAssignmentContent content={generatedContent} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Panel - 1 column */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <CardTitle>History</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadPreviousAssignments}
                  disabled={isLoadingHistory}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <CardDescription>
                Your past AI-generated assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : previousAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No assignments yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {previousAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">
                              {assignment.question}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {assignment.course_name}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {assignment.actual_word_count}w
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {new Date(assignment.created_at).toLocaleDateString()}
                          </span>
                          <span>₦{assignment.cost}</span>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleViewAssignment(assignment.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => handleReuseAssignment(assignment)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reuse
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:bg-destructive hover:text-white"
                            onClick={() => setDeletingId(assignment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Assignment Dialog */}
      <Dialog open={!!viewingAssignment} onOpenChange={() => setViewingAssignment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewingAssignment?.question}</DialogTitle>
            <DialogDescription>
              {viewingAssignment?.course_name} • {viewingAssignment?.actual_word_count} words • ₦{viewingAssignment?.cost}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg">
              {viewingAssignment && (
                <FormattedAssignmentContent content={viewingAssignment.generated_content} />
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => viewingAssignment && handleCopy(viewingAssignment.generated_content)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => viewingAssignment && handleDownload(
                viewingAssignment.generated_content,
                `${viewingAssignment.course_name}-${Date.now()}`
              )}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (viewingAssignment) {
                  handleReuseAssignment(viewingAssignment);
                  setViewingAssignment(null);
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reuse
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this assignment from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deletingId && handleDeleteAssignment(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}