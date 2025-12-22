/**
 * Referrals API service
 *
 * Handles referral code management and redemption.
 */
import { api } from "@/api";

export interface ReferralCodeResponse {
  code: string;
  uses_count: number;
}

export interface ReferralValidateResponse {
  is_valid: boolean;
  message: string;
  referrer_name: string | null;
}

export interface ReferralRedeemResponse {
  success: boolean;
  message: string;
  credits_awarded: number | null;
}

export interface ReferralStatsResponse {
  code: string;
  uses_count: number;
  total_credits_earned: number;
  pending_referral_credits: number;
}

export const referralsService = {
  /**
   * Get user's referral code (generates one if needed)
   */
  async getCode(): Promise<ReferralCodeResponse> {
    const response = await api.get<ReferralCodeResponse>("/referrals/code");
    return response.data;
  },

  /**
   * Validate a referral code
   */
  async validate(code: string): Promise<ReferralValidateResponse> {
    const response = await api.post<ReferralValidateResponse>("/referrals/validate", { code });
    return response.data;
  },

  /**
   * Redeem a referral code
   */
  async redeem(code: string): Promise<ReferralRedeemResponse> {
    const response = await api.post<ReferralRedeemResponse>("/referrals/redeem", { code });
    return response.data;
  },

  /**
   * Get referral statistics
   */
  async getStats(): Promise<ReferralStatsResponse> {
    const response = await api.get<ReferralStatsResponse>("/referrals/stats");
    return response.data;
  },
};
