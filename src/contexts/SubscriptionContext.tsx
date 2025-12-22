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
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import {
  initRevenueCat,
  identifyUser,
  logoutRevenueCat,
  getCustomerInfo,
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
      console.log("[SubscriptionContext] Identifying user with RevenueCat...");
      identifyUser(user.id).then((customerInfo) => {
        console.log("[SubscriptionContext] User identified, customerInfo:", customerInfo ? "received" : "null");
        refreshSubscription();
      });
    } else if (!isAuthenticated) {
      console.log("[SubscriptionContext] User not authenticated, resetting state");
      logoutRevenueCat();
      setIsPremium(false);
      setIsTrialing(false);
      setSubscriptionExpiresAt(null);
      setCredits(null);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch credits when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log("[SubscriptionContext] Fetching credits...");
      refreshCredits();
    }
  }, [isAuthenticated, isPremium]);

  // Listen for subscription changes
  useEffect(() => {
    const unsubscribe = addCustomerInfoUpdateListener((customerInfo) => {
      updateFromCustomerInfo(customerInfo);
    });

    return unsubscribe;
  }, []);

  // Load offerings
  useEffect(() => {
    getOfferings().then(setOfferings);
  }, []);

  const updateFromCustomerInfo = useCallback((customerInfo: CustomerInfo) => {
    const proEntitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];

    if (proEntitlement) {
      setIsPremium(true);
      setIsTrialing(proEntitlement.periodType === "TRIAL");
      setSubscriptionExpiresAt(
        proEntitlement.expirationDate ? new Date(proEntitlement.expirationDate) : null
      );
    } else {
      setIsPremium(false);
      setIsTrialing(false);
      setSubscriptionExpiresAt(null);
    }
  }, []);

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

      // Sync premium state from backend (source of truth for free trial detection)
      if (creditsData.is_premium !== isPremium) {
        console.log("[SubscriptionContext] Premium state mismatch, updating:", { backend: creditsData.is_premium, local: isPremium });
        setIsPremium(creditsData.is_premium);
      }
    } catch (error) {
      console.error("[SubscriptionContext] Error fetching credits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isPremium]);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        updateFromCustomerInfo(customerInfo);
        await refreshCredits();
        return true;
      }
      return false;
    } catch (error) {
      console.error("[Subscription] Purchase error:", error);
      throw error;
    }
  }, [updateFromCustomerInfo, refreshCredits]);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const customerInfo = await restorePurchases();
      if (customerInfo) {
        updateFromCustomerInfo(customerInfo);
        await refreshCredits();
        return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      }
      return false;
    } catch (error) {
      console.error("[Subscription] Restore error:", error);
      throw error;
    }
  }, [updateFromCustomerInfo, refreshCredits]);

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
