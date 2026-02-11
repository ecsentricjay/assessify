"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkAIGradingProps {
  onGradeAll: (rubric?: string) => Promise<{
    success: boolean;
    score?: number;
    feedback?: string;
    error?: string;
  }>;
  itemCount?: number;
  itemType?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
}

export default function BulkAIGrading({
  onGradeAll,
  itemCount = 0,
  itemType = "items",
  label = "AI Grade All",
  variant = "default",
  size = "default",
  disabled = false,
}: BulkAIGradingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [customRubric, setCustomRubric] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    score?: number;
    feedback?: string;
    error?: string;
  } | null>(null);

  const handleGrade = async () => {
    setIsGrading(true);
    setResult(null);

    try {
      const res = await onGradeAll(customRubric || undefined);
      setResult(res);

      if (res.success) {
        toast.success(`AI Grading Complete for all ${itemCount} ${itemType}!`);
        setTimeout(() => {
          setIsOpen(false);
          setCustomRubric("");
          setResult(null);
        }, 2000);
      } else {
        toast.error(res.error || "Failed to grade");
      }
    } catch (error) {
      console.error("AI grading error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled}>
          <Sparkles className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Powered Grading
          </DialogTitle>
          <DialogDescription>
            Use AI to automatically grade all {itemCount} {itemType}. You can provide a custom grading
            guide or use the default rubric.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Custom Rubric Input */}
          <div className="space-y-2">
            <Label htmlFor="rubric">
              Custom Grading Guide (Optional)
            </Label>
            <Textarea
              id="rubric"
              placeholder="Example: Focus on clarity of argument, use of evidence, and proper citation. Deduct points for grammatical errors..."
              value={customRubric}
              onChange={(e) => setCustomRubric(e.target.value)}
              rows={6}
              disabled={isGrading}
            />
            <p className="text-xs text-muted-foreground">
              Provide specific instructions on what to look for when grading. Leave empty to use the default rubric.
            </p>
          </div>

          {/* Default Rubric Info */}
          {!customRubric && (
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Default Rubric:</strong>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>• Content Quality (40%): Relevance, accuracy, depth</li>
                  <li>• Structure & Organization (25%): Logical flow, clarity</li>
                  <li>• Critical Thinking (20%): Analysis, reasoning</li>
                  <li>• Language & Grammar (15%): Clarity, grammar</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Result Display */}
          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className={result.success ? "border-green-500 bg-green-50" : ""}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.success ? (
                  <div>
                    <p className="font-semibold text-green-800">
                      Grading Complete! Score: {result.score}
                    </p>
                    {result.feedback && (
                      <p className="mt-2 text-sm text-green-700">
                        {result.feedback.substring(0, 200)}...
                      </p>
                    )}
                  </div>
                ) : (
                  <p>{result.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isGrading}
          >
            Cancel
          </Button>
          <Button onClick={handleGrade} disabled={isGrading}>
            {isGrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Grading...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Grade with AI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}