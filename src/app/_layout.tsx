import "@/global.css";
import { useEffect, useState, useRef, useCallback } from "react";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, Redirect, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { StatusBar, View } from "react-native";
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
 * Protected navigation component that handles auth routing
 * Keeps splash screen visible until auth state is determined
 */
function ProtectedNavigation({ onReady }: { onReady: () => void }) {
  const segments = useSegments();
  const { user, isAuthenticated, isLoading } = useAuth();
  const hasCalledReady = useRef(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  console.log("ProtectedNavigation", segments);

  console.log("ProtectedNavigationIsAuth", isAuthenticated);
  console.log("ProtectedNavigationUser", user);
  // Wait for navigation tree to fully mount before allowing redirects
  // Using setTimeout to defer to the next event loop tick after all effects have run
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsNavigationReady(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isLoading && !hasCalledReady.current) {
      hasCalledReady.current = true;
      onReady();
    }
  }, [isLoading, onReady]);

  // While loading auth state, render nothing (keep splash screen visible)
  if (isLoading) {
    return <View style={{ flex: 1 }} />;
  }

  // Determine redirect target (only after navigation is ready)
  const inAuthGroup = segments[0] === "auth";
  const onOnboardingScreen = segments[1] === "onboarding";

  let redirectTarget: string | null = null;
  if (isNavigationReady) {
    if (!isAuthenticated && !inAuthGroup) {
      redirectTarget = "/auth";
    } else if (isAuthenticated && user?.is_new_user && !onOnboardingScreen) {
      redirectTarget = "/auth/onboarding";
    } else if (isAuthenticated && !user?.is_new_user && inAuthGroup) {
      redirectTarget = "/(tabs)";
    }
  }

  if (redirectTarget) {
    return <Redirect href={redirectTarget as "/(tabs)" | "/auth" | "/auth/onboarding"} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="search"
        options={{
          presentation: "transparentModal",
          animation: "fade",
          animationDuration: 200,
        }}
      />
      <Stack.Screen
        name="extraction"
        options={{
          presentation: "fullScreenModal",
          animation: "fade_from_bottom",
          animationDuration: 350,
        }}
      />
      <Stack.Screen name="test-creen" />
      <Stack.Screen name="recipe" />
    </Stack>
  );
}

export default function RootLayout() {
  const [i18nInitialized, setI18nInitialized] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const splashHiddenRef = useRef(false);
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

  // Hide splash screen only when fonts, i18n, AND auth are all ready
  useEffect(() => {
    if (fontsLoaded && i18nInitialized && authReady && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch((error) => {
        // Silently handle - splash screen errors are non-critical
        // The error often occurs if splash is already hidden
        console.debug("Splash screen hide error (non-critical):", error.message);
      });
    }
  }, [fontsLoaded, i18nInitialized, authReady]);

  const handleAuthReady = useCallback(() => {
    setAuthReady(true);
  }, []);

  if (!fontsLoaded || !i18nInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <AuthProvider>
              <SearchProvider>
                <ProtectedNavigation onReady={handleAuthReady} />
              </SearchProvider>
            </AuthProvider>
            <StatusBar barStyle="dark-content" />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </KeyboardProvider>
      <Toast config={toastConfig} topOffset={60} />
    </GestureHandlerRootView>
  );
}
