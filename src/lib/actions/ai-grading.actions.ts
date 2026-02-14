"use server";

import { createClient } from "@/lib/supabase/server";
import { gradeEssayWithAI, gradeEssayWithFileAttachments } from "@/lib/services/claude.service";
import { revalidatePath } from "next/cache";
import * as mammoth from "mammoth";

/**
 * Extract text from a document URL
 */
async function extractTextFromDocumentUrl(fileUrl: string): Promise<string> {
  try {
    console.log(`Extracting text from document: ${fileUrl}`);
    
    // Fetch the document from the URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error(`Failed to fetch document: ${response.statusText}`);
      return ""; // Return empty string so extraction can be retried
    }

    const contentType = response.headers.get("content-type") || "";
    const buffer = await response.arrayBuffer();
    
    console.log(`Document fetched, contentType: ${contentType}, size: ${buffer.byteLength} bytes`);

    // Handle DOCX files
    if (
      contentType.includes("wordprocessingml") ||
      fileUrl.toLowerCase().endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      console.log(`DOCX extraction successful, extracted ${result.value.length} characters`);
      return result.value;
    }

    // Handle PDF files
    if (contentType.includes("pdf") || fileUrl.toLowerCase().endsWith(".pdf")) {
      try {
        console.log("Attempting PDF text extraction...");
        // Dynamically import pdf-parse to handle CommonJS module
        const pdfParseModule = await import("pdf-parse");
        // pdf-parse exports the function directly as the default export in ESM
        const pdfParse = (pdfParseModule as any).default || pdfParseModule;
        const pdfData = await pdfParse(Buffer.from(buffer));
        
        if (pdfData.text && pdfData.text.trim().length > 0) {
          console.log(`PDF extraction successful, extracted ${pdfData.text.length} characters`);
          return pdfData.text;
        } else {
          console.warn("PDF extracted but text is empty, may be a scanned document without OCR");
          return ""; // Return empty so we note this is a scanned PDF
        }
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        // Return empty string rather than placeholder - let caller handle no text case
        return "";
      }
    }

    // Handle image files
    if (
      contentType.includes("image") ||
      fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
    ) {
      console.log("Image file detected - text extraction not supported");
      return ""; // Image files don't have extractable text
    }

    // Default fallback
    console.log("Unknown file type, cannot extract text");
    return "";
  } catch (error) {
    console.error("Error extracting text from document URL:", error);
    return ""; // Return empty on error
  }
}

/**
 * Extract text from all submitted documents
 */
async function extractTextFromSubmission(
  fileUrls: string[],
  submissionText?: string
): Promise<string> {
  let extractedContent = submissionText || "";

  if (fileUrls && Array.isArray(fileUrls) && fileUrls.length > 0) {
    const documentContents = await Promise.all(
      fileUrls.map((url) => extractTextFromDocumentUrl(url))
    );

    // Filter out empty extractions and note which files couldn't be extracted
    const successfulExtractions = documentContents.filter(text => text && text.trim().length > 0);
    const failedExtractions = fileUrls.length - successfulExtractions.length;

    // Combine all extracted content
    const allExtractedText = successfulExtractions.join("\n\n---\n\n");

    if (successfulExtractions.length > 0) {
      if (extractedContent) {
        extractedContent += `\n\n[SUBMITTED DOCUMENTS - ${successfulExtractions.length} file(s) extracted]\n${allExtractedText}`;
      } else {
        extractedContent = allExtractedText;
      }
    }
    
    // Note if some files couldn't be extracted
    if (failedExtractions > 0) {
      console.warn(`Warning: Could not extract text from ${failedExtractions} document(s)`);
      if (!extractedContent) {
        extractedContent = `[ERROR: Unable to extract text from ${failedExtractions} submitted document(s). Student may need to resubmit in a different format.]`;
      }
    }
  }

  return extractedContent;
}

/**
 * AI grade a test essay question
 * Uses student_answers table (your actual schema)
 */
