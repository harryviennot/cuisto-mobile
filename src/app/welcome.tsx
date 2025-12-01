import { useEffect } from "react";
import { View, Text, Pressable, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight } from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { FloatingSourceCard, HeroPhone } from "@/components/welcome";
import { BlurView } from "expo-blur";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  // Mount animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(16);

  // Button press animation
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Header animation
    headerOpacity.value = withTiming(1, { duration: 700 });
    headerTranslateY.value = withTiming(0, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });

    // CTA animation (delayed)
    setTimeout(() => {
      ctaOpacity.value = withTiming(1, { duration: 700 });
      ctaTranslateY.value = withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.cubic),
      });
    }, 500);
  }, [headerOpacity, headerTranslateY, ctaOpacity, ctaTranslateY]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleGetStarted = () => {
    router.push("/auth");
  };

  return (
    <View className="flex-1 bg-stone-950">
      <StatusBar barStyle="light-content" />

      {/* Background Ambience */}
      <View className="absolute inset-0" pointerEvents="none">
        {/* Top left emerald orb */}
        <View
          className="absolute w-[300px] h-[300px] rounded-full bg-emerald-900/40"
          style={{ top: "-10%", left: "-20%" }}
        />
        {/* Bottom right stone orb */}
        <View
          className="absolute w-[300px] h-[300px] rounded-full bg-stone-800/70"
          style={{ bottom: "10%", right: "-20%" }}
        />
      </View>

      <BlurView
        className="flex-1 absolute inset-0 bg-black/50"
        tint="dark"
        intensity={65}
      />

      {/* Main Content */}
      <View
        className="flex-1 px-6 justify-between items-center"
        style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 48 }}
      >
        {/* HEADER */}
        <Animated.View
          style={headerAnimatedStyle}
          className="items-center gap-4"
        >
          {/* Tagline */}
          <Text className="font-playfair text-5xl text-center text-white tracking-tight leading-[52px]">
            All your recipes.{"\n"}
            <Text className="font-playfair-italic text-white/40">
              One Place.
            </Text>
          </Text>
        </Animated.View>

        {/* GRAPHIC AREA */}
        <View
          className="relative w-full items-center justify-center my-4"
          style={{ maxWidth: 340, height: 460 }}
        >
          {/* Central Phone */}
          <HeroPhone delay={300} />

          {/* Floating Cards */}
          {/* Top Left - TikTok */}
          <View className="absolute z-30" style={{ top: 16, left: -12 }}>
            <FloatingSourceCard
              type="tiktok"
              label="Feta Pasta"
              rotation={-6}
              delay={0}
            />
          </View>

          {/* Top Right - Instagram */}
          <View className="absolute z-30" style={{ top: 56, right: -12 }}>
            <FloatingSourceCard
              type="instagram"
              label="@chef_mike"
              rotation={4}
              delay={800}
            />
          </View>

          {/* Middle Left - Photo */}
          <View className="absolute z-30" style={{ top: "38%", left: -20 }}>
            <FloatingSourceCard
              type="photo"
              label="Mom's Recipe"
              rotation={5}
              delay={1600}
            />
          </View>

          {/* Middle Right - Text */}
          <View className="absolute z-30" style={{ top: "45%", right: -20 }}>
            <FloatingSourceCard
              type="text"
              label="Pasted Text"
              rotation={-4}
              delay={2400}
            />
          </View>

          {/* Bottom Left - Web */}
          <View className="absolute z-30" style={{ bottom: 56, left: -16 }}>
            <FloatingSourceCard
              type="web"
              label="NYT Cooking"
              rotation={6}
              delay={400}
            />
          </View>

          {/* Bottom Right - Voice */}
          <View className="absolute z-30" style={{ bottom: 16, right: -16 }}>
            <FloatingSourceCard
              type="voice"
              label="Grandma's Pie"
              rotation={-3}
              delay={1200}
            />
          </View>
        </View>

        {/* CTA */}
        <Animated.View style={ctaAnimatedStyle} className="w-full">
          <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleGetStarted}
            style={buttonAnimatedStyle}
            className="w-full h-16 rounded-2xl bg-white flex-row items-center justify-center gap-3 shadow-lg"
          >
            <Text className="text-sm font-bold uppercase tracking-[3px] text-stone-950">
              Start Collecting
            </Text>
            <ArrowRight size={18} color="#0c0a09" weight="bold" />
          </AnimatedPressable>
        </Animated.View>
      </View>
    </View>
  );
}
