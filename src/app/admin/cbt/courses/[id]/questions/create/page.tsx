'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { QuestionForm } from '@/components/cbt/QuestionForm';
import { createQuestion } from '@/lib/actions/admin-cbt-courses.actions';

export default function CreateQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link href={`/admin/cbt/courses/${courseId}/questions`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to questions
      </Link>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Add question</h1>

      <QuestionForm
        courseId={courseId}
        submitLabel="Save question"
        onCancel={() => router.push(`/admin/cbt/courses/${courseId}/questions`)}
        onSubmit={async (v, images) => {
          const res = await createQuestion({
            courseId,
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
            toast.success('Question added');
            router.push(`/admin/cbt/courses/${courseId}/questions`);
          }
          return { success: !!res.success, error: res.success ? undefined : (res as { error?: string }).error };
        }}
      />
    </div>
  );
}
