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
import { GlobeIcon, Microphone, Camera, MusicNotes, TiktokLogoIcon, InstagramLogoIcon, GlobeHemisphereWestIcon } from "phosphor-react-native";

type SourceType = "tiktok" | "instagram" | "web" | "voice";

interface FloatingSourceCardProps {
  type: SourceType;
  label: string;
  rotation?: number;
  delay?: number;
}

const SOURCE_CONFIG: Record<
  SourceType,
  {
    icon: typeof GlobeIcon;
    gradientColors: [string, string, ...string[]];
  }
> = {
  tiktok: {
    icon: TiktokLogoIcon,
    gradientColors: ["#ec4899", "#06b6d4"], // pink to cyan
  },
  instagram: {
    icon: InstagramLogoIcon,
    gradientColors: ["#eab308", "#ef4444", "#a855f7"], // yellow to red to purple
  },
  web: {
    icon: GlobeIcon,
    gradientColors: ["#3b82f6", "#3b82f6"], // blue
  },
  voice: {
    icon: Microphone,
    gradientColors: ["#10b981", "#10b981"], // emerald
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
      <View className="bg-stone-800/90 flex-row items-center gap-2 p-2.5 rounded-xl border border-white/10">
        {/* Icon with gradient background */}
        <View className="w-8 h-8 rounded-lg overflow-hidden">
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
            <IconComponent size={16} color="#ffffff" weight="fill" />
          </LinearGradient>
        </View>

        {/* Label */}
        <View className="pr-2">
          <Text
            className="text-[10px] text-white"
          >
            {label}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
