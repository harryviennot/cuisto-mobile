import "@/global.css";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useSegments } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { KeyboardProvider } from "react-native-keyboard-controller";
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

export default function RootLayout() {
  const [i18nInitialized, setI18nInitialized] = useState(false);
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_500Medium,
  });

  const segments = useSegments();

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
    if (fontsLoaded && i18nInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, i18nInitialized]);

  if (!fontsLoaded || !i18nInitialized) {
    return null;
  }

  console.log(segments);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <AuthProvider>
              <SearchProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen
                    name="search"
                    options={{
                      presentation: "transparentModal",
                      animation: "fade",
                      animationDuration: 200,
                    }}
                  />
                  <Stack.Screen name="test-creen" />
                  <Stack.Screen name="recipe" />
                </Stack>
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
