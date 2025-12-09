import { Stack } from "expo-router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function ExtractionLayout() {
  return (
    <BottomSheetModalProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: "fullScreenModal",
          animation: "fade_from_bottom",
          animationDuration: 350,
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      >
        <Stack.Screen name="[method]" options={{ headerShown: false }} />
        <Stack.Screen
          name="preview"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_right",
            gestureEnabled: false,
          }}
        />
      </Stack>
    </BottomSheetModalProvider>
  );
}
