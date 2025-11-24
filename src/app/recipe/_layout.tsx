/**
 * Recipe layout - removes default header
 */
import { Stack } from "expo-router";

export default function RecipeLayout() {
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
          presentation: "modal",
          animation: "slide_from_bottom",
          animationTypeForReplace: "pop",
        }}
      />
    </Stack>
  );
}
