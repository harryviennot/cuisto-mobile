/**
 * RevenueCat SDK integration
 *
 * Handles initialization and user identification for in-app purchases.
 * Products configured in App Store Connect as "Cuisto Pro" subscription group:
 * - cuisto_pro_monthly: Monthly subscription with 1-week free trial
 * - cuisto_pro_yearly: Yearly subscription with 1-week free trial
 */
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesOffering } from "react-native-purchases";

// RevenueCat API keys - set these in your .env file
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "";
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "";

// Entitlement identifier for premium access
// This must match the entitlement ID configured in RevenueCat dashboard
export const PRO_ENTITLEMENT_ID = "Cuisto Pro";

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: "cuisto_pro_monthly",
  YEARLY: "cuisto_pro_yearly",
} as const;

let isConfigured = false;

/**
 * Initialize RevenueCat SDK
 * Should be called early in app startup (e.g., in root layout)
 */
export async function initRevenueCat(): Promise<void> {
  if (isConfigured) {
    console.log("[RevenueCat] Already configured");
    return;
  }

  const apiKey = Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

  if (!apiKey) {
    console.warn("[RevenueCat] API key not configured for", Platform.OS);
    return;
  }

  try {
    // Set log level for debugging (reduce in production)
    Purchases.setLogLevel(LOG_LEVEL.ERROR);

    // Configure without user ID - will use anonymous ID
    Purchases.configure({ apiKey });

    isConfigured = true;
    console.log("[RevenueCat] Configured successfully");
  } catch (error) {
    console.error("[RevenueCat] Configuration error:", error);
  }
}

/**
 * Identify user with RevenueCat
 * Call this after user authentication
 */
export async function identifyUser(userId: string): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    console.warn("[RevenueCat] Not configured, cannot identify user");
    return null;
  }

  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log("[RevenueCat] User identified:", userId);
    return customerInfo;
  } catch (error) {
    console.error("[RevenueCat] Error identifying user:", error);
    return null;
  }
}

/**
 * Log out current user from RevenueCat
 * Call this on user logout
 */
export async function logoutRevenueCat(): Promise<void> {
  if (!isConfigured) {
    return;
  }

  try {
    await Purchases.logOut();
    console.log("[RevenueCat] User logged out");
  } catch (error) {
    console.error("[RevenueCat] Error logging out:", error);
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("[RevenueCat] Error getting customer info:", error);
    return null;
  }
}

/**
 * Check if user has active premium entitlement
 */
export async function checkPremiumStatus(): Promise<{
  isPremium: boolean;
  isTrialing: boolean;
  expiresAt: Date | null;
}> {
  const customerInfo = await getCustomerInfo();

  if (!customerInfo) {
    return { isPremium: false, isTrialing: false, expiresAt: null };
  }

  const proEntitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID];

  if (!proEntitlement) {
    return { isPremium: false, isTrialing: false, expiresAt: null };
  }

  return {
    isPremium: true,
    isTrialing: proEntitlement.periodType === "TRIAL",
    expiresAt: proEntitlement.expirationDate ? new Date(proEntitlement.expirationDate) : null,
  };
}

/**
 * Get available offerings (subscription packages)
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error("[RevenueCat] Error getting offerings:", error);
    return null;
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(
  packageToPurchase: Parameters<typeof Purchases.purchasePackage>[0]
): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log("[RevenueCat] Purchase cancelled by user");
      return null;
    }
    console.error("[RevenueCat] Purchase error:", error);
    throw error;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    return null;
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log("[RevenueCat] Purchases restored");
    return customerInfo;
  } catch (error) {
    console.error("[RevenueCat] Error restoring purchases:", error);
    throw error;
  }
}

/**
 * Add listener for customer info updates
 */
export function addCustomerInfoUpdateListener(
  listener: (customerInfo: CustomerInfo) => void
): () => void {
  if (!isConfigured) {
    return () => { };
  }

  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    // RevenueCat SDK handles cleanup internally
  };
}
