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
      style={[
        animatedStyle,
        {
          width: 192,
          aspectRatio: 9 / 18,
          borderRadius: 24,
          borderWidth: 4,
          borderColor: "#292524", // stone-800
          backgroundColor: "#1c1917", // stone-900
          overflow: "hidden",
        },
      ]}
    >
      {/* Notch area */}
      <View
        style={{
          height: 32,
          backgroundColor: "#1c1917",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.05)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 32,
            height: 4,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: 9999,
          }}
        />
      </View>

      {/* Content area */}
      <View style={{ flex: 1, padding: 12, gap: 12 }}>
        {/* Recipe image */}
        <View
          style={{
            width: "100%",
            aspectRatio: 1,
            borderRadius: 12,
            overflow: "hidden",
            opacity: 0.8,
          }}
        >
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
            style={{
              height: 40,
              borderRadius: 8,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.05)",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 8,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                backgroundColor: "#292524", // stone-800
              }}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <View
                style={{
                  height: 6,
                  width: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 9999,
                }}
              />
              <View
                style={{
                  height: 6,
                  width: "25%",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 9999,
                }}
              />
            </View>
          </View>
        ))}

        {/* Bottom fade gradient */}
        <LinearGradient
          colors={["transparent", "#000000"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 96,
          }}
        />
      </View>
    </Animated.View>
  );
}
