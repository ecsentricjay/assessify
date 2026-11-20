'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/services/cbt-access.service';
import { storeCbtImage } from '@/lib/services/cbt-images.service';

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

export interface QuestionImageInputs {
  question?: string | null;
  A?: string | null;
  B?: string | null;
  C?: string | null;
  D?: string | null;
  solution?: string | null;
}

type QuestionInput = {
  courseId: string;
  topicId?: string;
  /** Preferred: topic by name. Created in this subject if it doesn't exist yet. */
  topicName?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Each value may be an https URL, a Base64 data URI, raw <svg> markup, or an already-stored URL */
  images?: QuestionImageInputs;
};


/** Collapse whitespace so "Quadratic  Equations " and "quadratic equations" are the same topic */
const normaliseTopicName = (name: string) => name.trim().replace(/\s+/g, ' ');

/**
 * Find a topic by name in a subject (case-insensitive) or create it. Topics therefore never need to be
 * set up beforehand: typing one in the question form or putting it in the CSV is enough.
 */
async function resolveTopicId(
  client: Awaited<ReturnType<typeof createClient>>,
  courseId: string,
  rawName: string | null | undefined,
  cache?: Map<string, string>
): Promise<string | null> {
  const name = normaliseTopicName(rawName ?? '');
  if (!name) return null;
  const key = name.toLowerCase();

  let map = cache;
  if (!map) map = new Map();
  if (map.size === 0) {
    const { data: existing } = await client.from('cbt_topics').select('id, topic_name').eq('course_id', courseId);
    (existing ?? []).forEach((t: { id: string; topic_name: string }) => map!.set(normaliseTopicName(t.topic_name).toLowerCase(), t.id));
  }
  const found = map.get(key);
  if (found) return found;

  const { data: created, error } = await client
    .from('cbt_topics')
    .insert({ course_id: courseId, topic_name: name, question_count: 0 })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (created?.id) map.set(key, created.id);
  return created?.id ?? null;
}

async function resolveImages(images: QuestionImageInputs | undefined, courseId: string, cache?: Map<string, string>) {
  const [question, a, b, c, d, solution] = await Promise.all([
    storeCbtImage(images?.question, courseId, cache),
    storeCbtImage(images?.A, courseId, cache),
    storeCbtImage(images?.B, courseId, cache),
    storeCbtImage(images?.C, courseId, cache),
    storeCbtImage(images?.D, courseId, cache),
    storeCbtImage(images?.solution, courseId, cache),
  ]);
  return {
    question_image_url: question,
    option_a_image_url: a,
    option_b_image_url: b,
    option_c_image_url: c,
    option_d_image_url: d,
    solution_image_url: solution,
  };
}

function validateQuestionContent(d: Pick<QuestionInput, 'questionText' | 'optionA' | 'optionB' | 'optionC' | 'optionD' | 'correctAnswer' | 'difficulty'>, images?: QuestionImageInputs) {
  if (!['A', 'B', 'C', 'D'].includes(d.correctAnswer)) return 'Invalid correct answer';
  if (!['easy', 'medium', 'hard'].includes(d.difficulty)) return 'Invalid difficulty';
  if (!d.questionText?.trim() && !images?.question?.trim()) return 'Question needs text or a diagram';
  const opts = { A: d.optionA, B: d.optionB, C: d.optionC, D: d.optionD };
  for (const l of ['A', 'B', 'C', 'D'] as const) {
    if (!opts[l]?.trim() && !images?.[l]?.trim()) return `Option ${l} needs text or an image`;
  }
  return null;
}

