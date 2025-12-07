/**
 * Discovery routes layout
 */
import { Stack } from "expo-router";

export default function DiscoveryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
