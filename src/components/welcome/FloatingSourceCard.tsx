import { useEffect } from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { Globe, Microphone, Camera, TiktokLogo, InstagramLogo, Clipboard } from "phosphor-react-native";
import type { Icon } from "phosphor-react-native";

type SourceType = "tiktok" | "instagram" | "web" | "voice" | "photo" | "text";

interface FloatingSourceCardProps {
  type: SourceType;
  label: string;
  rotation?: number;
  delay?: number;
}

const SOURCE_CONFIG: Record<
  SourceType,
  {
    icon: Icon;
    gradientColors: [string, string, ...string[]];
  }
> = {
  tiktok: {
    icon: TiktokLogo,
    gradientColors: ["#ec4899", "#06b6d4"], // pink to cyan
  },
  instagram: {
    icon: InstagramLogo,
    gradientColors: ["#eab308", "#ef4444", "#a855f7"], // yellow to red to purple
  },
  web: {
    icon: Globe,
    gradientColors: ["#3b82f6", "#3b82f6"], // blue
  },
  voice: {
    icon: Microphone,
    gradientColors: ["#10b981", "#10b981"], // emerald
  },
  photo: {
    icon: Camera,
    gradientColors: ["#f97316", "#facc15"], // orange to yellow
  },
  text: {
    icon: Clipboard,
    gradientColors: ["#8b5cf6", "#8b5cf6"], // violet
  },
};

export function FloatingSourceCard({
  type,
  label,
  rotation = 0,
  delay = 0,
}: FloatingSourceCardProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const config = SOURCE_CONFIG[type];
  const IconComponent = config.icon;

  useEffect(() => {
    // Mount animation
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) })
    );

    // Floating animation (starts after mount)
    translateY.value = withDelay(
      delay + 600,
      withRepeat(
        withSequence(
          withTiming(-6, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        true
      )
    );
  }, [delay, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
    >
      <View className="bg-stone-800/90 flex-row items-center gap-3 p-3 rounded-2xl border border-white/10">
        {/* Icon with gradient background */}
        <View className="w-10 h-10 rounded-xl overflow-hidden">
          <LinearGradient
            colors={config.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComponent size={20} color="#ffffff" weight="fill" />
          </LinearGradient>
        </View>

        {/* Label */}
        <View className="pr-1">
          <Text
            className="text-xs text-white font-medium"
          >
            {label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
