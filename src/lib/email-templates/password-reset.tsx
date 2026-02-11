import React from 'react'

interface PasswordResetEmailProps {
  userName: string
  resetLink: string
  expiryTime?: string
}

export function PasswordResetEmail({
  userName,
  resetLink,
  expiryTime = '24 hours',
}: PasswordResetEmailProps) {
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
        <h1 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>
          🔑 Password Reset Request
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Secure your account
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>Hi {userName},</p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        We received a request to reset your Assessify account password. If you didn't
        make this request, you can safely ignore this email and your password will
        remain unchanged.
      </p>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <a
          href={resetLink}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Reset Password
        </a>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#666' }}>
        Or copy and paste this link into your browser:
      </p>

      <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '4px', marginBottom: '20px', wordBreak: 'break-all' }}>
        <code style={{ fontSize: '12px', color: '#374151' }}>{resetLink}</code>
      </div>

      <div style={{ backgroundColor: '#fee2e2', padding: '16px', borderRadius: '6px', marginBottom: '20px', borderLeft: '4px solid #dc2626' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#7f1d1d' }}>
          ⏰ Important:
        </p>
        <p style={{ margin: '0', fontSize: '14px', color: '#7f1d1d' }}>
          This link expires in {expiryTime}. Reset your password immediately to
          maintain account security.
        </p>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#666' }}>
        If you didn't request a password reset, please secure your account by
        contacting our support team immediately.
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
