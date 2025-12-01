/**
 * Authentication types matching backend passwordless schemas
 */

// ============================================================================
// USER & RESPONSE TYPES
// ============================================================================

export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  user_metadata?: Record<string, unknown>;
  is_new_user: boolean;
  is_anonymous: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  expires_in: number;
  expires_at?: number;
}

// ============================================================================
// PASSWORDLESS AUTHENTICATION
// ============================================================================

// Email OTP
export interface EmailAuthRequest {
  email: string;
}

export interface VerifyEmailOTPRequest {
  email: string;
  token: string;
  type: "email";
}

// Phone OTP
export interface PhoneAuthRequest {
  phone: string;
}

export interface VerifyPhoneOTPRequest {
  phone: string;
  token: string;
  type: "sms";
}

// ============================================================================
// ONBOARDING & PROFILE COMPLETION
// ============================================================================

export interface OnboardingData {
  heard_from: string; // 'social_media' | 'friend' | 'app_store' | 'blog' | 'search_engine' | 'other'
  cooking_frequency: string; // 'rarely' | 'occasionally' | 'regularly' | 'almost_daily'
  recipe_sources: string[]; // ['tiktok', 'instagram', 'youtube', 'blogs', 'cookbooks', 'family', 'other']
  display_name?: string;
}

export interface CompleteProfileRequest {
  name: string;
  date_of_birth: string; // ISO date string (YYYY-MM-DD)
  bio?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
  bio?: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ============================================================================
// IDENTITY LINKING (ANONYMOUS TO AUTHENTICATED)
// ============================================================================

export interface LinkEmailIdentityRequest {
  email: string;
}

export interface LinkPhoneIdentityRequest {
  phone: string;
}