export async function aiGradeTestEssay(
  attemptId: string,
  questionId: string,
  customRubric?: string
): Promise<{
  success: boolean;
  score?: number;
  feedback?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get the student answer with question and test details
    const { data: answer, error: answerError } = await supabase
      .from("student_answers")
      .select(
        `
        *,
        question:questions(question_text, marks, question_type),
        attempt:test_attempts(
          id,
          test_id,
          test:tests(id, created_by)
        )
      `
      )
      .eq("attempt_id", attemptId)
      .eq("question_id", questionId)
      .single();

    if (answerError || !answer) {
      throw new Error("Answer not found");
    }

    // Verify lecturer owns this test
    if (answer.attempt.test.created_by !== user.id) {
      throw new Error("Unauthorized access to test");
    }

    // Check if essay question
    if (answer.question.question_type !== "essay") {
      throw new Error("This is not an essay question");
    }

    if (!answer.answer_text || answer.answer_text.trim().length === 0) {
      throw new Error("No essay text to grade");
    }

    console.log("AI grading test essay, attempt:", attemptId, "question:", questionId);

    // Use AI to grade the essay
    const aiResult = await gradeEssayWithAI(
      answer.answer_text,
      answer.question.question_text,
      answer.question.marks,
      customRubric
    );

    console.log("AI grading complete, score:", aiResult.score);

    // Store AI grading result
    const { error: updateError } = await supabase
      .from("student_answers")
      .update({
        marks_awarded: aiResult.score,
        ai_feedback: aiResult.feedback, // Store in text field
        ai_feedback_data: {
          score: aiResult.score,
          percentage: aiResult.percentage,
          feedback: aiResult.feedback,
          strengths: aiResult.strengths,
          improvements: aiResult.improvements,
          gradingBreakdown: aiResult.gradingBreakdown,
          gradedAt: new Date().toISOString(),
        },
      })
      .eq("id", answer.id);

    if (updateError) throw updateError;

    // Recalculate attempt score
    await recalculateAttemptScore(attemptId);

    revalidatePath(`/lecturer/attempts/${attemptId}`);

    return {
      success: true,
      score: aiResult.score,
      feedback: aiResult.feedback,
    };
  } catch (error) {
    console.error("Error AI grading test essay:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade essay",
    };
  }
}

/**
 * AI grade all essay questions in a test attempt
 */
export async function aiGradeAllTestEssays(
  attemptId: string,
  customRubric?: string
): Promise<{
  success: boolean;
  gradedCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get all essay answers for this attempt
    const { data: answers, error: answersError } = await supabase
      .from("student_answers")
      .select(
        `
        *,
        question:questions!inner(question_text, marks, question_type),
        attempt:test_attempts(
          test:tests(created_by)
        )
      `
      )
      .eq("attempt_id", attemptId)
      .eq("question.question_type", "essay")
      .is("marks_awarded", null); // Only ungraded essays

    if (answersError) throw answersError;

    if (!answers || answers.length === 0) {
      return {
        success: true,
        gradedCount: 0,
      };
    }

    // Verify lecturer owns this test
    if (answers[0].attempt.test.created_by !== user.id) {
      throw new Error("Unauthorized access to test");
    }

    console.log(`AI grading ${answers.length} essay questions...`);

    let gradedCount = 0;

    // Grade each essay
    for (const answer of answers) {
      if (!answer.answer_text || answer.answer_text.trim().length === 0) {
        continue; // Skip empty answers
      }

      try {
        const aiResult = await gradeEssayWithAI(
          answer.answer_text,
          answer.question.question_text,
          answer.question.marks,
          customRubric
        );

        // Update answer with AI grade
        await supabase
          .from("student_answers")
          .update({
            marks_awarded: aiResult.score,
            ai_feedback: aiResult.feedback,
            ai_feedback_data: {
              score: aiResult.score,
              percentage: aiResult.percentage,
              feedback: aiResult.feedback,
              strengths: aiResult.strengths,
              improvements: aiResult.improvements,
              gradingBreakdown: aiResult.gradingBreakdown,
              gradedAt: new Date().toISOString(),
            },
          })
          .eq("id", answer.id);

        gradedCount++;
      } catch (error) {
        console.error("Error grading individual essay:", error);
        // Continue with next essay even if one fails
      }
    }

    // Recalculate total score for the attempt
    await recalculateAttemptScore(attemptId);

    revalidatePath(`/lecturer/attempts/${attemptId}`);

    return {
      success: true,
      gradedCount,
    };
  } catch (error) {
    console.error("Error AI grading all test essays:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade essays",
    };
  }
}

