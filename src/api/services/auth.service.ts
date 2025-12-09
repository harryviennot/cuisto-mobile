/**
 * Authentication API service
 *
 * Note: OTP send/verify and token refresh are now handled directly by Supabase.
 * This service now only contains backend-specific operations that require
 * server-side business logic (onboarding, account deletion, etc.)
 */
import { api } from "../api-client";
import type { OnboardingData, User } from "@/types/auth";

export const authService = {
  /**
   * Get current user info (authenticated endpoint)
   * Returns user data including is_new_user flag (from onboarding_completed check)
   */
  getCurrentUser: async () => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  /**
   * Logout (authenticated endpoint)
   * Notifies backend for cleanup/logging purposes
   * Note: Supabase signOut should also be called client-side
   */
  logout: async () => {
    const response = await api.post<{ message: string }>(
      "/auth/logout",
      {},
      {
        skipAuthRedirect: true, // Don't redirect on auth failure
      }
    );
    return response.data;
  },

  /**
   * Submit onboarding questionnaire (authenticated endpoint)
   * Called after email verification for new users
   * Sets onboarding_completed = true in database
   */
  submitOnboarding: async (data: OnboardingData) => {
    const response = await api.post<{ message: string }>("/auth/onboarding", data);
    return response.data;
  },

  /**
   * Request email change (authenticated endpoint)
   * Sends OTP verification code to new address
   */
  changeEmail: async (newEmail: string) => {
    const response = await api.post<{ message: string }>("/auth/email/change", {
      new_email: newEmail,
    });
    return response.data;
  },

  /**
   * Verify email change with OTP (authenticated endpoint)
   * Completes the email change after user enters the 6-digit code
   */
  verifyEmailChange: async (email: string, token: string) => {
    const response = await api.post<{ message: string }>("/auth/email/change/verify", {
      email,
      token,
    });
    return response.data;
  },

  /**
   * Delete user account (authenticated endpoint)
   * Permanently deletes account and associated data
   */
  deleteAccount: async () => {
    const response = await api.delete<{ message: string }>("/auth/account");
    return response.data;
  },
};