export async function createQuestion(data: QuestionInput) {
  try {
    const admin = await requireAdmin();
    const client = await createClient();

    const invalid = validateQuestionContent(data, data.images);
    if (invalid) return { success: false, error: invalid };

    const imageColumns = await resolveImages(data.images, data.courseId);
    const topicId = data.topicName !== undefined ? await resolveTopicId(client, data.courseId, data.topicName) : data.topicId || null;

    const { data: question, error } = await client
      .from('cbt_questions')
      .insert({
        course_id: data.courseId,
        topic_id: topicId,
        question_text: data.questionText.trim(),
        option_a: data.optionA.trim(),
        option_b: data.optionB.trim(),
        option_c: data.optionC.trim(),
        option_d: data.optionD.trim(),
        correct_answer: data.correctAnswer,
        solution: data.solution?.trim() || null,
        difficulty: data.difficulty,
        is_active: true,
        created_by: admin.id,
        ...imageColumns,
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    revalidatePath(`/admin/cbt/courses/${data.courseId}/questions`);
    return { success: true, question };
  } catch (error) {
    return { success: false, error: (error as ActionError).message };
  }
}

export async function getQuestionById(questionId: string) {
  try {
    await requireAdmin();
    const client = await createClient();
    const { data: question, error } = await client.from('cbt_questions').select('*, cbt_topics(topic_name)').eq('id', questionId).maybeSingle();
    if (error) throw error;
    if (!question) return { success: false, error: 'Question not found' };
    return { success: true, question };
  } catch (error) {
    return { success: false, error: (error as ActionError).message };
  }
}

/**
 * Update a question. For each image: pass a new Base64/SVG/URL to replace it,
 * pass '' to remove it, or leave it undefined to keep the current one.
 */
export async function updateQuestion(
  questionId: string,
  data: Partial<{
    topicId: string | null;
    topicName: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    solution?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    images: QuestionImageInputs;
  }>
) {
  try {
    await requireAdmin();
    const client = await createClient();

    const { data: existing, error: fetchError } = await client
      .from('cbt_questions')
      .select('course_id')
      .eq('id', questionId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!existing) return { success: false, error: 'Question not found' };

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.topicName !== undefined) updateData.topic_id = await resolveTopicId(client, existing.course_id, data.topicName);
    else if (data.topicId !== undefined) updateData.topic_id = data.topicId || null;
    if (data.questionText !== undefined) updateData.question_text = data.questionText.trim();
    if (data.optionA !== undefined) updateData.option_a = data.optionA.trim();
    if (data.optionB !== undefined) updateData.option_b = data.optionB.trim();
    if (data.optionC !== undefined) updateData.option_c = data.optionC.trim();
    if (data.optionD !== undefined) updateData.option_d = data.optionD.trim();
    if (data.correctAnswer !== undefined) {
      if (!['A', 'B', 'C', 'D'].includes(data.correctAnswer)) return { success: false, error: 'Invalid correct answer' };
      updateData.correct_answer = data.correctAnswer;
    }
    if (data.solution !== undefined) updateData.solution = data.solution.trim() || null;
    if (data.difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(data.difficulty)) return { success: false, error: 'Invalid difficulty' };
      updateData.difficulty = data.difficulty;
    }

    if (data.images) {
      const cache = new Map<string, string>();
      const map: Array<[keyof QuestionImageInputs, string]> = [
        ['question', 'question_image_url'],
        ['A', 'option_a_image_url'],
        ['B', 'option_b_image_url'],
        ['C', 'option_c_image_url'],
        ['D', 'option_d_image_url'],
        ['solution', 'solution_image_url'],
      ];
      for (const [key, column] of map) {
        const value = data.images[key];
        if (value === undefined) continue;
        updateData[column] = await storeCbtImage(value, existing.course_id as string, cache); // '' -> null (removes)
      }
    }

    const { error } = await client.from('cbt_questions').update(updateData).eq('id', questionId);
    if (error) throw error;
    revalidatePath(`/admin/cbt/courses/${existing.course_id}/questions`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as ActionError).message };
  }
}

/** Manual single-image upload (file picker). Returns the stored public URL. */
export async function uploadCbtImage(formData: FormData) {
  try {
    await requireAdmin();
    const file = formData.get('file');
    const courseId = String(formData.get('courseId') ?? '');
    if (!(file instanceof File) || !courseId) return { success: false, error: 'Missing file or course' };

    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await storeCbtImage(`data:${file.type || 'application/octet-stream'};base64,${bytes.toString('base64')}`, courseId);
    return { success: true, url };
  } catch (error) {
    return { success: false, error: (error as ActionError).message };
  }
}

