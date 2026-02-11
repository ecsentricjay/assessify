// src/components/student/assignment-writer-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { createAIAssignment, getAssignmentCostEstimate } from '@/lib/actions/assignment-ai.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Copy, Wallet, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

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
      } else {
        toast.error(result.error || 'Failed to generate assignment');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Assignment copied to clipboard!');
  };

  const handleReset = () => {
    setGeneratedContent('');
    setQuestion('');
    setAdditionalInfo('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
      <Card className="border-primary-blue bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary-blue dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-primary-dark dark:text-blue-100">
                How it works
              </p>
              <ul className="text-sm text-foreground dark:text-blue-200 space-y-1">
                <li>• ₦100 is charged per 1-2000 words generated</li>
                <li>• Each assignment is unique and plagiarism-free</li>
                <li>• Proper academic citations are included</li>
                <li>• Copy and paste the result into your document</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
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
              <p className="text-xs text-text-gray">
                Estimated cost: ₦{estimatedCost}
              </p>
            </div>

            {/* Citation Style */}
            <div className="space-y-2">
              <Label htmlFor="citationStyle">Citation/Referencing Style *</Label>
              <Select
                value={citationStyle}
                onValueChange={(value: any) => setCitationStyle(value)}
                disabled={isGenerating}
              >
                <SelectTrigger id="citationStyle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APA">APA (7th Edition)</SelectItem>
                  <SelectItem value="MLA">MLA (9th Edition)</SelectItem>
                  <SelectItem value="Harvard">Harvard</SelectItem>
                  <SelectItem value="Chicago">Chicago</SelectItem>
                  <SelectItem value="IEEE">IEEE</SelectItem>
                </SelectContent>
              </Select>
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Assignment</CardTitle>
                <CardDescription>
                  {generatedContent
                    ? `${actualWordCount} words • ₦${actualCost} charged`
                    : 'Your assignment will appear here'}
                </CardDescription>
              </div>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary-blue" />
                <div className="text-center space-y-2">
                  <p className="font-medium">Generating your assignment...</p>
                  <p className="text-sm text-text-gray">
                    This may take 30-60 seconds
                  </p>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium">Generation Complete</span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none max-h-[600px] overflow-y-auto p-4 bg-bg-light rounded-lg">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {generatedContent}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <Sparkles className="h-12 w-12 text-text-gray/50" />
                <p className="text-text-gray">
                  Fill in the form and click Generate to create your assignment
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}