/**
 * AI grade an assignment submission
 */
export async function aiGradeAssignment(
  submissionId: string,
  customRubric?: string
): Promise<{
  success: boolean;
  score?: number;
  feedback?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get the submission
    const { data: submission, error: submissionError } = await supabase
      .from("assignment_submissions")
      .select(
        `
        *,
        assignment:assignments(
          title,
          instructions,
          max_score,
          created_by,
          course_id,
          ai_grading_rubric
        )
      `
      )
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      throw new Error("Submission not found");
    }

    // Verify lecturer owns this assignment
    if (submission.assignment?.created_by !== user.id) {
      throw new Error("Unauthorized access to assignment");
    }

    // Check if there's content to grade (text or documents)
    const hasText = submission.submission_text && submission.submission_text.trim().length > 0;
    const hasDocuments = submission.file_urls && Array.isArray(submission.file_urls) && submission.file_urls.length > 0;

    if (!hasText && !hasDocuments) {
      throw new Error("No submission content (text or documents) to grade");
    }

    console.log("AI grading assignment submission:", submissionId, {
      hasText,
      hasDocuments,
      fileCount: hasDocuments ? submission.file_urls.length : 0
    });

    // Construct question from assignment
    const question = `${submission.assignment.title}\n\n${submission.assignment.instructions}`;

    // Use assignment's rubric if available, otherwise use custom rubric from UI
    const rubricToUse = submission.assignment.ai_grading_rubric || customRubric;

    let aiResult;

    // If documents are present, try to grade using file attachments first
    if (hasDocuments) {
      try {
        console.log("Attempting to grade using file attachments...");
        aiResult = await gradeEssayWithFileAttachments(
          submission.file_urls,
          question,
          submission.assignment.max_score,
          rubricToUse
        );
        console.log("Successfully graded using file attachments, score:", aiResult.score);
      } catch (fileError) {
        console.warn("File attachment grading failed, attempting text extraction:", fileError);
        
        // Fallback to text extraction
        const contentToGrade = await extractTextFromSubmission(
          submission.file_urls,
          submission.submission_text
        );

        // Validate that we have content to grade
        if (!contentToGrade || contentToGrade.trim().length === 0) {
          throw new Error("Unable to grade submitted documents. Student may need to resubmit in a different format (e.g., plain text, Word document with selectable text, or PDF with selectable text).");
        }

        console.log("AI grading with extracted text, content length:", contentToGrade.length);

        // Use AI to grade extracted text
        aiResult = await gradeEssayWithAI(
          contentToGrade,
          question,
          submission.assignment.max_score,
          rubricToUse
        );
      }
    } else {
      // Grade text submission
      const contentToGrade = submission.submission_text || "";
      
      if (!contentToGrade || contentToGrade.trim().length === 0) {
        throw new Error("No submission content to grade");
      }

      console.log("AI grading text submission, content length:", contentToGrade.length);

      aiResult = await gradeEssayWithAI(
        contentToGrade,
        question,
        submission.assignment.max_score,
        rubricToUse
      );
    }

    console.log("AI grading complete, score:", aiResult.score);

    // Store AI grading result
    const { error: updateError } = await supabase
      .from("assignment_submissions")
      .update({
        final_score: aiResult.score,
        lecturer_feedback: aiResult.feedback,
        ai_feedback: aiResult.feedback, // Store in existing text field
        status: "graded",
        graded_at: new Date().toISOString(),
        graded_by: user.id,
        ai_grading_data: {
          score: aiResult.score,
          percentage: aiResult.percentage,
          feedback: aiResult.feedback,
          strengths: aiResult.strengths,
          improvements: aiResult.improvements,
          gradingBreakdown: aiResult.gradingBreakdown,
          gradedAt: new Date().toISOString(),
          gradedBy: "ai",
        },
      })
      .eq("id", submissionId);

    if (updateError) throw updateError;

    // Update CA record if course-based assignment
    if (submission.assignment.course_id) {
      await updateCARecordAfterGrading(
        submission.student_id,
        submission.assignment.course_id,
        submission.assignment_id
      );
    }

    revalidatePath(`/lecturer/grading/submission/${submissionId}`);
    revalidatePath(`/lecturer/assignments/${submission.assignment_id}/submissions`);

    return {
      success: true,
      score: aiResult.score,
      feedback: aiResult.feedback,
    };
  } catch (error) {
    console.error("Error AI grading assignment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade assignment",
    };
  }
}