export async function deleteQuestion(questionId: string) {
  try {
    await requireAdmin();
    const client = await createClient();
    // A question already used in a student session is kept (history depends on it); deactivate it instead.
    const { data: answers } = await client.from('cbt_session_answers').select('id').eq('question_id', questionId).limit(1);
    const { data: legacy } = await client.from('cbt_practice_answers').select('id').eq('question_id', questionId).limit(1);
    if ((answers?.length ?? 0) > 0 || (legacy?.length ?? 0) > 0) {
      return { success: false, error: 'This question has student answers, so it cannot be deleted. Deactivate it instead.' };
    }

    const { error } = await client.from('cbt_questions').delete().eq('id', questionId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as ActionError).message };
  }
}

export async function getQuestionsByCourse(courseId: string, filters?: Record<string, any>) {
  const client = await createClient();
  try {
    // Page through results: Supabase returns at most 1000 rows per request
    const pageSize = 1000;
    const questions: any[] = [];
    for (let from = 0; ; from += pageSize) {
      let query = client
        .from('cbt_questions')
        .select('*, cbt_topics(topic_name)')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      questions.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }
    return { success: true, questions };
  } catch (error) {
    return { success: false, error: (error as ActionError).message };
  }
}

export async function toggleQuestionStatus(questionId: string) {
  try {
    await requireAdmin();
    const client = await createClient();
    const { data: question, error: fetchError } = await client.from('cbt_questions').select('is_active').eq('id', questionId).maybeSingle();
    if (fetchError) throw fetchError;
    if (!question) return { success: false, error: 'Question not found' };

    const { error: updateError } = await client.from('cbt_questions').update({ is_active: !question.is_active }).eq('id', questionId);
    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as ActionError).message };
  }
}

export interface BulkQuestionInput {
  rowNumber: number;
  topicName?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  solution?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  images?: QuestionImageInputs;
}

/**
 * Import a batch of questions. The client sends big CSVs in several small batches
 * (so request size and run time stay bounded); every batch is independent.
 * Images given as Base64 / raw SVG are uploaded to storage and replaced by their public URL.
 */
export async function bulkUploadQuestions(courseId: string, questions: BulkQuestionInput[]) {
  const errors: string[] = [];
  let imported = 0;

  try {
    const admin = await requireAdmin();
    const client = await createClient();

    const topicCache = new Map<string, string>();
    const imageCache = new Map<string, string>();

    const ready: Array<{ rowNumber: number; record: Record<string, unknown> }> = [];

    for (const q of questions) {
      try {
        const invalid = validateQuestionContent(q, q.images);
        if (invalid) throw new Error(invalid);

        const topicId = await resolveTopicId(client, courseId, q.topicName, topicCache);

        const imageColumns = await resolveImages(q.images, courseId, imageCache);

        ready.push({
          rowNumber: q.rowNumber,
          record: {
            course_id: courseId,
            topic_id: topicId,
            question_text: q.questionText.trim(),
            option_a: q.optionA.trim(),
            option_b: q.optionB.trim(),
            option_c: q.optionC.trim(),
            option_d: q.optionD.trim(),
            correct_answer: q.correctAnswer,
            solution: q.solution?.trim() || null,
            difficulty: q.difficulty,
            is_active: true,
            created_by: admin.id,
            ...imageColumns,
          },
        });
      } catch (error) {
        errors.push(`Row ${q.rowNumber}: ${(error as ActionError).message}`);
      }
    }

    if (ready.length > 0) {
      const { error: batchError } = await client.from('cbt_questions').insert(ready.map((r) => r.record));
      if (!batchError) {
        imported = ready.length;
      } else {
        // One bad row shouldn't sink the batch: retry individually to find it
        for (const r of ready) {
          const { error } = await client.from('cbt_questions').insert(r.record);
          if (error) errors.push(`Row ${r.rowNumber}: ${error.message}`);
          else imported++;
        }
      }
    }

    revalidatePath(`/admin/cbt/courses/${courseId}/questions`);
    return { success: true as const, imported, failed: questions.length - imported, errors };
  } catch (error) {
    return { success: false as const, error: (error as ActionError).message };
  }
}
