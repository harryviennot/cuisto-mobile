import { Stack } from "expo-router";

export default function LibraryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="collection" />
    </Stack>
  );
}
