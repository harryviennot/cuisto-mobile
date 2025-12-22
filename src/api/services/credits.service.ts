/**
 * Credits API service
 *
 * Handles credit-related API calls for extraction quotas.
 */
import { api } from "@/api";

export interface CreditsResponse {
  standard_credits: number;
  referral_credits: number;
  total_credits: number;
  is_first_week: boolean;
  next_reset_at: string | null;
  can_extract: boolean;
  is_premium: boolean;
}

export interface CanExtractResponse {
  can_extract: boolean;
  reason: string;
  credits_remaining: number | null;
}

export const creditsService = {
  /**
   * Get current user's credit balance
   */
  async getCredits(): Promise<CreditsResponse> {
    const response = await api.get<CreditsResponse>("/credits");
    return response.data;
  },

  /**
   * Pre-flight check if user can extract
   */
  async canExtract(): Promise<CanExtractResponse> {
    const response = await api.post<CanExtractResponse>("/credits/check");
    return response.data;
  },
};
