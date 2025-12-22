/**
 * Subscription & Credits Context
 *
 * Manages subscription status (RevenueCat) and user credits for extractions.
 *
 * Business Rules:
 * - Premium users: Unlimited extractions
 * - Free users (first week): 5 credits/week
 * - Free users (after first week): 3 credits/week
 * - Credits reset weekly (Monday 00:00 UTC)
 * - Referral credits: 30-day expiry, max 50, used after standard credits
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import {
  initRevenueCat,
  identifyUser,
  logoutRevenueCat,
  checkPremiumStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,
  addCustomerInfoUpdateListener,
  PRO_ENTITLEMENT_ID,
} from "@/lib/revenuecat";
import { useAuth } from "./AuthContext";
import { creditsService, CreditsResponse } from "@/api/services/credits.service";

export interface SubscriptionContextType {
  // Subscription state
  isPremium: boolean;
  isTrialing: boolean;
  isLoading: boolean;
  subscriptionExpiresAt: Date | null;
  offerings: PurchasesOffering | null;

  // Credits state
  credits: CreditsResponse | null;
  standardCredits: number;
  referralCredits: number;
  totalCredits: number;
  isFirstWeek: boolean;
  canExtract: boolean;
  nextResetAt: Date | null;

  // Actions
  refreshCredits: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  // RevenueCat state
  const [isPremium, setIsPremium] = useState(false);
  const [isTrialing, setIsTrialing] = useState(false);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<Date | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

  // Credits state
  const [credits, setCredits] = useState<CreditsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track if user was ever authenticated (to avoid logout on initial undefined state)
  const wasAuthenticatedRef = useRef(false);

  // Initialize RevenueCat on app start
  useEffect(() => {
    console.log("[SubscriptionContext] Initializing RevenueCat...");
    initRevenueCat().then(() => {
      console.log("[SubscriptionContext] RevenueCat initialization complete");
    });
  }, []);

  // Identify user with RevenueCat when authenticated
  useEffect(() => {
    console.log("[SubscriptionContext] Auth state changed:", { isAuthenticated, userId: user?.id });
    if (isAuthenticated && user?.id) {
      wasAuthenticatedRef.current = true;
      console.log("[SubscriptionContext] Identifying user with RevenueCat...");
      identifyUser(user.id).then((customerInfo) => {
        console.log("[SubscriptionContext] User identified, customerInfo:", customerInfo ? "received" : "null");
        refreshSubscription();
        // Fetch offerings after user is identified (ensures correct user context)
        getOfferings().then(setOfferings);
      });
    } else if (!isAuthenticated && wasAuthenticatedRef.current) {
      // Only logout if we were previously authenticated (not on initial undefined state)
      console.log("[SubscriptionContext] User logged out, resetting state");
      logoutRevenueCat();
      setIsPremium(false);
      setIsTrialing(false);
      setSubscriptionExpiresAt(null);
      setCredits(null);
      wasAuthenticatedRef.current = false;
    }
  }, [isAuthenticated, user?.id]);

  // Fetch credits when authenticated (only on auth change, not on isPremium change)
  useEffect(() => {
    if (isAuthenticated) {
      console.log("[SubscriptionContext] Fetching credits on auth...");
      refreshCredits();
    }
  }, [isAuthenticated]);

  // Listen for subscription changes
  useEffect(() => {
    const unsubscribe = addCustomerInfoUpdateListener((customerInfo) => {
      // Defer state updates to allow the paywall to fully dismiss
      // This prevents the "navigation context" error when the paywall is dismissing
      // Use setTimeout instead of InteractionManager for more reliable deferral
      setTimeout(() => {
        updateFromCustomerInfo(customerInfo);
      }, 500);
    });

    return unsubscribe;
  }, []);

  const updateFromCustomerInfo = useCallback(async (customerInfo: CustomerInfo) => {
    console.log("[SubscriptionContext] updateFromCustomerInfo called");
    console.log("[SubscriptionContext] Active entitlements:", Object.keys(customerInfo.entitlements.active));
    console.log("[SubscriptionContext] Looking for entitlement:", PRO_ENTITLEMENT_ID);

    const proEntitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];

    if (proEntitlement) {
      console.log("[SubscriptionContext] Pro entitlement found:", JSON.stringify(proEntitlement, null, 2));
      setIsPremium(true);
      setIsTrialing(proEntitlement.periodType === "TRIAL");
      setSubscriptionExpiresAt(
        proEntitlement.expirationDate ? new Date(proEntitlement.expirationDate) : null
      );

      // Only sync with backend if user is authenticated
      // RevenueCat may fire callbacks before auth is complete
      if (isAuthenticated) {
        try {
          console.log("[SubscriptionContext] Syncing subscription to backend...");
          const syncResult = await creditsService.syncSubscription();
          console.log("[SubscriptionContext] Backend subscription sync complete:", syncResult);

          // After sync completes, refresh credits to get updated state from backend
          console.log("[SubscriptionContext] Refreshing credits after sync...");
          const creditsData = await creditsService.getCredits();
          console.log("[SubscriptionContext] Credits after sync:", JSON.stringify(creditsData, null, 2));
          setCredits(creditsData);
        } catch (error) {
          console.warn("[SubscriptionContext] Failed to sync subscription to backend:", error);
          // Non-critical - the webhook should eventually sync it
        }
      } else {
        console.log("[SubscriptionContext] Skipping backend sync - user not authenticated yet");
      }
    } else {
      console.log("[SubscriptionContext] No pro entitlement found, user is not premium");
      console.log("[SubscriptionContext] All entitlements:", JSON.stringify(customerInfo.entitlements, null, 2));
      setIsPremium(false);
      setIsTrialing(false);
      setSubscriptionExpiresAt(null);
    }
  }, [isAuthenticated]);

  const refreshSubscription = useCallback(async () => {
    try {
      const status = await checkPremiumStatus();
      setIsPremium(status.isPremium);
      setIsTrialing(status.isTrialing);
      setSubscriptionExpiresAt(status.expiresAt);
    } catch (error) {
      console.error("[Subscription] Error refreshing:", error);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("[SubscriptionContext] refreshCredits: not authenticated, skipping");
      return;
    }

    setIsLoading(true);
    try {
      console.log("[SubscriptionContext] Calling creditsService.getCredits()...");
      const creditsData = await creditsService.getCredits();
      console.log("[SubscriptionContext] Credits response:", JSON.stringify(creditsData, null, 2));
      setCredits(creditsData);
      // Note: We don't update isPremium from backend here - RevenueCat is the source of truth
      // The backend's is_premium is only updated after sync, so it may be stale
    } catch (error) {
      console.error("[SubscriptionContext] Error fetching credits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const customerInfo = await purchasePackage(pkg);
      // The CustomerInfoUpdateListener will handle the state updates
      // We just return whether the purchase succeeded
      return customerInfo?.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
    } catch (error) {
      console.error("[Subscription] Purchase error:", error);
      throw error;
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const customerInfo = await restorePurchases();
      // The CustomerInfoUpdateListener will handle the state updates
      // We just return whether the restore found an active subscription
      return customerInfo?.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
    } catch (error) {
      console.error("[Subscription] Restore error:", error);
      throw error;
    }
  }, []);

  // Computed values
  const standardCredits = credits?.standard_credits ?? 0;
  const referralCredits = credits?.referral_credits ?? 0;
  const totalCredits = credits?.total_credits ?? 0;
  const isFirstWeek = credits?.is_first_week ?? true;
  const canExtract = isPremium || (credits?.can_extract ?? false);
  const nextResetAt = credits?.next_reset_at ? new Date(credits.next_reset_at) : null;

  const value = useMemo(
    () => ({
      isPremium,
      isTrialing,
      isLoading,
      subscriptionExpiresAt,
      offerings,
      credits,
      standardCredits,
      referralCredits,
      totalCredits,
      isFirstWeek,
      canExtract,
      nextResetAt,
      refreshCredits,
      refreshSubscription,
      purchase,
      restore,
    }),
    [
      isPremium,
      isTrialing,
      isLoading,
      subscriptionExpiresAt,
      offerings,
      credits,
      standardCredits,
      referralCredits,
      totalCredits,
      isFirstWeek,
      canExtract,
      nextResetAt,
      refreshCredits,
      refreshSubscription,
      purchase,
      restore,
    ]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
