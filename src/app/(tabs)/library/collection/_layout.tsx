/**
 * Collection layout - removes default header
 */
import { Stack } from "expo-router";

export default function CollectionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
