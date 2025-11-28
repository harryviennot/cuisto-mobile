/**
 * Recipe layout - removes default header
 */
import { Stack } from "expo-router";
import { useWindowDimensions } from "react-native";

export default function RecipeLayout() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="preview"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
          gestureEnabled: false,
        }}
      />
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
