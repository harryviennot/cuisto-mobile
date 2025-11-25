/**
 * Recipe layout - removes default header
 */
import { Stack } from "expo-router";
import { useDeviceType } from "@/hooks/useDeviceType";

export default function RecipeLayout() {
  const { isTablet, isTabletLandscape } = useDeviceType();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="preview" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]/edit"
        options={{
          headerShown: false,
          gestureEnabled: false,
          presentation: isTablet ? "fullScreenModal" : "modal",
          animation: "slide_from_bottom",
          animationTypeForReplace: "pop",
        }}
      />
    </Stack>
  );
}
