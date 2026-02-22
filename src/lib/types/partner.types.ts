// lib/types/partner.types.ts

import { Database } from './database.types'

// Base types from database
export type Partner = Database['public']['Tables']['partners']['Row']
export type PartnerInsert = Database['public']['Tables']['partners']['Insert']
export type PartnerUpdate = Database['public']['Tables']['partners']['Update']

type ReferralRow = Database['public']['Tables']['referrals']['Row']

// Referral interface with calculated fields
export interface Referral extends ReferralRow {
  // New fields for submission and revenue tracking
  assignment_submissions?: number | null
  test_submissions?: number | null
  assignment_revenue?: number | null
  test_revenue?: number | null
  assignment_earnings?: number | null
  test_earnings?: number | null
}

export type ReferralInsert = Database['public']['Tables']['referrals']['Insert']
export type ReferralUpdate = Database['public']['Tables']['referrals']['Update']

export type PartnerEarning = Database['public']['Tables']['partner_earnings']['Row']
export type PartnerEarningInsert = Database['public']['Tables']['partner_earnings']['Insert']
export type PartnerEarningUpdate = Database['public']['Tables']['partner_earnings']['Update']

export type PartnerWithdrawal = Database['public']['Tables']['partner_withdrawals']['Row']
export type PartnerWithdrawalInsert = Database['public']['Tables']['partner_withdrawals']['Insert']
export type PartnerWithdrawalUpdate = Database['public']['Tables']['partner_withdrawals']['Update']

// Extended types with relations
export interface PartnerWithProfile extends Partner {
  profiles?: {
    id: string
    first_name: string
    last_name: string
    phone?: string
    email?: string
  }
}

export interface PartnerWithStats extends PartnerWithProfile {
  stats?: PartnerStatistics
}

export interface ReferralWithDetails extends Referral {
  lecturer?: {
    id: string
    full_name?: string
    email?: string
    first_name?: string
    last_name?: string
    staff_id?: string | null
    department?: string | null
    faculty?: string | null
    phone?: string | null
  } | null
  partner?: {
    id: string
    partner_code: string
    business_name?: string | null
    commission_rate: number
  } | null
}

export interface PartnerEarningWithDetails extends PartnerEarning {
  referral?: {
    id: string
    referred_lecturer_id: string
    referral_code: string
  }
  transaction?: {
    id: string
    reference: string
    amount: number
  }
  student?: {
    id: string
    full_name: string
  }
}

export interface PartnerWithdrawalWithDetails extends PartnerWithdrawal {
  partner?: {
    id: string
    partner_code: string
    business_name?: string
  }
  reviewed_by_profile?: {
    id: string
    full_name: string
  }
  paid_by_profile?: {
    id: string
    full_name: string
  }
}

// Partner Statistics
export interface PartnerStatistics {
  total_referrals: number
  active_referrals: number
  total_submissions: number
  total_revenue: number
  total_earnings: number
  pending_earnings: number
  total_withdrawn: number
  avg_earnings_per_referral: number
}

// Aggregated submission breakdown stats
export interface AggregatedSubmissionStats {
  all_assignment_submissions: number
  all_test_submissions: number
  all_assignment_revenue: number
  all_test_revenue: number
  all_assignment_earnings: number
  all_test_earnings: number
}

// Partner Overview (Dashboard)
export interface PartnerOverview {
  partner: PartnerWithProfile
  statistics: PartnerStatistics
  recent_earnings: PartnerEarningWithDetails[]
  recent_referrals: ReferralWithDetails[]
  pending_withdrawals: PartnerWithdrawalWithDetails[]
  aggregated_stats?: AggregatedSubmissionStats
}

// Filter types
export interface PartnerFilters {
  status?: 'active' | 'inactive' | 'suspended'
  search?: string // Search by name, email, code
  sortBy?: 'created_at' | 'total_earnings' | 'total_referrals'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ReferralFilters {
  partnerId?: string
  status?: 'pending' | 'active' | 'inactive'
  search?: string // Search by lecturer name
  sortBy?: 'created_at' | 'partner_earnings' | 'total_submissions'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface EarningFilters {
  partnerId?: string
  referralId?: string
  status?: 'pending' | 'paid' | 'withdrawn'
  sourceType?: 'assignment_submission' | 'test_submission'
  dateFrom?: string
  dateTo?: string
  sortBy?: 'created_at' | 'amount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface WithdrawalFilters {
  partnerId?: string
  status?: 'pending' | 'approved' | 'rejected' | 'paid'
  dateFrom?: string
  dateTo?: string
  sortBy?: 'requested_at' | 'amount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Form data types - UPDATED FOR NEW FLOW
export interface CreatePartnerData {
  // User details (NEW - no longer requires existing userId)
  email: string
  firstName: string
  lastName: string
  phone?: string
  
  // Partner-specific details
  businessName?: string
  commissionRate?: number // Default 15
  bankName?: string
  accountNumber?: string
  accountName?: string
  notes?: string
}

export interface UpdatePartnerData {
  businessName?: string
  phoneNumber?: string
  commissionRate?: number
  status?: 'active' | 'inactive' | 'suspended'
  bankName?: string
  accountNumber?: string
  accountName?: string
  notes?: string
}

export interface CreateWithdrawalData {
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
  requestNotes?: string
}

export interface ReviewWithdrawalData {
  status: 'approved' | 'rejected'
  reviewNotes?: string
  rejectionReason?: string
}

export interface MarkWithdrawalPaidData {
  paymentReference: string
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Action response types
export interface PartnerActionResponse {
  success?: boolean
  error?: string
  data?: any
}

export interface CreatePartnerResponse extends PartnerActionResponse {
  data?: {
    partner: Partner
    partnerCode: string
    temporaryPassword: string // NEW - Return temp password to admin
    email: string
  }
}

export interface PartnerListResponse extends PartnerActionResponse {
  data?: PaginatedResponse<PartnerWithStats>
}

export interface ReferralListResponse extends PartnerActionResponse {
  data?: PaginatedResponse<ReferralWithDetails>
}

export interface EarningListResponse extends PartnerActionResponse {
  data?: PaginatedResponse<PartnerEarningWithDetails>
}

export interface WithdrawalListResponse extends PartnerActionResponse {
  data?: PaginatedResponse<PartnerWithdrawalWithDetails>
}

// Commission calculation
export interface CommissionCalculation {
  submissionAmount: number
  lecturerAmount: number
  partnerAmount: number
  platformAmount: number
  commissionRate: number
}

// Revenue split (with/without partner)
export interface RevenueSplit {
  hasPartner: boolean
  lecturerPercentage: number
  partnerPercentage: number
  platformPercentage: number
  lecturerAmount: number
  partnerAmount: number
  platformAmount: number
}

// Partner performance metrics
export interface PartnerPerformance {
  partnerId: string
  period: 'day' | 'week' | 'month' | 'year' | 'all'
  totalEarnings: number
  totalSubmissions: number
  activeReferrals: number
  averagePerSubmission: number
  topReferrals: Array<{
    lecturerId: string
    lecturerName: string
    submissions: number
    earnings: number
  }>
}