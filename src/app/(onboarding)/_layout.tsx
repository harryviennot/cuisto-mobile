/**
 * Onboarding Group Layout
 * Routes for authenticated users who need to complete onboarding
 */
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#000000" } }}>
      <Stack.Screen name="questionnaire" />
    </Stack>
  );
}
