'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { revalidatePath } from 'next/cache';

interface ActionError extends Error {
  message: string;
}

// Admin Access Checker
async function checkAdminAccess() {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== 'admin') {
    return { authorized: false, error: 'Unauthorized access' };
  }
  return { authorized: true, user };
}

// COURSE Management Functions
export async function createCourse(data: { courseCode: string; courseTitle: string; description: string }) {
  const client = await createClient();
  try {
    const { data: course, error } = await client.from('cbt_courses').insert({
      course_code: data.courseCode,
      course_title: data.courseTitle,
      description: data.description,
      is_active: true,
    }).select().maybeSingle();
    if (error) throw error;
    return { success: true, course };
  } catch (error) {
    console.log('[createCourse]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function updateCourse(courseId: string, data: Partial<{ courseCode: string; courseTitle: string; description: string }>) {
  const client = await createClient();
  try {
    const updateData: Record<string, any> = {};
    if (data.courseCode !== undefined) updateData.course_code = data.courseCode;
    if (data.courseTitle !== undefined) updateData.course_title = data.courseTitle;
    if (data.description !== undefined) updateData.description = data.description;

    const { error } = await client.from('cbt_courses').update(updateData).eq('id', courseId);
    if (error) throw error;
    revalidatePath('/admin/cbt');
    return { success: true };
  } catch (error) {
    console.log('[updateCourse]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function deleteCourse(courseId: string) {
  const client = await createClient();
  try {
    const { data: questions } = await client.from('cbt_questions').select('id').eq('course_id', courseId);
    if ((questions?.length ?? 0) > 0) {
      return { success: false, error: 'Cannot delete course with existing questions' };
    }

    // FIX: was querying non-existent 'subscriptions' table
    const { data: subscriptions } = await client.from('cbt_student_subscriptions').select('id').eq('course_id', courseId);
    if ((subscriptions?.length ?? 0) > 0) {
      return { success: false, error: 'Cannot delete course with active subscriptions' };
    }

    const { error } = await client.from('cbt_courses').delete().eq('id', courseId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.log('[deleteCourse]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function getAllCourses(filters?: Record<string, any>) {
  const client = await createClient();
  try {
    const query = client.from('cbt_courses').select('*, question_count').order('created_at', { ascending: false });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query.eq(key, value);
      });
    }
    const { data: courses, error } = await query;
    if (error) throw error;
    return { success: true, courses };
  } catch (error) {
    console.log('[getAllCourses]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function getCourseById(courseId: string) {
  const client = await createClient();
  try {
    // FIX: was 'topics(*)' — correct table name is 'cbt_topics'
    const { data: course, error } = await client
      .from('cbt_courses')
      .select('*, cbt_topics(*, question_count)')
      .eq('id', courseId)
      .maybeSingle();
    if (error) throw error;
    return { success: true, course };
  } catch (error) {
    console.log('[getCourseById]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function toggleCourseStatus(courseId: string) {
  const client = await createClient();
  try {
    const { data: course, error: fetchError } = await client.from('cbt_courses').select('is_active').eq('id', courseId).maybeSingle();
    if (fetchError) throw fetchError;
    if (!course) return { success: false, error: 'Course not found' };

    const { error: updateError } = await client.from('cbt_courses').update({ is_active: !course.is_active }).eq('id', courseId);
    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.log('[toggleCourseStatus]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

// TOPIC Management Functions
export async function createTopic(courseId: string, topicName: string) {
  const client = await createClient();
  try {
    // FIX: column is 'topic_name', not 'name'
    const { data: topic, error } = await client.from('cbt_topics').insert({
      course_id: courseId,
      topic_name: topicName,
      question_count: 0,
    }).select().maybeSingle();
    if (error) throw error;
    return { success: true, topic };
  } catch (error) {
    console.log('[createTopic]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function updateTopic(topicId: string, topicName: string) {
  const client = await createClient();
  try {
    // FIX: column is 'topic_name', not 'name'
    const { error } = await client.from('cbt_topics').update({ topic_name: topicName }).eq('id', topicId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.log('[updateTopic]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function deleteTopic(topicId: string) {
  const client = await createClient();
  try {
    const { data: questions } = await client.from('cbt_questions').select('id').eq('topic_id', topicId);
    if ((questions?.length ?? 0) > 0) {
      return { success: false, error: 'Cannot delete topic with existing questions' };
    }

    const { error } = await client.from('cbt_topics').delete().eq('id', topicId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.log('[deleteTopic]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function getTopicsByCourse(courseId: string) {
  const client = await createClient();
  try {
    // FIX: select 'topic_name' explicitly so the UI receives the correct field
    const { data: topics, error } = await client
      .from('cbt_topics')
      .select('id, topic_name, question_count, created_at, updated_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    // Remap topic_name -> name so the UI interface stays compatible
    const mapped = (topics ?? []).map((t) => ({
      ...t,
      name: t.topic_name,
    }));
    return { success: true, topics: mapped };
  } catch (error) {
    console.log('[getTopicsByCourse]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

// QUESTION Management Functions
export async function createQuestion(data: {
  courseId: string;
  topicId?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}) {
  const client = await createClient();
  try {
    if (!['A', 'B', 'C', 'D'].includes(data.correctAnswer)) {
      return { success: false, error: 'Invalid correctAnswer value' };
    }
    if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
      return { success: false, error: 'Invalid difficulty value' };
    }

    const { data: question, error } = await client.from('cbt_questions').insert({
      course_id: data.courseId,
      topic_id: data.topicId,
      question_text: data.questionText,
      option_a: data.optionA,
      option_b: data.optionB,
      option_c: data.optionC,
      option_d: data.optionD,
      correct_answer: data.correctAnswer,
      solution: data.solution,
      difficulty: data.difficulty,
      is_active: true,
    }).select().maybeSingle();
    if (error) throw error;
    return { success: true, question };
  } catch (error) {
    console.log('[createQuestion]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function updateQuestion(questionId: string, data: Partial<{
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}>) {
  const client = await createClient();
  try {
    const updateData: Record<string, any> = {};
    if (data.questionText !== undefined) updateData.question_text = data.questionText;
    if (data.optionA !== undefined) updateData.option_a = data.optionA;
    if (data.optionB !== undefined) updateData.option_b = data.optionB;
    if (data.optionC !== undefined) updateData.option_c = data.optionC;
    if (data.optionD !== undefined) updateData.option_d = data.optionD;
    if (data.correctAnswer !== undefined) updateData.correct_answer = data.correctAnswer;
    if (data.solution !== undefined) updateData.solution = data.solution;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;

    const { error } = await client.from('cbt_questions').update(updateData).eq('id', questionId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.log('[updateQuestion]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function deleteQuestion(questionId: string) {
  const client = await createClient();
  try {
    // FIX: 'active_sessions' doesn't exist; check cbt_practice_answers instead
    const { data: answers } = await client.from('cbt_practice_answers').select('id').eq('question_id', questionId).limit(1);
    if ((answers?.length ?? 0) > 0) {
      return { success: false, error: 'Cannot delete question used in active sessions' };
    }

    const { error } = await client.from('cbt_questions').delete().eq('id', questionId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.log('[deleteQuestion]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function getQuestionsByCourse(courseId: string, filters?: Record<string, any>) {
  const client = await createClient();
  try {
    // FIX: was 'topic(name)' — correct join is 'cbt_topics(topic_name)'
    const query = client
      .from('cbt_questions')
      .select('*, cbt_topics(topic_name)')
      .eq('course_id', courseId);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query.eq(key, value);
      });
    }
    const { data: questions, error } = await query;
    if (error) throw error;
    return { success: true, questions };
  } catch (error) {
    console.log('[getQuestionsByCourse]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function toggleQuestionStatus(questionId: string) {
  const client = await createClient();
  try {
    const { data: question, error: fetchError } = await client.from('cbt_questions').select('is_active').eq('id', questionId).maybeSingle();
    if (fetchError) throw fetchError;
    if (!question) return { success: false, error: 'Question not found' };

    const { error: updateError } = await client.from('cbt_questions').update({ is_active: !question.is_active }).eq('id', questionId);
    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.log('[toggleQuestionStatus]', error);
    return { success: false, error: (error as ActionError).message };
  }
}

export async function bulkUploadQuestions(courseId: string, questions: Array<{
  topicName?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}>) {
  const client = await createClient();
  const errors: string[] = [];
  let imported = 0;

  try {
    for (const question of questions) {
      try {
        let topicId: string | undefined;

        if (question.topicName) {
          // First try to find an existing topic with this name in the course
          const { data: existingTopic } = await client
            .from('cbt_topics')
            .select('id')
            .eq('course_id', courseId)
            .eq('topic_name', question.topicName)
            .maybeSingle();

          if (existingTopic) {
            topicId = existingTopic.id;
          } else {
            // Create it fresh if it doesn't exist
            const { data: newTopic, error: topicError } = await client
              .from('cbt_topics')
              .insert({ course_id: courseId, topic_name: question.topicName, question_count: 0 })
              .select()
              .maybeSingle();
            if (topicError) throw topicError;
            topicId = newTopic?.id;
          }
        }

        const { error: questionError } = await client.from('cbt_questions').insert({
          course_id: courseId,
          topic_id: topicId,
          question_text: question.questionText,
          option_a: question.optionA,
          option_b: question.optionB,
          option_c: question.optionC,
          option_d: question.optionD,
          correct_answer: question.correctAnswer,
          solution: question.solution,
          difficulty: question.difficulty,
          is_active: true,
        });
        if (questionError) throw questionError;
        imported++;
      } catch (error) {
        errors.push((error as ActionError).message);
      }
    }

    return { imported, failed: questions.length - imported, errors };
  } catch (error) {
    console.log('[bulkUploadQuestions]', error);
    return { success: false, error: (error as ActionError).message };
  }
}