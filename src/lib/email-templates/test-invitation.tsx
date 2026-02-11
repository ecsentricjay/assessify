import React from 'react'

interface TestInvitationEmailProps {
  studentName: string
  courseTitle: string
  testTitle: string
  testDate?: string
  duration?: number
  questions?: number
  accessUrl: string
}

export function TestInvitationEmail({
  studentName,
  courseTitle,
  testTitle,
  testDate,
  duration,
  questions,
  accessUrl,
}: TestInvitationEmailProps) {
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
        <h1 style={{ color: '#9b59b6', margin: '0 0 10px 0' }}>
          📝 New Test Available
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          {courseTitle} - {testTitle}
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>Hi {studentName},</p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        A new test has been assigned in <strong>{courseTitle}</strong>. Test your
        knowledge and complete it to contribute to your continuous assessment score!
      </p>

      <div style={{ backgroundColor: '#f0e6ff', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#6c3483' }}>
          Test Details:
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Test:</strong> {testTitle}
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Course:</strong> {courseTitle}
        </p>
        {questions && (
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>Questions:</strong> {questions}
          </p>
        )}
        {duration && (
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>Time Limit:</strong> {duration} minutes
          </p>
        )}
        {testDate && (
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>Available:</strong> {testDate}
          </p>
        )}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a
          href={accessUrl}
          style={{
            backgroundColor: '#9b59b6',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Start Test
        </a>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#666' }}>
        Click the button above to access the test. Make sure you have enough time to
        complete it before the deadline. Good luck! 🍀
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
