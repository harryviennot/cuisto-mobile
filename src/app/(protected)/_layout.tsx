/**
 * Protected Group Layout
 * Routes for fully authenticated users (onboarding completed)
 * Includes tabs, recipe details, extraction, search, settings
 */
import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name="settings" />
      <Stack.Screen name="recipe" />
      <Stack.Screen name="discovery" />
    </Stack>
  );
}
