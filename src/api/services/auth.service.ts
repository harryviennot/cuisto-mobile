/**
 * Authentication API service
 * Example implementation showing different API configurations
 */
import { api } from "../api-client";
import type {
  AuthResponse,
  EmailAuthRequest,
  PhoneAuthRequest,
  VerifyEmailOTPRequest,
  VerifyPhoneOTPRequest,
  RefreshTokenRequest,
  LinkEmailIdentityRequest,
  LinkPhoneIdentityRequest,
  OnboardingData,
  User,
} from "@/types/auth";

export const authService = {
  /**
   * Anonymous sign-in (public endpoint, no credentials required)
   * Returns access token and refresh token for persistent anonymous session
   */
  signInAnonymously: async () => {
    const response = await api.public.post<AuthResponse>(
      "/auth/anonymous",
      {},
      {
        skipAuthRetry: true,
      }
    );
    return response.data;
  },

  /**
   * Send OTP to email (public endpoint, no auth required)
   * Sends a 6-digit OTP code via email
   */
  sendEmailOTP: async (data: EmailAuthRequest) => {
    const response = await api.public.post<{ message: string }>("/auth/email", data);
    return response.data;
  },

  /**
   * Verify email OTP token (public endpoint)
   */
  verifyEmailOTP: async (data: VerifyEmailOTPRequest) => {
    const response = await api.public.post<AuthResponse>("/auth/email/verify", data, {
      skipAuthRetry: true, // Don't retry on 401
    });
    return response.data;
  },

  /**
   * Send OTP to phone (public endpoint)
   */
  sendPhoneOTP: async (data: PhoneAuthRequest) => {
    const response = await api.public.post<{ message: string }>("/auth/phone", data);
    return response.data;
  },

  /**
   * Verify phone OTP (public endpoint)
   */
  verifyPhoneOTP: async (data: VerifyPhoneOTPRequest) => {
    const response = await api.public.post<AuthResponse>("/auth/phone/verify", data, {
      skipAuthRetry: true, // Don't retry on 401
    });
    return response.data;
  },

  /**
   * Refresh access token (public endpoint, manual handling)
   */
  refreshToken: async (data: RefreshTokenRequest) => {
    const response = await api.public.post<AuthResponse>("/auth/refresh", data, {
      skipAuthRetry: true, // Don't retry on 401
    });
    return response.data;
  },

  /**
   * Logout (authenticated endpoint)
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
   * Get current user session (authenticated endpoint)
   */
  getSession: async () => {
    const response = await api.get<AuthResponse>("/auth/session");
    return response.data;
  },

  /**
   * Get current user info (authenticated endpoint)
   */
  getCurrentUser: async () => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  /**
   * Link email identity to anonymous account (authenticated endpoint)
   * Sends magic link for verification
   */
  linkEmailIdentity: async (data: LinkEmailIdentityRequest) => {
    const response = await api.post<{ message: string }>("/auth/link-identity/email", data);
    return response.data;
  },

  /**
   * Link phone identity to anonymous account (authenticated endpoint)
   * Sends OTP for verification
   */
  linkPhoneIdentity: async (data: LinkPhoneIdentityRequest) => {
    const response = await api.post<{ message: string }>("/auth/link-identity/phone", data);
    return response.data;
  },

  /**
   * Submit onboarding questionnaire (authenticated endpoint)
   * Called after email verification for new users
   */
  submitOnboarding: async (data: OnboardingData) => {
    const response = await api.post<{ message: string }>("/auth/onboarding", data);
    return response.data;
  },
};
