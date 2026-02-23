// app/api/cron/grade-assignments/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { gradeEssayWithAI, gradeEssayWithFileAttachments } from '@/lib/services/claude.service'

// Create admin client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// ✅ Helper function to extract text from documents
async function extractTextFromDocumentUrl(fileUrl: string): Promise<string> {
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) return ""

    const contentType = response.headers.get("content-type") || ""
    const buffer = await response.arrayBuffer()

    // Handle DOCX
    if (contentType.includes("wordprocessingml") || fileUrl.toLowerCase().endsWith(".docx")) {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
      return result.value
    }

    // Handle PDF
    if (contentType.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf")) {
      try {
        const pdfParseModule = await import("pdf-parse")
        const pdfParse = (pdfParseModule as any).default || pdfParseModule
        const pdfData = await pdfParse(Buffer.from(buffer))
        return pdfData.text || ""
      } catch {
        return ""
      }
    }

    return ""
  } catch {
    return ""
  }
}

async function extractTextFromSubmission(
  fileUrls: string[],
  submissionText?: string
): Promise<string> {
  let extractedContent = submissionText || ""

  if (fileUrls && Array.isArray(fileUrls) && fileUrls.length > 0) {
    const documentContents = await Promise.all(
      fileUrls.map((url) => extractTextFromDocumentUrl(url))
    )
    const successfulExtractions = documentContents.filter(text => text && text.trim().length > 0)
    const allExtractedText = successfulExtractions.join("\n\n---\n\n")

    if (successfulExtractions.length > 0) {
      if (extractedContent) {
        extractedContent += `\n\n[SUBMITTED DOCUMENTS]\n${allExtractedText}`
      } else {
        extractedContent = allExtractedText
      }
    }
  }

  return extractedContent
}

// ✅ Main cron handler
export async function GET(request: Request) {
  try {
    // ✅ SECURITY: Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Auto-grade cron job started:', new Date().toISOString())

    // Find assignments past deadline with AI grading enabled
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, title, description, max_score, created_by, deadline')
      .lt('deadline', new Date().toISOString())
      .eq('ai_grading_enabled', true)
      .is('auto_graded_at', null) // Haven't been auto-graded yet

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError)
      throw assignmentsError
    }

    if (!assignments || assignments.length === 0) {
      console.log('✅ No assignments to auto-grade')
      return NextResponse.json({ 
        success: true, 
        message: 'No assignments to grade',
        processed: 0
      })
    }

    console.log(`📚 Found ${assignments.length} assignments to auto-grade`)

    let totalGraded = 0
    let totalFailed = 0
    const results = []

    // Process each assignment
    for (const assignment of assignments) {
      try {
        // Get ungraded submissions
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('id, student_id, submission_text, file_urls, submitted_at')
          .eq('assignment_id', assignment.id)
          .neq('status', 'graded')

        if (!submissions || submissions.length === 0) {
          // Mark as auto-graded even if no submissions
          await supabase
            .from('assignments')
            .update({ auto_graded_at: new Date().toISOString() })
            .eq('id', assignment.id)
          
          console.log(`⏭️  No pending submissions for: ${assignment.title}`)
          continue
        }

        console.log(`📝 Grading ${submissions.length} submissions for: ${assignment.title}`)

        let gradedCount = 0

        // Grade each submission
        for (const submission of submissions) {
          const hasText = submission.submission_text?.trim().length > 0
          const hasDocuments = submission.file_urls?.length > 0

          if (!hasText && !hasDocuments) {
            console.log(`  ⏭️  Skipping empty submission ${submission.id}`)
            continue
          }

          try {
            console.log(`  🤖 Grading submission ${submission.id}...`)

            let aiResult
            const question = assignment.description 
              ? `${assignment.title}\n\n${assignment.description}`
              : assignment.title

            // Try grading with file attachments first
            if (hasDocuments) {
              try {
                aiResult = await gradeEssayWithFileAttachments(
                  submission.file_urls,
                  question,
                  assignment.max_score
                )
              } catch (fileError) {
                console.log(`  ⚠️  File grading failed, extracting text...`)
                // Fallback: extract text and grade
                const contentToGrade = await extractTextFromSubmission(
                  submission.file_urls,
                  submission.submission_text
                )
                
                if (!contentToGrade?.trim()) {
                  console.log(`  ❌ No content to grade`)
                  continue
                }

                aiResult = await gradeEssayWithAI(
                  contentToGrade,
                  question,
                  assignment.max_score
                )
              }
            } else {
              // Grade text submission
              aiResult = await gradeEssayWithAI(
                submission.submission_text!,
                question,
                assignment.max_score
              )
            }

            // Update submission with grade
            await supabase
              .from('assignment_submissions')
              .update({
                final_score: aiResult.score,
                lecturer_feedback: `Auto-graded by AI at ${new Date().toISOString()}\n\n${aiResult.feedback}`,
                status: 'graded',
                graded_at: new Date().toISOString(),
                graded_by: assignment.created_by,
                updated_at: new Date().toISOString()
              })
              .eq('id', submission.id)

            // Create notification for student
            await supabase.from('notifications').insert({
              user_id: submission.student_id,
              type: 'grade_received',
              title: 'Assignment Graded',
              message: `Your submission for "${assignment.title}" has been graded automatically. Score: ${aiResult.score}/${assignment.max_score}`,
              metadata: {
                assignment_id: assignment.id,
                submission_id: submission.id,
                score: aiResult.score,
                max_score: assignment.max_score,
              },
            })

            gradedCount++
            totalGraded++
            console.log(`  ✅ Graded: ${aiResult.score}/${assignment.max_score}`)

            // Add small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000))

          } catch (gradingError) {
            totalFailed++
            console.error(`  ❌ Error grading submission ${submission.id}:`, gradingError)
          }
        }

        // Mark assignment as auto-graded
        await supabase
          .from('assignments')
          .update({ 
            auto_graded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment.id)

        results.push({
          assignmentId: assignment.id,
          title: assignment.title,
          graded: gradedCount,
          total: submissions.length,
          deadline: assignment.deadline
        })

        console.log(`✅ Completed: ${gradedCount}/${submissions.length} submissions for "${assignment.title}"`)

      } catch (error) {
        console.error(`❌ Error processing assignment ${assignment.id}:`, error)
        results.push({
          assignmentId: assignment.id,
          title: assignment.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log('🎉 Auto-grade cron job completed:')
    console.log(`  Assignments processed: ${assignments.length}`)
    console.log(`  Total graded: ${totalGraded}`)
    console.log(`  Total failed: ${totalFailed}`)

    return NextResponse.json({ 
      success: true, 
      message: `Auto-graded ${totalGraded} submissions across ${assignments.length} assignments`,
      totalGraded,
      totalFailed,
      assignmentsProcessed: assignments.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Auto-grade cron error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Also support POST for testing
export async function POST(request: Request) {
  return GET(request)
}