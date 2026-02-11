import React from 'react'

interface GradingCompleteEmailProps {
  studentName: string
  courseTitle: string
  assignmentTitle: string
  score: number
  maxScore: number
  percentage: number
  feedback?: string
  dashboardUrl: string
}

export function GradingCompleteEmail({
  studentName,
  courseTitle,
  assignmentTitle,
  score,
  maxScore,
  percentage,
  feedback,
  dashboardUrl,
}: GradingCompleteEmailProps) {
  const getGradeColor = (percent: number) => {
    if (percent >= 80) return '#27ae60'
    if (percent >= 70) return '#3498db'
    if (percent >= 60) return '#f39c12'
    return '#e74c3c'
  }

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
        <h1 style={{ color: '#27ae60', margin: '0 0 10px 0' }}>
          📊 Your Assignment Has Been Graded
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Score: <span style={{ color: getGradeColor(percentage), fontWeight: 'bold' }}>
            {percentage}%
          </span>
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>Hi {studentName},</p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Your assignment for <strong>{courseTitle}</strong> has been graded! 🎉
      </p>

      <div style={{ backgroundColor: '#e8f4f8', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>
          Assignment: {assignmentTitle}
        </p>
        <div
          style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>Score:</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: getGradeColor(percentage) }}>
              {score}/{maxScore}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '14px' }}>Percentage:</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: getGradeColor(percentage) }}>
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div style={{ backgroundColor: '#fff3cd', padding: '16px', borderRadius: '6px', marginBottom: '20px', borderLeft: '4px solid #ffc107' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#856404' }}>
            Lecturer's Feedback:
          </p>
          <p style={{ margin: '0', fontSize: '14px', color: '#856404', whiteSpace: 'pre-wrap' }}>
            {feedback}
          </p>
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a
          href={dashboardUrl}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          View Full Details
        </a>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#666' }}>
        You can view your detailed feedback and comments by logging into your Assessify
        dashboard. Keep working hard! 💪
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
