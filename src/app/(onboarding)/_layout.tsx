/**
 * Onboarding Group Layout
 * Routes for authenticated users who need to complete onboarding
 */
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="questionnaire" />
    </Stack>
  );
}
