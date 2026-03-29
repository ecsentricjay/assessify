// Create this file: src/app/api/cron/auto-grade/route.ts
// This will be called by a cron job (Vercel Cron or external service)

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
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Auto-grade cron job started...')

    // Find assignments past deadline with AI grading enabled
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, title, description, max_score, created_by')
      .lt('deadline', new Date().toISOString())
      .eq('ai_grading_enabled', true)
      .is('auto_graded_at', null) // Haven't been auto-graded yet

    if (assignmentsError) throw assignmentsError

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
    const results = []

    // Process each assignment
    for (const assignment of assignments) {
      try {
        // Get ungraded submissions
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('id, submission_text, file_urls')
          .eq('assignment_id', assignment.id)
          .neq('status', 'graded')

        if (!submissions || submissions.length === 0) {
          // Mark as auto-graded even if no submissions
          await supabase
            .from('assignments')
            .update({ auto_graded_at: new Date().toISOString() })
            .eq('id', assignment.id)
          continue
        }

        console.log(`📝 Grading ${submissions.length} submissions for: ${assignment.title}`)

        let gradedCount = 0

        // Grade each submission
        for (const submission of submissions) {
          const hasText = submission.submission_text?.trim().length > 0
          const hasDocuments = submission.file_urls?.length > 0

          if (!hasText && !hasDocuments) continue

          try {
            let aiResult
            const question = assignment.description 
              ? `${assignment.title}\n\n${assignment.description}`
              : assignment.title

            if (hasDocuments) {
              try {
                aiResult = await gradeEssayWithFileAttachments(
                  submission.file_urls,
                  question,
                  assignment.max_score
                )
              } catch {
                const contentToGrade = await extractTextFromSubmission(
                  submission.file_urls,
                  submission.submission_text
                )
                if (!contentToGrade?.trim()) continue

                aiResult = await gradeEssayWithAI(
                  contentToGrade,
                  question,
                  assignment.max_score
                )
              }
            } else {
              aiResult = await gradeEssayWithAI(
                submission.submission_text!,
                question,
                assignment.max_score
              )
            }

            // Update submission
            await supabase
              .from('assignment_submissions')
              .update({
                final_score: aiResult.score,
                lecturer_feedback: `Auto-graded by AI\n\n${aiResult.feedback}`,
                status: 'graded',
                graded_at: new Date().toISOString(),
                graded_by: assignment.created_by, // Assign to assignment creator
                updated_at: new Date().toISOString()
              })
              .eq('id', submission.id)

            gradedCount++
            totalGraded++
          } catch (error) {
            console.error(`Error grading submission ${submission.id}:`, error)
          }
        }

        // Mark assignment as auto-graded
        await supabase
          .from('assignments')
          .update({ auto_graded_at: new Date().toISOString() })
          .eq('id', assignment.id)

        results.push({
          assignmentId: assignment.id,
          title: assignment.title,
          graded: gradedCount,
          total: submissions.length
        })

        console.log(`✅ Graded ${gradedCount}/${submissions.length} submissions for: ${assignment.title}`)
      } catch (error) {
        console.error(`Error processing assignment ${assignment.id}:`, error)
        results.push({
          assignmentId: assignment.id,
          title: assignment.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`🎉 Auto-grade complete! Graded ${totalGraded} total submissions`)

    return NextResponse.json({ 
      success: true, 
      message: `Auto-graded ${totalGraded} submissions across ${assignments.length} assignments`,
      totalGraded,
      assignmentsProcessed: assignments.length,
      results
    })
  } catch (error) {
    console.error('Auto-grade cron error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}