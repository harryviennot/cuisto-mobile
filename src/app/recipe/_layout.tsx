/**
 * Recipe layout - removes default header
 */
import { Stack } from "expo-router";
import { Dimensions } from "react-native";

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
        options={() => {
          const { width } = Dimensions.get("window");
          const isTablet = width >= 768;

          return {
            headerShown: false,
            gestureEnabled: false,
            presentation: isTablet ? "fullScreenModal" : "modal",
            animation: "slide_from_bottom",
            animationTypeForReplace: "pop",
          };
        }}
      />
    </Stack>
  );
}
