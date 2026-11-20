'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { QuestionForm, questionToFormValues, type QuestionFormValues } from '@/components/cbt/QuestionForm';
import { getQuestionById, updateQuestion } from '@/lib/actions/admin-cbt-courses.actions';

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const questionId = params.questionId as string;

  const [initial, setInitial] = useState<QuestionFormValues | null>(null);

  useEffect(() => {
    getQuestionById(questionId).then((res) => {
      if (res.success && res.question) setInitial(questionToFormValues(res.question));
      else {
        toast.error(('error' in res && res.error) || 'Question not found');
        router.push(`/admin/cbt/courses/${courseId}/questions`);
      }
    });
  }, [questionId, courseId, router]);

  if (!initial) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link href={`/admin/cbt/courses/${courseId}/questions`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to questions
      </Link>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Edit question</h1>

      <QuestionForm
        courseId={courseId}
        initial={initial}
        original={initial}
        submitLabel="Save changes"
        onCancel={() => router.push(`/admin/cbt/courses/${courseId}/questions`)}
        onSubmit={async (v, images) => {
          const res = await updateQuestion(questionId, {
            topicName: v.topicName,
            questionText: v.questionText,
            optionA: v.options.A,
            optionB: v.options.B,
            optionC: v.options.C,
            optionD: v.options.D,
            correctAnswer: v.correctAnswer,
            difficulty: v.difficulty,
            solution: v.solution,
            images,
          });
          if (res.success) {
            toast.success('Question updated');
            router.push(`/admin/cbt/courses/${courseId}/questions`);
          }
          return { success: !!res.success, error: res.success ? undefined : (res as { error?: string }).error };
        }}
      />
    </div>
  );
}
