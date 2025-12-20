/**
 * Root Layout
 *
 * Uses Expo Router's Stack.Protected pattern for declarative auth routing.
 * Screens only mount when their guard condition is true, preventing:
 * - API calls before authentication
 * - Race conditions between auth state and navigation
 * - White flash during transitions
 */
import "@/global.css";
import { useEffect, useState, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import i18n from "@/locales/i18n";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/ToastConfig";

import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_500Medium,
} from "@expo-google-fonts/playfair-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  // Capture 100% of errors - with 30 users you want to see everything
  sampleRate: 1.0,
  // Performance monitoring - 100% is fine for small user base
  tracesSampleRate: 1.0,
  // Attach screenshots on crash (helps debug UI issues)
  attachScreenshot: true,
  // Track user sessions to see crash-free rate
  enableAutoSessionTracking: true,
  // Capture user interactions (button taps, navigation)
  enableUserInteractionTracing: true,
});

export default Sentry.wrap(RootLayout);

// Configure Reanimated logger (disable strict mode warnings)
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * SplashScreenController
 * Hides splash screen when auth state is determined
 */
function SplashScreenController() {
  const { isLoading } = useAuth();
  const splashHiddenRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch((error) => {
        console.debug("Splash screen hide error (non-critical):", error.message);
      });
    }
  }, [isLoading]);

  return null;
}

/**
 * RootNavigator
 * Uses Stack.Protected for declarative auth-based routing.
 * Screens only mount when their guard is true.
 */
function RootNavigator() {
  const { authStatus, isAuthenticated, isNewUser } = useAuth();

  // Keep splash visible during loading - return null so nothing renders
  if (authStatus === "loading") {
    return null;
  }

  // Guard conditions for route groups
  const showAuth = !isAuthenticated;
  const showOnboarding = isAuthenticated && isNewUser;
  const showProtected = isAuthenticated && !isNewUser;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#000000" } }}>
      {/* Unauthenticated routes - welcome and login */}
      <Stack.Protected guard={showAuth}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Authenticated but needs onboarding */}
      <Stack.Protected guard={showOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      {/* Fully authenticated routes - main app */}
      <Stack.Protected guard={showProtected}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>
    </Stack>
  );
}

export function RootLayout() {
  const insets = useSafeAreaInsets();
  const [i18nInitialized, setI18nInitialized] = useState(false);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_500Medium,
  });

  useEffect(() => {
    // Wait for i18n to be ready
    if (i18n.isInitialized) {
      setI18nInitialized(true);
    } else {
      const checkI18n = setInterval(() => {
        if (i18n.isInitialized) {
          setI18nInitialized(true);
          clearInterval(checkI18n);
        }
      }, 100);

      return () => clearInterval(checkI18n);
    }
  }, []);

  // Don't render anything until fonts and i18n are ready
  if (!fontsLoaded || !i18nInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000000" }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <AuthProvider>
              <SearchProvider>
                <SplashScreenController />
                <RootNavigator />
              </SearchProvider>
            </AuthProvider>
            <StatusBar barStyle="dark-content" />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </KeyboardProvider>
      <Toast config={toastConfig} topOffset={insets.top} />
    </GestureHandlerRootView>
  );
}
