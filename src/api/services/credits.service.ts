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

export interface SubscriptionStatusResponse {
  status: string;
  is_premium: boolean;
  is_trialing: boolean;
  product_id: string | null;
  expires_at: string | null;
  will_renew: boolean;
}

export const creditsService = {
  /**
   * Get current user's credit balance
   */
  async getCredits(): Promise<CreditsResponse> {
    const response = await api.get<CreditsResponse>("/credits", {
      skipAuthRedirect: true, // Don't trigger logout loop on 401
    });
    return response.data;
  },

  /**
   * Pre-flight check if user can extract
   */
  async canExtract(): Promise<CanExtractResponse> {
    const response = await api.post<CanExtractResponse>("/credits/check");
    return response.data;
  },

  /**
   * Sync subscription status from RevenueCat
   * Call this after a purchase to update the backend
   */
  async syncSubscription(): Promise<SubscriptionStatusResponse> {
    const response = await api.post<SubscriptionStatusResponse>("/credits/subscription/sync", undefined, {
      skipAuthRedirect: true, // Don't trigger logout loop on 401
    });
    return response.data;
  },
};