/**
 * Helper function to recalculate attempt score
 */
async function recalculateAttemptScore(attemptId: string): Promise<void> {
  const supabase = await createClient();

  // Get all answers for this attempt
  const { data: answers } = await supabase
    .from("student_answers")
    .select("marks_awarded")
    .eq("attempt_id", attemptId);

  if (!answers) return;

  // Calculate total score
  const totalScore = answers.reduce(
    (sum, answer) => sum + (answer.marks_awarded || 0),
    0
  );

  // Get test total marks
  const { data: attempt } = await supabase
    .from("test_attempts")
    .select("test:tests(total_marks)")
    .eq("id", attemptId)
    .single();

  const testArray = attempt?.test as unknown as { total_marks: number }[] | null
  const testData = testArray?.[0]
  const totalMarks = testData?.total_marks || 100;
  const percentage = (totalScore / totalMarks) * 100;

  // Update attempt
  await supabase
    .from("test_attempts")
    .update({
      score: totalScore,
      total_score: totalScore,
      percentage: percentage,
      status: "completed",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);
}

/**
 * Helper function to update CA record after grading
 */
async function updateCARecordAfterGrading(
  studentId: string,
  courseId: string,
  assignmentId: string
): Promise<void> {
  const supabase = await createClient();

  // Get assignment CA marks allocation
  const { data: assignment } = await supabase
    .from("assignments")
    .select("allocated_marks, max_score")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return;

  // Get submission score
  const { data: submission } = await supabase
    .from("assignment_submissions")
    .select("final_score")
    .eq("student_id", studentId)
    .eq("assignment_id", assignmentId)
    .single();

  if (!submission || submission.final_score === null) return;

  // Calculate CA marks earned
  const scoreRatio = submission.final_score / assignment.max_score;
  const caMarksEarned = scoreRatio * assignment.allocated_marks;

  // Get or create CA record (using ca_records table from your schema)
  const { data: existingCA } = await supabase
    .from("ca_records")
    .select("id, assignment_scores")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .single();

  if (existingCA) {
    // Update existing record
    const assignmentScores = existingCA.assignment_scores || {};
    assignmentScores[assignmentId] = caMarksEarned;

    // Calculate total from all assignments
    const totalAssignmentMarks = Object.values(assignmentScores).reduce(
      (sum: number, score: any) => sum + (score || 0),
      0
    );

    await supabase
      .from("ca_records")
      .update({
        assignment_scores: assignmentScores,
        total_ca_score: totalAssignmentMarks,
      })
      .eq("id", existingCA.id);
  } else {
    // Create new record
    await supabase.from("ca_records").insert({
      student_id: studentId,
      course_id: courseId,
      assignment_scores: { [assignmentId]: caMarksEarned },
      test_scores: {},
      total_ca_score: caMarksEarned,
    });
  }
}

/**
 * AI grade all essay questions across all attempts in a test
 */
export async function aiGradeAllTestAttempts(
  testId: string,
  customRubric?: string
): Promise<{
  success: boolean;
  totalGraded?: number;
  attemptsProcessed?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify lecturer owns this test
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("id, created_by")
      .eq("id", testId)
      .single();

    if (testError || !test) throw new Error("Test not found");
    if (test.created_by !== user.id) throw new Error("Unauthorized access to test");

    // Get all attempts for this test
    const { data: attempts, error: attemptsError } = await supabase
      .from("test_attempts")
      .select("id")
      .eq("test_id", testId);

    if (attemptsError) throw attemptsError;
    if (!attempts || attempts.length === 0) {
      return {
        success: true,
        totalGraded: 0,
        attemptsProcessed: 0,
      };
    }

    console.log(`AI grading all essays across ${attempts.length} attempts...`);

    let totalGraded = 0;

    // Grade all essays in each attempt
    for (const attempt of attempts) {
      try {
        const result = await aiGradeAllTestEssays(attempt.id, customRubric);
        if (result.success && result.gradedCount) {
          totalGraded += result.gradedCount;
        }
      } catch (error) {
        console.error(`Error grading attempt ${attempt.id}:`, error);
        // Continue with next attempt even if one fails
      }
    }

    revalidatePath(`/lecturer/tests/${testId}/attempts`);

    return {
      success: true,
      totalGraded,
      attemptsProcessed: attempts.length,
    };
  } catch (error) {
    console.error("Error AI grading all test attempts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade attempts",
    };
  }
}

