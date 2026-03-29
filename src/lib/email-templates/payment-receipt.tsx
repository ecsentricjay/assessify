import React from 'react'

interface PaymentReceiptEmailProps {
  studentName: string
  amount: number
  reference: string
  date: string
  paymentMethod: string
  walletBalance: number
}

export function PaymentReceiptEmail({
  studentName,
  amount,
  reference,
  date,
  paymentMethod,
  walletBalance,
}: PaymentReceiptEmailProps) {
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
        <h1 style={{ color: '#059669', margin: '0 0 10px 0' }}>
          💳 Payment Receipt
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
          Your wallet has been funded successfully
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>Hi {studentName},</p>

      <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
        Thank you for funding your Assessify wallet! Your payment has been processed
        successfully. You can now submit assignments and take tests.
      </p>

      <div style={{ backgroundColor: '#d1fae5', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#065f46' }}>
          Payment Details:
        </p>
        <div
          style={{
            backgroundColor: 'white',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        >
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>Amount:</strong> ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>Reference:</strong> <code>{reference}</code>
          </p>
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>Payment Method:</strong> {paymentMethod}
          </p>
          <p style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>Date:</strong> {date}
          </p>
        </div>
        <p style={{ margin: '8px 0', fontSize: '14px', backgroundColor: '#ecfdf5', padding: '8px', borderRadius: '4px' }}>
          <strong>New Wallet Balance:</strong> ₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <p style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#666' }}>
        Your funds are ready to use! Start submitting assignments and taking tests
        right away. If you have any issues, please contact our support team.
      </p>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
          This is an automated receipt from Assessify. Please keep it for your records.
        </p>
      </div>
    </div>
  )
}
