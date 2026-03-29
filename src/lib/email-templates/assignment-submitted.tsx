import React from 'react'

interface AssignmentSubmittedEmailProps {
  studentName: string
  courseTitle: string
  assignmentTitle: string
  submissionDate: string
  submissionId: string
}

export function AssignmentSubmittedEmail({
  studentName,
  courseTitle,
  assignmentTitle,
  submissionDate,
  submissionId,
}: AssignmentSubmittedEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ color: '#007bff', margin: '0 0 10px 0' }}>
          ✅ Assignment Submitted
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Your assignment has been received
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>Hi {studentName},</p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Great! Your assignment has been successfully submitted to{' '}
        <strong>{courseTitle}</strong>. Our lecturers will review and grade it
        shortly.
      </p>

      <div style={{ backgroundColor: '#e8f4f8', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>
          Submission Details:
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Course:</strong> {courseTitle}
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Assignment:</strong> {assignmentTitle}
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Submitted:</strong> {submissionDate}
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Reference:</strong> <code>{submissionId}</code>
        </p>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        You'll receive an email notification once your work has been graded.
        Keep an eye on your Assessify dashboard for updates!
      </p>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
          This is an automated notification from Assessify. Please don't reply to
          this email.
        </p>
      </div>
    </div>
  )
}