/**
 * AI grade all assignment submissions
 */
export async function aiGradeAllAssignmentSubmissions(
  assignmentId: string,
  customRubric?: string
): Promise<{
  success: boolean;
  gradedCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("id, created_by, title, instructions, max_score")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError) {
      console.error("Assignment lookup error:", assignmentError);
      throw new Error(`Failed to fetch assignment: ${assignmentError.message}`);
    }

    if (!assignment) {
      console.error("Assignment not found for ID:", assignmentId);
      throw new Error(`Assignment not found. ID: ${assignmentId}`);
    }

    // Verify lecturer owns this assignment
    if (assignment.created_by !== user.id) {
      throw new Error("Unauthorized access to assignment");
    }

    // Get all ungraded submissions for this assignment
    const { data: submissions, error: submissionsError } = await supabase
      .from("assignment_submissions")
      .select("id, student_id, submission_text, file_urls")
      .eq("assignment_id", assignmentId)
      .is("final_score", null);

    if (submissionsError) throw submissionsError;

    if (!submissions || submissions.length === 0) {
      return {
        success: true,
        gradedCount: 0,
      };
    }

    console.log(`AI grading ${submissions.length} assignment submissions...`);

    let gradedCount = 0;

    // Grade each submission
    for (const submission of submissions) {
      const hasText = submission.submission_text && submission.submission_text.trim().length > 0;
      const hasDocuments = submission.file_urls && Array.isArray(submission.file_urls) && submission.file_urls.length > 0;

      if (!hasText && !hasDocuments) {
        continue; // Skip empty submissions
      }

      try {
        let aiResult;
        const question = `${assignment.title}\n\n${assignment.instructions}`;

        // If documents are present, try to grade using file attachments first
        if (hasDocuments) {
          try {
            aiResult = await gradeEssayWithFileAttachments(
              submission.file_urls,
              question,
              assignment.max_score,
              customRubric
            );
          } catch (_fileError) {
            // Fallback to text extraction
            const contentToGrade = await extractTextFromSubmission(
              submission.file_urls,
              submission.submission_text
            );

            if (!contentToGrade || contentToGrade.trim().length === 0) {
              console.warn(`Skipping submission ${submission.id}: unable to extract content`);
              continue;
            }

            aiResult = await gradeEssayWithAI(
              contentToGrade,
              question,
              assignment.max_score,
              customRubric
            );
          }
        } else {
          // Grade text submission
          const contentToGrade = submission.submission_text || "";
          
          if (!contentToGrade || contentToGrade.trim().length === 0) {
            continue; // Skip empty
          }

          aiResult = await gradeEssayWithAI(
            contentToGrade,
            question,
            assignment.max_score,
            customRubric
          );
        }

        // Update submission with AI grade
        await supabase
          .from("assignment_submissions")
          .update({
            final_score: aiResult.score,
            lecturer_feedback: aiResult.feedback,
            ai_feedback: aiResult.feedback,
            status: "graded",
            graded_at: new Date().toISOString(),
            graded_by: user.id,
            ai_grading_data: {
              score: aiResult.score,
              percentage: aiResult.percentage,
              feedback: aiResult.feedback,
              strengths: aiResult.strengths,
              improvements: aiResult.improvements,
              gradingBreakdown: aiResult.gradingBreakdown,
              gradedAt: new Date().toISOString(),
              gradedBy: "ai",
            },
          })
          .eq("id", submission.id);

        gradedCount++;
      } catch (error) {
        console.error("Error grading individual submission:", error);
        // Continue with next submission even if one fails
      }
    }

    revalidatePath(`/lecturer/assignments/${assignmentId}/submissions`);
    revalidatePath(`/lecturer/assignments/standalone/${assignmentId}`);

    return {
      success: true,
      gradedCount,
    };
  } catch (error) {
    console.error("Error AI grading all assignment submissions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade submissions",
    };
  }
}

