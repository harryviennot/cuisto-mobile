import { useEffect } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const RECIPE_IMAGE_URL =
  "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&q=80&w=400";

interface HeroPhoneProps {
  delay?: number;
}

export function HeroPhone({ delay = 300 }: HeroPhoneProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[animatedStyle, { aspectRatio: 9 / 18 }]}
      className="w-48 rounded-3xl border-4 border-stone-800 bg-stone-900 overflow-hidden"
    >
      {/* Notch area */}
      <View className="h-8 bg-stone-900 border-b border-white/5 items-center justify-center">
        <View className="w-8 h-1 bg-white/20 rounded-full" />
      </View>

      {/* Content area */}
      <View className="flex-1 p-3 gap-3">
        {/* Recipe image */}
        <View className="w-full aspect-square rounded-xl overflow-hidden opacity-80">
          <Image
            source={{ uri: RECIPE_IMAGE_URL }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={400}
          />
        </View>

        {/* Skeleton list items */}
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className="h-10 rounded-lg bg-white/5 border border-white/5 flex-row items-center gap-2 p-2"
          >
            <View className="w-6 h-6 rounded bg-stone-800" />
            <View className="flex-1 gap-1">
              <View className="h-1.5 w-1/2 bg-white/20 rounded-full" />
              <View className="h-1.5 w-1/4 bg-white/10 rounded-full" />
            </View>
          </View>
        ))}

        {/* Bottom fade gradient */}
        <LinearGradient
          colors={["transparent", "#000000"]}
          className="absolute bottom-0 left-0 right-0 h-24"
        />
      </View>
    </Animated.View>
  );
}
