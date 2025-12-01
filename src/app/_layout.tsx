import "@/global.css";
import { useEffect, useState, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
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
 */
function ProtectedNavigation() {
  const segments = useSegments();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Don't do anything while loading

    const inAuthGroup = segments[0] === "auth";
    const onOnboardingScreen = segments[1] === "onboarding";

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not in auth screens, redirect to auth
      router.replace("/auth");
    } else if (isAuthenticated && user?.is_new_user && !onOnboardingScreen) {
      // User is authenticated but hasn't completed onboarding, redirect to onboarding
      router.replace("/auth/onboarding");
    } else if (isAuthenticated && !user?.is_new_user && inAuthGroup) {
      // User is authenticated and completed onboarding but still in auth screens, redirect to main app
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, user]);

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

  useEffect(() => {
    if (fontsLoaded && i18nInitialized && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch((error) => {
        // Silently handle - splash screen errors are non-critical
        // The error often occurs if splash is already hidden
        console.debug("Splash screen hide error (non-critical):", error.message);
      });
    }
  }, [fontsLoaded, i18nInitialized]);

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
                <ProtectedNavigation />
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
