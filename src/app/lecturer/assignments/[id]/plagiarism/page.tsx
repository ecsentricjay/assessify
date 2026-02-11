// src/app/lecturer/assignments/[id]/plagiarism/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getFlaggedSubmissions } from '@/lib/actions/plagiarism.actions';
import PlagiarismReviewClient from '@/components/lecturer/plagiarism-review-client';

export default async function PlagiarismReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'lecturer') {
    redirect('/');
  }

  // Get assignment details
  const { data: assignment } = await supabase
    .from('assignments')
    .select(`
      *,
      courses (
        course_code,
        course_title
      )
    `)
    .eq('id', params.id)
    .single();

  if (!assignment) {
    redirect('/lecturer/assignments');
  }

  // Get flagged submissions
  const plagiarismResult = await getFlaggedSubmissions(params.id);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Plagiarism Review</h1>
        <p className="text-muted-foreground mt-2">
          Assignment: {assignment.title}
        </p>
        {assignment.courses && (
          <p className="text-sm text-muted-foreground">
            {assignment.courses.course_code} - {assignment.courses.course_title}
          </p>
        )}
      </div>

      {plagiarismResult.success && plagiarismResult.data ? (
        <PlagiarismReviewClient
          assignmentId={params.id}
          lecturerId={user.id}
          plagiarismData={plagiarismResult.data}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {plagiarismResult.error || 'No plagiarism data available'}
          </p>
        </div>
      )}
    </div>
  );
}