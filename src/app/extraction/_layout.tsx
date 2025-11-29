import { Stack } from 'expo-router';

export default function ExtractionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'fullScreenModal',
        animation: 'fade_from_bottom',
        animationDuration: 350,
        gestureEnabled: true,
        gestureDirection: 'vertical',
      }}
    />
  );
}
