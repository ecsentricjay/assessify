import React from 'react'

interface PartnerCredentialsEmailProps {
  firstName: string
  lastName: string
  email: string
  temporaryPassword: string
  partnerCode: string
  loginUrl: string
}

export function PartnerCredentialsEmail({
  firstName,
  lastName,
  email,
  temporaryPassword,
  partnerCode,
  loginUrl,
}: PartnerCredentialsEmailProps) {
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
        <h1 style={{ color: '#1f2a5a', margin: '0 0 10px 0' }}>
          🤝 Welcome to Assessify Partner Program!
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Your partner account has been created
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>Hi {firstName} {lastName},</p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Welcome to the <strong>Assessify Partner Program</strong>! Your partner account has been
        successfully created by the Assessify administration team. Below are your login credentials:
      </p>

      <div style={{
        backgroundColor: '#f0f4ff',
        border: '1px solid #cfd9e3',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '20px',
      }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#1f2a5a' }}>
          Your Login Credentials:
        </p>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Email Address:</p>
          <p style={{ margin: '0', fontFamily: 'monospace', fontSize: '14px', fontWeight: '500', color: '#1f2a5a' }}>
            {email}
          </p>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Temporary Password:</p>
          <p style={{ margin: '0', fontFamily: 'monospace', fontSize: '14px', fontWeight: '500', color: '#1f2a5a', backgroundColor: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            {temporaryPassword}
          </p>
        </div>
        <div>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>Partner Code:</p>
          <p style={{ margin: '0', fontFamily: 'monospace', fontSize: '14px', fontWeight: '500', color: '#16a34a' }}>
            {partnerCode}
          </p>
        </div>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Please keep these credentials safe and secure. You can change your password after your first login.
      </p>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a
          href={loginUrl}
          style={{
            backgroundColor: '#1f2a5a',
            color: 'white',
            padding: '12px 32px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          Login to Your Account
        </a>
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '6px', marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#92400e' }}>
          ⚠️ Important Security Information:
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px', color: '#92400e' }}>
          <li style={{ marginBottom: '4px' }}>This password was randomly generated. We recommend changing it immediately upon first login.</li>
          <li style={{ marginBottom: '4px' }}>Never share your login credentials with anyone.</li>
          <li style={{ marginBottom: '4px' }}>If you did not create this account, contact support immediately.</li>
          <li>For your account security, always provide your password only on the official Assessify login page.</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#1565c0' }}>
          What You Can Do as a Partner:
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '14px' }}>
          <li style={{ marginBottom: '4px' }}>📊 Track lecturer referrals and earnings in real-time</li>
          <li style={{ marginBottom: '4px' }}>💰 View commission earnings from your referrals</li>
          <li style={{ marginBottom: '4px' }}>🔄 Monitor submissions from referred lecturers</li>
          <li style={{ marginBottom: '4px' }}>💳 Request payments and view transaction history</li>
          <li style={{ marginBottom: '4px' }}>📈 Access detailed analytics and performance metrics</li>
        </ul>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#666' }}>
        If you have any questions or need assistance, our support team is ready to help. Contact us
        through the help center in your account dashboard.
      </p>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
          This is an automated email from Assessify. Please don't reply to this email.
        </p>
      </div>
    </div>
  )
}
