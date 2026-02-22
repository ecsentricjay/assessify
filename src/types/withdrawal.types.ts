// src/types/withdrawal.types.ts
// Shared withdrawal types for admin interface

export interface Withdrawal {
  id: string
  amount: number
  status: string
  bank_name: string
  account_number: string
  account_name: string
  created_at?: string | null
  requested_at?: string | null
  notes?: string | null
  request_notes?: string | null
  lecturer?: {
    first_name: string
    last_name: string
    email: string
  } | null
  partner?: {
    business_name: string
    partner_code: string
  } | null
  payment_reference?: string | null
  reviewed_at?: string | null
  paid_at?: string | null
  rejection_reason?: string | null
  review_notes?: string | null
}