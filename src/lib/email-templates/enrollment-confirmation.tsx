import React from 'react'

interface EnrollmentConfirmationEmailProps {
  studentName: string
  courseCode: string
  courseTitle: string
  lecturer: string
  enrollmentDate: string
  dashboardUrl: string
}

export function EnrollmentConfirmationEmail({
  studentName,
  courseCode,
  courseTitle,
  lecturer,
  enrollmentDate,
  dashboardUrl,
}: EnrollmentConfirmationEmailProps) {
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
        <h1 style={{ color: '#16a34a', margin: '0 0 10px 0' }}>
          ✅ Course Enrollment Confirmed
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Welcome to {courseCode}!
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>Hi {studentName},</p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Congratulations! You have been successfully enrolled in the course below.
        You can now access all course materials, assignments, and tests.
      </p>

      <div style={{ backgroundColor: '#dcfce7', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#15803d' }}>
          Course Information:
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Code:</strong> {courseCode}
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Title:</strong> {courseTitle}
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Lecturer:</strong> {lecturer}
        </p>
        <p style={{ margin: '8px 0', fontSize: '14px' }}>
          <strong>Enrolled:</strong> {enrollmentDate}
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a
          href={dashboardUrl}
          style={{
            backgroundColor: '#16a34a',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          View Course
        </a>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#666' }}>
        You can now browse course materials and start working on assignments. Check
        your dashboard regularly for updates and new assignments from your lecturer.
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
