// lib/actions/question.actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth.actions'
import { revalidatePath } from 'next/cache'
import { checkTestAccess } from './access-control'
import type { CreateQuestionData, QuestionWithOptions, CSVQuestionRow } from '@/lib/types/test.types'
import type { ExtractedQuestion } from "@/lib/services/claude.service";

/**
 * Create a single question with options
 * Access: Lecturer who created the test
 */
export async function createQuestion(testId: string, questionData: CreateQuestionData) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { success: false, error: 'Unauthorized access' }
    }

    const supabase = await createClient()

    // Verify test ownership and access
    const { data: test } = await supabase
      .from('tests')
      .select('created_by')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { success: false, error: 'Test not found or you do not have permission to add questions' }
    }

    // Get current max order_index
    const { data: maxOrder } = await supabase
      .from('questions')
      .select('order_index')
      .eq('test_id', testId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = (maxOrder?.order_index || 0) + 1

    // Create question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        test_id: testId,
        question_type: questionData.question_type,
        question_text: questionData.question_text,
        question_image_url: questionData.question_image_url,
        marks: questionData.marks,
        order_index: nextOrderIndex,
        explanation: questionData.explanation,
      })
      .select()
      .single()

    if (questionError) {
      console.error('Error creating question:', questionError)
      return { success: false, error: 'Failed to create question' }
    }

    // Create options if provided (for MCQ and True/False)
    if (questionData.options && questionData.options.length > 0) {
      const optionsToInsert = questionData.options.map((opt, index) => ({
        question_id: question.id,
        option_text: opt.option_text,
        option_image_url: opt.option_image_url,
        is_correct: opt.is_correct,
        order_index: index + 1,
      }))

      const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsToInsert)

      if (optionsError) {
        console.error('Error creating options:', optionsError)
        // Rollback question creation
        await supabase.from('questions').delete().eq('id', question.id)
        return { success: false, error: 'Failed to create question options' }
      }
    }

    revalidatePath(`/lecturer/tests/${testId}`)
    return { success: true, question }
  } catch (error) {
    console.error('Error in createQuestion:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk create questions from CSV or array
 * Access: Lecturer who created the test
 */
export async function bulkCreateQuestions(testId: string, questions: CreateQuestionData[]) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { success: false, error: 'Unauthorized access' }
    }

    const supabase = await createClient()

    // Verify test ownership and access
    const { data: test } = await supabase
      .from('tests')
      .select('created_by')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { success: false, error: 'Test not found or you do not have permission to add questions' }
    }

    // Get current max order_index
    const { data: maxOrder } = await supabase
      .from('questions')
      .select('order_index')
      .eq('test_id', testId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    let currentOrderIndex = (maxOrder?.order_index || 0) + 1

    const createdQuestions = []

    // Create questions one by one (to handle options properly)
    for (const questionData of questions) {
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          test_id: testId,
          question_type: questionData.question_type,
          question_text: questionData.question_text,
          question_image_url: questionData.question_image_url,
          marks: questionData.marks,
          order_index: currentOrderIndex,
          explanation: questionData.explanation,
        })
        .select()
        .single()

      if (questionError) {
        console.error('Error creating question:', questionError)
        continue
      }

      // Create options if provided
      if (questionData.options && questionData.options.length > 0) {
        const optionsToInsert = questionData.options.map((opt, index) => ({
          question_id: question.id,
          option_text: opt.option_text,
          option_image_url: opt.option_image_url,
          is_correct: opt.is_correct,
          order_index: index + 1,
        }))

        await supabase.from('question_options').insert(optionsToInsert)
      }

      createdQuestions.push(question)
      currentOrderIndex++
    }

    revalidatePath(`/lecturer/tests/${testId}`)
    return { questions: createdQuestions, count: createdQuestions.length }
  } catch (error) {
    console.error('Error in bulkCreateQuestions:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Parse CSV and create questions
 */
export async function importQuestionsFromCSV(testId: string, csvRows: CSVQuestionRow[]) {
  try {
    const questions: CreateQuestionData[] = csvRows.map(row => {
      const question: CreateQuestionData = {
        question_type: row.question_type,
        question_text: row.question_text.trim(),
        marks: row.marks,
        explanation: row.explanation?.trim(),
        options: [],
      }

      if (row.question_type === 'mcq') {
        const options = []
        const correctAnswers = row.correct_answer.toUpperCase().split(',').map(a => a.trim())

        if (row.option_a) {
          options.push({
            option_text: row.option_a.trim(),
            is_correct: correctAnswers.includes('A'),
          })
        }
        if (row.option_b) {
          options.push({
            option_text: row.option_b.trim(),
            is_correct: correctAnswers.includes('B'),
          })
        }
        if (row.option_c) {
          options.push({
            option_text: row.option_c.trim(),
            is_correct: correctAnswers.includes('C'),
          })
        }
        if (row.option_d) {
          options.push({
            option_text: row.option_d.trim(),
            is_correct: correctAnswers.includes('D'),
          })
        }
        if (row.option_e) {
          options.push({
            option_text: row.option_e.trim(),
            is_correct: correctAnswers.includes('E'),
          })
        }

        question.options = options
      } else if (row.question_type === 'true_false') {
        const isTrue = row.correct_answer.toLowerCase().includes('true')
        question.options = [
          { option_text: 'True', is_correct: isTrue },
          { option_text: 'False', is_correct: !isTrue },
        ]
      }

      return question
    })

    return bulkCreateQuestions(testId, questions)
  } catch (error) {
    console.error('Error in importQuestionsFromCSV:', error)
    return { error: 'Failed to import questions' }
  }
}

/**
 * Import multiple questions from document extraction
 */
export async function importQuestionsFromDocument(
  testId: string,
  questions: ExtractedQuestion[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { success: false, count: 0, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify test ownership
    const { data: test } = await supabase
      .from('tests')
      .select('created_by')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { success: false, count: 0, error: 'Unauthorized access to test' }
    }

    // Get current question count for ordering
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('order_index')
      .eq('test_id', testId)
      .order('order_index', { ascending: false })
      .limit(1)

    const startOrder = (existingQuestions?.[0]?.order_index || 0) + 1

    let currentOrder = startOrder
    const createdQuestions = []

    // Convert ExtractedQuestion to CreateQuestionData and insert
    for (const extractedQ of questions) {
      const questionData: CreateQuestionData = {
        question_type: extractedQ.question_type,
        question_text: extractedQ.question_text,
        marks: extractedQ.marks,
        explanation: extractedQ.explanation,
        options: [],
      }

      // Handle options based on question type
      if (extractedQ.question_type === 'mcq' && extractedQ.options) {
        questionData.options = extractedQ.options.map((optText, index) => {
          const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
          return {
            option_text: optText,
            is_correct: extractedQ.correct_answer === optionLabel,
          }
        })
      } else if (extractedQ.question_type === 'true_false') {
        const isTrue = extractedQ.correct_answer?.toLowerCase() === 'true'
        questionData.options = [
          { option_text: 'True', is_correct: isTrue },
          { option_text: 'False', is_correct: !isTrue },
        ]
      }

      // Insert question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          test_id: testId,
          question_type: questionData.question_type,
          question_text: questionData.question_text,
          marks: questionData.marks,
          order_index: currentOrder,
          explanation: questionData.explanation,
        })
        .select()
        .single()

      if (questionError) {
        console.error('Error creating question:', questionError)
        continue
      }

      // Insert options if present
      if (questionData.options && questionData.options.length > 0) {
        const optionsToInsert = questionData.options.map((opt, index) => ({
          question_id: question.id,
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          order_index: index + 1,
        }))

        await supabase.from('question_options').insert(optionsToInsert)
      }

      createdQuestions.push(question)
      currentOrder++
    }

    // Update test's total marks
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
    
    const { data: currentTest } = await supabase
      .from('tests')
      .select('total_marks')
      .eq('id', testId)
      .single()

    const newTotalMarks = (currentTest?.total_marks || 0) + totalMarks

    await supabase
      .from('tests')
      .update({ total_marks: newTotalMarks })
      .eq('id', testId)

    revalidatePath(`/lecturer/tests/${testId}/questions/add`)
    revalidatePath(`/lecturer/tests/${testId}`)

    return {
      success: true,
      count: createdQuestions.length,
    }
  } catch (error) {
    console.error('Error importing questions:', error)
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to import questions',
    }
  }
}

