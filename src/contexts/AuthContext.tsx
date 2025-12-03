/**
 * Authentication Context
 * Manages user authentication state with email OTP authentication
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, OnboardingData } from "@/types/auth";
import { authService } from "@/api/services/auth.service";
import { tokenManager } from "@/api/token-manager";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, token: string) => Promise<void>;
  submitOnboarding: (data: OnboardingData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string, expiresIn?: number) => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize authentication on app launch
   * Checks for existing tokens and loads user data if available
   * Anonymous users are logged out and must re-authenticate with email/phone
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if we have existing tokens
      const accessToken = await tokenManager.getAccessToken();

      if (accessToken) {
        // We have tokens, try to get current user
        try {
          const currentUser = await authService.getCurrentUser();

          // Block anonymous users - they must authenticate with email/phone
          if (currentUser.is_anonymous) {
            console.log("Anonymous user detected, clearing tokens and requiring re-authentication");
            await tokenManager.clearTokens();
            setUser(null);
            return;
          }

          setUser(currentUser);
        } catch (error) {
          console.log("Failed to get current user, clearing tokens:", error);
          // Tokens might be invalid, clear them
          await tokenManager.clearTokens();
          setUser(null);
        }
      } else {
        // No tokens, user needs to authenticate
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Send OTP code to email address
   */
  const sendEmailOTP = async (email: string) => {
    await authService.sendEmailOTP({ email });
  };

  /**
   * Verify OTP code and authenticate user
   */
  const verifyEmailOTP = async (email: string, token: string) => {
    try {
      setIsLoading(true);
      const response = await authService.verifyEmailOTP({ email, token, type: "email" });

      // Store tokens
      await tokenManager.setTokens(
        response.access_token,
        response.refresh_token,
        response.expires_in
      );

      // Set user
      setUser(response.user);
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submit onboarding questionnaire
   */
  const submitOnboarding = async (data: OnboardingData) => {
    await authService.submitOnboarding(data);
    // Refresh user data after onboarding
    await refreshUser();
  };

  /**
   * Manually set tokens (used by verify-otp screen)
   */
  const setTokensManual = async (accessToken: string, refreshToken: string, expiresIn?: number) => {
    await tokenManager.setTokens(accessToken, refreshToken, expiresIn || 3600);
  };

  /**
   * Manually set user (used by verify-otp screen)
   */
  const setUserManual = (newUser: User) => {
    setUser(newUser);
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      // Call logout endpoint (ignore errors if it fails)
      try {
        await authService.logout();
      } catch (error) {
        console.log("Logout endpoint failed (non-critical):", error);
      }

      // Clear tokens and user data
      await tokenManager.clearTokens();
      setUser(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw error;
    }
  };

  /**
   * Refresh current user data
   */
  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      throw error;
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    sendEmailOTP,
    verifyEmailOTP,
    submitOnboarding,
    signOut,
    refreshUser,
    setTokens: setTokensManual,
    setUser: setUserManual,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
