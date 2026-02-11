// lib/utils/revenue-split.ts

import { createClient } from '@/lib/supabase/server'

export interface RevenueSplitResult {
  hasPartner: boolean
  partnerId: string | null
  referralId: string | null
  commissionRate: number
  lecturerAmount: number
  partnerAmount: number
  platformAmount: number
}

interface PartnerInfo {
  partner_id: string
  referral_id: string
  partner_status: string
  commission_rate: number
}

/**
 * Calculate revenue split for a submission
 * @param submissionAmount - Total amount (e.g., ₦200)
 * @param lecturerId - ID of the lecturer receiving the submission
 * @returns Revenue split breakdown
 */
export async function calculateRevenueSplit(
  submissionAmount: number,
  lecturerId: string
): Promise<RevenueSplitResult> {
  const supabase = await createClient()

  // Default split: Lecturer 50%, Platform 50% (no partner)
  const defaultSplit: RevenueSplitResult = {
    hasPartner: false,
    partnerId: null,
    referralId: null,
    commissionRate: 0,
    lecturerAmount: submissionAmount * 0.5,
    partnerAmount: 0,
    platformAmount: submissionAmount * 0.5,
  }

  try {
    // Check if lecturer has a partner
    const { data: partnerInfo, error } = await supabase
      .rpc('get_partner_by_lecturer', { lecturer_uuid: lecturerId })
      .single()

    if (error || !partnerInfo || (partnerInfo as PartnerInfo).partner_status !== 'active') {
      // No active partner, use default split
      return defaultSplit
    }

    // Has partner: Lecturer 50%, Partner 15%, Platform 35%
    const commissionRate = Number((partnerInfo as PartnerInfo).commission_rate) || 15
    const lecturerAmount = submissionAmount * 0.5
    const partnerAmount = submissionAmount * (commissionRate / 100)
    const platformAmount = submissionAmount - lecturerAmount - partnerAmount

    return {
      hasPartner: true,
      partnerId: (partnerInfo as PartnerInfo).partner_id,
      referralId: (partnerInfo as PartnerInfo).referral_id,
      commissionRate,
      lecturerAmount,
      partnerAmount,
      platformAmount,
    }
  } catch (error) {
    console.error('Calculate revenue split error:', error)
    return defaultSplit
  }
}

/**
 * Format revenue split for display
 */
export function formatRevenueSplit(split: RevenueSplitResult, totalAmount: number) {
  return {
    total: totalAmount,
    breakdown: [
      {
        recipient: 'Lecturer',
        amount: split.lecturerAmount,
        percentage: 50,
      },
      ...(split.hasPartner
        ? [
            {
              recipient: 'Partner',
              amount: split.partnerAmount,
              percentage: split.commissionRate,
            },
          ]
        : []),
      {
        recipient: 'Platform',
        amount: split.platformAmount,
        percentage: split.hasPartner ? 35 : 50,
      },
    ],
  }
}