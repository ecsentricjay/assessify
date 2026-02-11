// Save as: src/scripts/migrate-standalone-assignments.ts
// Run this ONCE to move misplaced standalone assignments to the correct table

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function migrateStandaloneAssignments() {
  console.log('🔍 Looking for misplaced standalone assignments...')
  
  // Find all assignments with course_id = null (these are standalone assignments in wrong table)
  const { data: misplacedAssignments, error: fetchError } = await supabase
    .from('assignments')
    .select('*')
    .is('course_id', null)
  
  if (fetchError) {
    console.error('❌ Error fetching assignments:', fetchError)
    return
  }

  if (!misplacedAssignments || misplacedAssignments.length === 0) {
    console.log('✅ No misplaced assignments found!')
    return
  }

  console.log(`📦 Found ${misplacedAssignments.length} misplaced assignment(s)`)

  for (const assignment of misplacedAssignments) {
    console.log(`\n🔄 Migrating: ${assignment.title} (${assignment.id})`)

    try {
      // 1. Get all submissions for this assignment
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignment.id)

      console.log(`  📝 Found ${submissions?.length || 0} submission(s)`)

      // 2. Insert into standalone_assignments table
      const { data: newAssignment, error: insertError } = await supabase
        .from('standalone_assignments')
        .insert({
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions || null,
          max_score: assignment.max_score,
          assignment_type: assignment.assignment_type,
          deadline: assignment.deadline,
          late_submission_allowed: assignment.late_submission_allowed || false,
          late_penalty_percentage: assignment.late_penalty_percentage || 0,
          allowed_file_types: assignment.allowed_file_types || ['pdf', 'docx', 'txt'],
          max_file_size_mb: assignment.max_file_size_mb || 10,
          ai_grading_enabled: assignment.ai_grading_enabled || false,
          plagiarism_check_enabled: assignment.plagiarism_check_enabled || true,
          submission_cost: 0,
          display_course_code: 'N/A',
          display_course_title: 'Standalone Assignment',
          access_code: generateAccessCode(),
          created_by: assignment.created_by,
          created_at: assignment.created_at,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error(`  ❌ Error inserting into standalone_assignments:`, insertError)
        continue
      }

      console.log(`  ✅ Created standalone assignment: ${newAssignment.id}`)

      // 3. Move submissions to standalone_assignment_submissions
      if (submissions && submissions.length > 0) {
        const submissionsToInsert = submissions.map(sub => ({
          assignment_id: newAssignment.id,
          student_id: sub.student_id,
          student_name: sub.student_name,
          student_email: sub.student_email,
          submission_text: sub.submission_text,
          file_urls: sub.file_urls,
          submitted_at: sub.submitted_at,
          final_score: sub.final_score,
          lecturer_feedback: sub.lecturer_feedback,
          graded_by: sub.graded_by,
          graded_at: sub.graded_at,
          status: sub.status,
          is_late: sub.is_late,
          late_days: sub.late_days,
          plagiarism_score: sub.plagiarism_score,
          plagiarism_report: sub.plagiarism_report,
          ai_feedback: sub.ai_feedback,
          ai_suggested_score: sub.ai_suggested_score,
          created_at: sub.created_at,
          updated_at: sub.updated_at
        }))

        const { error: submissionInsertError } = await supabase
          .from('standalone_assignment_submissions')
          .insert(submissionsToInsert)

        if (submissionInsertError) {
          console.error(`  ❌ Error moving submissions:`, submissionInsertError)
          continue
        }

        console.log(`  ✅ Moved ${submissions.length} submission(s)`)

        // 4. Delete old submissions
        const { error: deleteSubmissionsError } = await supabase
          .from('assignment_submissions')
          .delete()
          .eq('assignment_id', assignment.id)

        if (deleteSubmissionsError) {
          console.error(`  ⚠️ Warning: Could not delete old submissions:`, deleteSubmissionsError)
        } else {
          console.log(`  🗑️ Deleted old submissions`)
        }
      }

      // 5. Delete old assignment
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id)

      if (deleteError) {
        console.error(`  ⚠️ Warning: Could not delete old assignment:`, deleteError)
      } else {
        console.log(`  🗑️ Deleted old assignment`)
      }

      console.log(`  ✅ Migration complete for: ${assignment.title}`)

    } catch (error) {
      console.error(`  ❌ Error migrating assignment:`, error)
    }
  }

  console.log('\n✅ Migration complete!')
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Run the migration
migrateStandaloneAssignments()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })