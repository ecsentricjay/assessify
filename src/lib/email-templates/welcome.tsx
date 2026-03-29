import React from 'react'

interface WelcomeEmailProps {
  firstName: string
  role: string
  dashboardUrl: string
}

export function WelcomeEmail({
  firstName,
  role,
  dashboardUrl,
}: WelcomeEmailProps) {
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1)

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
          👋 Welcome to Assessify!
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Your account is ready to use
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>Hi {firstName},</p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Welcome to <strong>Assessify</strong> – your ultimate platform for continuous
        assessment management! 🎓
      </p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Your account has been created as a <strong>{roleDisplay}</strong>. Here&apos;s what
        you can do:
      </p>

      {role === 'student' && (
        <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            📚 <strong>Enroll in courses</strong> and access learning materials
          </li>
          <li style={{ marginBottom: '8px' }}>
            📝 <strong>Submit assignments</strong> with AI-powered grading support
          </li>
          <li style={{ marginBottom: '8px' }}>
            🧪 <strong>Take tests</strong> and get instant results
          </li>
          <li style={{ marginBottom: '8px' }}>
            💰 <strong>Manage your wallet</strong> for submission fees
          </li>
          <li style={{ marginBottom: '8px' }}>
            📊 <strong>Track progress</strong> with detailed analytics
          </li>
        </ul>
      )}

      {role === 'lecturer' && (
        <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            📚 <strong>Create courses</strong> and manage enrollment
          </li>
          <li style={{ marginBottom: '8px' }}>
            📝 <strong>Set assignments</strong> with flexible submission options
          </li>
          <li style={{ marginBottom: '8px' }}>
            🧪 <strong>Build tests</strong> with various question types
          </li>
          <li style={{ marginBottom: '8px' }}>
            🤖 <strong>Use AI grading</strong> to evaluate student work
          </li>
          <li style={{ marginBottom: '8px' }}>
            📊 <strong>Analyze performance</strong> with detailed reports
          </li>
        </ul>
      )}

      {role === 'admin' && (
        <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            👥 <strong>Manage users</strong> and assign roles
          </li>
          <li style={{ marginBottom: '8px' }}>
            💰 <strong>Handle finances</strong> and partner earnings
          </li>
          <li style={{ marginBottom: '8px' }}>
            📊 <strong>View analytics</strong> and platform metrics
          </li>
          <li style={{ marginBottom: '8px' }}>
            🔧 <strong>Configure settings</strong> and system preferences
          </li>
          <li style={{ marginBottom: '8px' }}>
            ⚙️ <strong>Monitor activities</strong> with audit logs
          </li>
        </ul>
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
          Login to Assessify
        </a>
      </div>

      <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1565c0' }}>
          💡 Quick Tips:
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
          <li style={{ marginBottom: '4px' }}>Complete your profile to help others identify you</li>
          <li style={{ marginBottom: '4px' }}>Explore our help center for tutorials and FAQs</li>
          <li style={{ marginBottom: '4px' }}>Enable notifications to stay updated on important events</li>
          <li>Contact support if you need any assistance</li>
        </ul>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#666' }}>
        We&apos;re excited to have you on the platform! If you have any questions or need
        help getting started, don&apos;t hesitate to reach out to our support team.
      </p>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
          This is an automated welcome email from Assessify. Please don&apos;t reply to
          this email.
        </p>
      </div>
    </div>
  )
}
