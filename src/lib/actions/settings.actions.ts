'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get platform pricing settings from database
 */
export async function getPricingSettings() {
  try {
    const supabase = await createClient()
    
    // Fetch all pricing settings
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'pricing')

    if (error) {
      console.error('Failed to fetch pricing settings:', error)
      throw error
    }

    // Convert array to object
    const settings: Record<string, number> = {}
    data?.forEach(item => {
      settings[item.key] = Number(item.value) || 0
    })

    return {
      success: true,
      settings: {
        assignmentWriterBase: settings.assignment_writer_base || 100,
        assignmentWriterPerBracket: settings.assignment_writer_per_bracket || 100,
        assignmentSubmissionBase: settings.assignment_submission_base || 200,
        assignmentSubmissionPerBracket: settings.assignment_submission_per_bracket || 100,
        testSubmissionBase: settings.test_submission_base || 50,
        defaultSubmissionCost: settings.default_submission_cost || 200,
      },
    }
  } catch (error) {
    console.error('Failed to fetch pricing settings:', error)
    return {
      success: false,
      error: 'Failed to fetch pricing settings',
      settings: {
        assignmentWriterBase: 100,
        assignmentWriterPerBracket: 100,
        assignmentSubmissionBase: 200,
        assignmentSubmissionPerBracket: 100,
        testSubmissionBase: 50,
        defaultSubmissionCost: 200,
      },
    }
  }
}

/**
 * Get default submission cost (for assignments)
 */
export async function getDefaultSubmissionCost(): Promise<number> {
  const result = await getPricingSettings()
  return result.settings?.defaultSubmissionCost || 200
}

/**
 * Get default test access cost
 */
export async function getDefaultTestCost(): Promise<number> {
  const result = await getPricingSettings()
  return result.settings?.testSubmissionBase || 50
}

/**
 * Update a single setting in the database
 */
export async function updateSetting(key: string, value: string | number) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('system_settings')
      .update({ 
        value: String(value),
        updated_at: new Date().toISOString()
      })
      .eq('key', key)

    if (error) {
      console.error('Failed to update setting:', error)
      return { success: false, error: error.message }
    }

    // Revalidate pages that use settings
    revalidatePath('/admin/settings')
    revalidatePath('/lecturer/tests/create')
    revalidatePath('/lecturer/assignments/create')

    return { success: true }
  } catch (error) {
    console.error('Failed to update setting:', error)
    return { success: false, error: 'Failed to update setting' }
  }
}

/**
 * Update multiple pricing settings at once
 */
export async function updatePricingSettings(settings: {
  assignmentWriterBase?: number
  assignmentWriterPerBracket?: number
  assignmentSubmissionBase?: number
  assignmentSubmissionPerBracket?: number
  testSubmissionBase?: number
  defaultSubmissionCost?: number
}) {
  try {
    const supabase = await createClient()
    
    const updates = []
    
    if (settings.assignmentWriterBase !== undefined) {
      updates.push({ key: 'assignment_writer_base', value: String(settings.assignmentWriterBase) })
    }
    if (settings.assignmentWriterPerBracket !== undefined) {
      updates.push({ key: 'assignment_writer_per_bracket', value: String(settings.assignmentWriterPerBracket) })
    }
    if (settings.assignmentSubmissionBase !== undefined) {
      updates.push({ key: 'assignment_submission_base', value: String(settings.assignmentSubmissionBase) })
    }
    if (settings.assignmentSubmissionPerBracket !== undefined) {
      updates.push({ key: 'assignment_submission_per_bracket', value: String(settings.assignmentSubmissionPerBracket) })
    }
    if (settings.testSubmissionBase !== undefined) {
      updates.push({ key: 'test_submission_base', value: String(settings.testSubmissionBase) })
    }
    if (settings.defaultSubmissionCost !== undefined) {
      updates.push({ key: 'default_submission_cost', value: String(settings.defaultSubmissionCost) })
    }

    // Update all settings
    for (const update of updates) {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value: update.value,
          updated_at: new Date().toISOString()
        })
        .eq('key', update.key)

      if (error) {
        console.error(`Failed to update ${update.key}:`, error)
        throw error
      }
    }

    // Revalidate pages
    revalidatePath('/admin/settings')
    revalidatePath('/lecturer/tests/create')
    revalidatePath('/lecturer/assignments/create')

    return { success: true, message: 'Settings updated successfully' }
  } catch (error) {
    console.error('Failed to update pricing settings:', error)
    return { success: false, error: 'Failed to update settings' }
  }
}