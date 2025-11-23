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
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="[id]/edit" options={{ headerShown: false }} />
      <Stack.Screen name="preview" options={{ headerShown: false }} />
    </Stack>
  );
}