/**
 * Update a question
 */
export async function updateQuestion(questionId: string, questionData: Partial<CreateQuestionData>) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify ownership through test
    const { data: question } = await supabase
      .from('questions')
      .select('test_id, tests!inner(created_by)')
      .eq('id', questionId)
      .single()

    const tests = Array.isArray(question?.tests) ? question.tests[0] : question?.tests
    if (!question || !tests || (tests as any).created_by !== user.id) {
      return { error: 'Question not found or unauthorized' }
    }

    // Update question
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        question_text: questionData.question_text,
        question_image_url: questionData.question_image_url,
        marks: questionData.marks,
        explanation: questionData.explanation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)

    if (updateError) {
      console.error('Error updating question:', updateError)
      return { error: 'Failed to update question' }
    }

    // Update options if provided
    if (questionData.options) {
      // Delete existing options
      await supabase.from('question_options').delete().eq('question_id', questionId)

      // Insert new options
      const optionsToInsert = questionData.options.map((opt, index) => ({
        question_id: questionId,
        option_text: opt.option_text,
        option_image_url: opt.option_image_url,
        is_correct: opt.is_correct,
        order_index: index + 1,
      }))

      await supabase.from('question_options').insert(optionsToInsert)
    }

    revalidatePath(`/lecturer/tests/${question.test_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error in updateQuestion:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify ownership through test
    const { data: question } = await supabase
      .from('questions')
      .select('test_id, tests!inner(created_by)')
      .eq('id', questionId)
      .single()

    const tests = Array.isArray(question?.tests) ? question.tests[0] : question?.tests
    if (!question || !tests || (tests as any).created_by !== user.id) {
      return { error: 'Question not found or unauthorized' }
    }

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Error deleting question:', error)
      return { error: 'Failed to delete question' }
    }

    revalidatePath(`/lecturer/tests/${question.test_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error in deleteQuestion:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Reorder questions
 */
export async function reorderQuestions(testId: string, questionIds: string[]) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'lecturer') {
      return { error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Verify test ownership
    const { data: test } = await supabase
      .from('tests')
      .select('created_by')
      .eq('id', testId)
      .single()

    if (!test || test.created_by !== user.id) {
      return { error: 'Test not found or unauthorized' }
    }

    // Update order_index for each question
    for (let i = 0; i < questionIds.length; i++) {
      await supabase
        .from('questions')
        .update({ order_index: i + 1 })
        .eq('id', questionIds[i])
        .eq('test_id', testId)
    }

    revalidatePath(`/lecturer/tests/${testId}`)
    return { success: true }
  } catch (error) {
    console.error('Error in reorderQuestions:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all questions for a test with options
 */
export async function getTestQuestions(testId: string) {
  try {
    const supabase = await createClient()
    
    // First, get all questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', testId)
      .order('order_index', { ascending: true })
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return { error: 'Failed to fetch questions' }
    }

    console.log('Questions fetched:', questions?.length)
    
    // Then, get all options for these questions
    const questionIds = questions?.map(q => q.id) || []
    
    const { data: allOptions, error: optionsError } = await supabase
      .from('question_options')
      .select('*')
      .in('question_id', questionIds)
      .order('order_index', { ascending: true })
    
    if (optionsError) {
      console.error('Error fetching options:', optionsError)
      return { error: 'Failed to fetch options' }
    }

    console.log('Options fetched:', allOptions?.length)
    
    // Map options to questions
    const questionsWithOptions: QuestionWithOptions[] = questions.map(q => ({
      ...q,
      options: allOptions?.filter(opt => opt.question_id === q.id) || [],
    }))

    console.log('Questions with options:', questionsWithOptions.map(q => ({
      id: q.id,
      type: q.question_type,
      optionsCount: q.options.length
    })))

    return { questions: questionsWithOptions }
  } catch (error) {
    console.error('Error in getTestQuestions:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get shuffled questions for student (if shuffle enabled)
 */
export async function getShuffledTestQuestions(testId: string, shuffleQuestions: boolean, shuffleOptions: boolean) {
  try {
    const { questions, error } = await getTestQuestions(testId)

    if (error || !questions) {
      return { error }
    }

    let processedQuestions = [...questions]

    // Shuffle questions if enabled
    if (shuffleQuestions) {
      processedQuestions = processedQuestions.sort(() => Math.random() - 0.5)
    }

    // Shuffle options if enabled
    if (shuffleOptions) {
      processedQuestions = processedQuestions.map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      }))
    }

    return { questions: processedQuestions }
  } catch (error) {
    console.error('Error in getShuffledTestQuestions:', error)
    return { error: 'An unexpected error occurred' }
  }
}