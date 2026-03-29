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

  // Default split: Lecturer 35%, Platform 65% (no partner)
  const defaultSplit: RevenueSplitResult = {
    hasPartner: false,
    partnerId: null,
    referralId: null,
    commissionRate: 0,
    lecturerAmount: submissionAmount * 0.35,
    partnerAmount: 0,
    platformAmount: submissionAmount * 0.65,
  }

  try {
    // Check if lecturer has an active partner referral
    const { data: referralData, error: referralError } = await supabase
      .from('referrals')
      .select(`
        id,
        partner_id,
        status,
        partners!partner_id (
          id,
          commission_rate,
          status
        )
      `)
      .eq('referred_lecturer_id', lecturerId)
      .eq('status', 'active')
      .single()

    // Check if query succeeded and referral/partner is active
    if (referralError || !referralData) {
      // No active partner, use default split
      console.log('ℹ️ No active partner for lecturer:', lecturerId)
      return defaultSplit
    }

    const partner = (referralData as any).partners
    if (!partner || partner.status !== 'active') {
      // Partner inactive, use default split
      console.log('ℹ️ Partner inactive for lecturer:', lecturerId)
      return defaultSplit
    }

    // Has active partner: Lecturer 35%, Partner 15%, Platform 50%
    const commissionRate = Number(partner.commission_rate) || 15
    const lecturerAmount = submissionAmount * 0.35
    const partnerAmount = submissionAmount * (commissionRate / 100)
    const platformAmount = submissionAmount * 0.50

    console.log('✅ Partner found for lecturer - Commission:', commissionRate, '%')

    return {
      hasPartner: true,
      partnerId: partner.id,
      referralId: referralData.id,
      commissionRate,
      lecturerAmount,
      partnerAmount,
      platformAmount,
    }
  } catch (error) {
    console.error('❌ Calculate revenue split error:', error)
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
        percentage: 35,
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
        percentage: split.hasPartner ? 50 : 65,
      },
    ],
  }
}