/**
 * AI grade all standalone assignment submissions
 */
export async function aiGradeAllStandaloneSubmissions(
  assignmentId: string,
  customRubric?: string
): Promise<{
  success: boolean;
  gradedCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Get the standalone assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("standalone_assignments")
      .select("id, created_by, title, instructions, max_score")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError) {
      console.error("Standalone assignment lookup error:", assignmentError);
      throw new Error(`Failed to fetch assignment: ${assignmentError.message}`);
    }

    if (!assignment) {
      console.error("Standalone assignment not found for ID:", assignmentId);
      throw new Error(`Assignment not found. ID: ${assignmentId}`);
    }

    // Verify lecturer owns this assignment
    if (assignment.created_by !== user.id) {
      throw new Error("Unauthorized access to assignment");
    }

    // Get all ungraded submissions for this assignment
    const { data: submissions, error: submissionsError } = await supabase
      .from("standalone_submissions")
      .select("id, student_id, submission_text, file_urls")
      .eq("assignment_id", assignmentId)
      .is("final_score", null);

    if (submissionsError) throw submissionsError;

    if (!submissions || submissions.length === 0) {
      return {
        success: true,
        gradedCount: 0,
      };
    }

    console.log(`AI grading ${submissions.length} standalone assignment submissions...`);

    let gradedCount = 0;

    // Grade each submission
    for (const submission of submissions) {
      const hasText = submission.submission_text && submission.submission_text.trim().length > 0;
      const hasDocuments = submission.file_urls && Array.isArray(submission.file_urls) && submission.file_urls.length > 0;

      if (!hasText && !hasDocuments) {
        continue; // Skip empty submissions
      }

      try {
        let aiResult;
        const question = `${assignment.title}\n\n${assignment.instructions}`;

        // If documents are present, try to grade using file attachments first
        if (hasDocuments) {
          try {
            aiResult = await gradeEssayWithFileAttachments(
              submission.file_urls,
              question,
              assignment.max_score,
              customRubric
            );
          } catch (_fileError) {
            // Fallback to text extraction
            const contentToGrade = await extractTextFromSubmission(
              submission.file_urls,
              submission.submission_text
            );

            if (!contentToGrade || contentToGrade.trim().length === 0) {
              console.warn(`Skipping submission ${submission.id}: unable to extract content`);
              continue;
            }

            aiResult = await gradeEssayWithAI(
              contentToGrade,
              question,
              assignment.max_score,
              customRubric
            );
          }
        } else {
          // Grade text submission
          const contentToGrade = submission.submission_text || "";
          
          if (!contentToGrade || contentToGrade.trim().length === 0) {
            continue; // Skip empty
          }

          aiResult = await gradeEssayWithAI(
            contentToGrade,
            question,
            assignment.max_score,
            customRubric
          );
        }

        // Update submission with AI grade
        await supabase
          .from("standalone_submissions")
          .update({
            final_score: aiResult.score,
            lecturer_feedback: aiResult.feedback,
            ai_feedback: aiResult.feedback,
            status: "graded",
            graded_at: new Date().toISOString(),
            graded_by: user.id,
            ai_grading_data: {
              score: aiResult.score,
              percentage: aiResult.percentage,
              feedback: aiResult.feedback,
              strengths: aiResult.strengths,
              improvements: aiResult.improvements,
              gradingBreakdown: aiResult.gradingBreakdown,
              gradedAt: new Date().toISOString(),
              gradedBy: "ai",
            },
          })
          .eq("id", submission.id);

        gradedCount++;
      } catch (error) {
        console.error("Error grading individual standalone submission:", error);
        // Continue with next submission even if one fails
      }
    }

    revalidatePath(`/lecturer/assignments/standalone/${assignmentId}`);

    return {
      success: true,
      gradedCount,
    };
  } catch (error) {
    console.error("Error AI grading all standalone assignment submissions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to grade submissions",
    };
  }
}