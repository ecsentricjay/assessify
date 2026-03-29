// src/app/student/assignment-writer/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AssignmentWriterClient from '@/components/student/assignment-writer-client';

export const metadata = {
  title: 'AI Assignment Writer | Assessify',
  description: 'Generate academic assignments with AI assistance',
};

export default async function AssignmentWriterPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'student') {
    redirect('/');
  }

  // Get wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="container mx-auto py-8">
      <AssignmentWriterClient
        userId={user.id}
        initialBalance={wallet?.balance || 0}
      />
    </div>
  );
}