/**
 * Authentication Context
 * Manages user authentication state using Supabase Auth directly
 *
 * Flow:
 * 1. OTP is sent/verified directly with Supabase (no race conditions)
 * 2. After auth, we call /auth/me to get is_new_user status (for onboarding)
 * 3. Token refresh is handled automatically by Supabase
 *
 * Auth Status Model:
 * - loading: Checking for existing session on app launch
 * - unauthenticated: No valid session
 * - authenticated_new_user: Valid session, but onboarding not completed
 * - authenticated: Valid session, onboarding completed
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User, OnboardingData } from "@/types/auth";
import { supabase } from "@/lib/supabase";
import { authService } from "@/api/services/auth.service";

/** Auth status for route guards */
export type AuthStatus = "loading" | "unauthenticated" | "authenticated_new_user" | "authenticated";

interface SignOutOptions {
  /** Skip calling backend logout (e.g., when account was already deleted) */
  skipBackendLogout?: boolean;
}

interface AuthContextType {
  user: User | null;
  /** True only during initial app load while checking for existing session */
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True if user is authenticated but hasn't completed onboarding */
  isNewUser: boolean;
  /** Computed auth status for Stack.Protected guards */
  authStatus: AuthStatus;
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, token: string) => Promise<void>;
  submitOnboarding: (data: OnboardingData) => Promise<void>;
  signOut: (options?: SignOutOptions) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializingRef = useRef(false);
  // Flag to prevent onAuthStateChange from interfering during active auth operations
  const isAuthenticatingRef = useRef(false);

  /**
   * Fetch user info from backend (includes is_new_user from onboarding_completed check)
   */
  const fetchUserInfo = useCallback(async (): Promise<User | null> => {
    try {
      const userInfo = await authService.getCurrentUser();
      return userInfo;
    } catch (error) {
      console.log("Failed to fetch user info from backend:", error);
      return null;
    }
  }, []);

  /**
   * Initialize authentication on app launch
   * Checks for existing Supabase session and loads user data
   */
  const initializeAuth = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setIsLoading(true);

      // Check if we have an existing Supabase session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.log("Error getting session:", error);
        setUser(null);
        return;
      }

      if (session?.user) {
        // We have a valid session, get user info from backend
        // This includes is_new_user which is needed for onboarding routing
        const userInfo = await fetchUserInfo();

        if (userInfo) {
          // Block anonymous users - they must authenticate with email/phone
          if (userInfo.is_anonymous) {
            console.log("Anonymous user detected, signing out");
            await supabase.auth.signOut();
            setUser(null);
            return;
          }
          setUser(userInfo);
        } else {
          // Backend call failed, but we have a valid session
          // Create a basic user object from Supabase session
          setUser({
            id: session.user.id,
            email: session.user.email ?? undefined,
            phone: session.user.phone ?? undefined,
            created_at: session.user.created_at,
            user_metadata: session.user.user_metadata ?? {},
            is_new_user: true, // Safe default - will redirect to onboarding
            is_anonymous: false,
          });
        }
      } else {
        // No session, user needs to authenticate
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, [fetchUserInfo]);

  /**
   * Send OTP code to email address using Supabase directly
   */
  const sendEmailOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Don't create user if they don't exist - let Supabase handle it
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("Failed to send OTP:", error);
      throw error;
    }
  };

  /**
   * Verify OTP code and authenticate user using Supabase directly
   * Note: Does NOT set isLoading - that's only for initial app load.
   * The calling component should manage its own loading state (e.g., isVerifying).
   */
  const verifyEmailOTP = async (email: string, token: string) => {
    // Set flag to prevent onAuthStateChange from interfering
    isAuthenticatingRef.current = true;

    try {
      // Verify OTP with Supabase directly - this creates/updates the session
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      // IMPORTANT: Check for error FIRST before doing anything else
      // Don't fetch user info if OTP verification failed
      if (error) {
        console.error("OTP verification failed:", error);
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error("Verification succeeded but no user/session returned");
      }

      // Only fetch user info AFTER successful OTP verification
      // The backend validates the JWT and checks onboarding_completed in DB
      const userInfo = await fetchUserInfo();

      if (userInfo) {
        setUser(userInfo);
      } else {
        // Fallback: create user from Supabase data
        setUser({
          id: data.user.id,
          email: data.user.email ?? undefined,
          phone: data.user.phone ?? undefined,
          created_at: data.user.created_at,
          user_metadata: data.user.user_metadata ?? {},
          is_new_user: true, // Safe default
          is_anonymous: false,
        });
      }
    } finally {
      isAuthenticatingRef.current = false;
    }
  };

  /**
   * Submit onboarding questionnaire
   */
  const submitOnboarding = async (data: OnboardingData) => {
    await authService.submitOnboarding(data);
    // Refresh user data after onboarding to update is_new_user
    await refreshUser();
  };

  /**
   * Sign out the current user
   * Clears Supabase session, React Query cache, and local state
   * @param options.skipBackendLogout - Skip backend logout call (e.g., after account deletion)
   */
  const signOut = async (options?: SignOutOptions) => {
    try {
      // Notify backend FIRST while we still have a valid token
      // Skip if account was already deleted or explicitly requested
      if (!options?.skipBackendLogout) {
        try {
          await authService.logout();
        } catch (backendError) {
          // Expected to fail if token already expired, that's fine
          console.log("Backend logout (non-critical):", backendError);
        }
      }

      // Then sign out from Supabase (clears local session)
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.log("Supabase signOut error (non-critical):", error);
      }

      // Clear ALL React Query cache to prevent data leaking between accounts
      queryClient.clear();

      setUser(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw error;
    }
  };

  /**
   * Refresh current user data from backend
   */
  const refreshUser = async () => {
    try {
      const userInfo = await fetchUserInfo();
      if (userInfo) {
        setUser(userInfo);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      throw error;
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for auth state changes (token refresh, sign out, etc.)
  // Note: We only care about SIGNED_OUT and TOKEN_REFRESHED events here.
  // INITIAL_SESSION is handled by initializeAuth() on mount.
  // SIGNED_IN during verification is handled by verifyEmailOTP().
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      // Ignore auth state changes while we're actively authenticating
      // (verifyEmailOTP handles its own state management)
      if (isAuthenticatingRef.current) {
        console.log("Ignoring auth state change - authentication in progress");
        return;
      }

      // Ignore INITIAL_SESSION - it's handled by initializeAuth() on mount
      // and fires redundantly on every component re-render
      if (event === "INITIAL_SESSION") {
        console.log("Ignoring INITIAL_SESSION - handled by initializeAuth");
        return;
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Token was refreshed - session is still valid, no action needed
        console.log("Token refreshed successfully");
      } else if (event === "SIGNED_IN" && session?.user && !user) {
        // User signed in from external source (e.g., deep link, another device)
        // This won't fire during normal verifyEmailOTP flow due to isAuthenticatingRef
        console.log("External sign-in detected, fetching user info");
        const userInfo = await fetchUserInfo();
        if (userInfo) {
          setUser(userInfo);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserInfo, user]);

  // Computed values for route guards
  const isAuthenticated = !!user;
  const isNewUser = user?.is_new_user ?? false;

  const authStatus: AuthStatus = useMemo(() => {
    if (isLoading) return "loading";
    if (!user) return "unauthenticated";
    if (user.is_new_user) return "authenticated_new_user";
    return "authenticated";
  }, [isLoading, user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isNewUser,
    authStatus,
    sendEmailOTP,
    verifyEmailOTP,
    submitOnboarding,
    signOut,
    refreshUser,
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
