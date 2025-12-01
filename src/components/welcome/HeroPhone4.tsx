import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Dimensions, Image as RNImage } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  FadeIn,
} from "react-native-reanimated";
import {
  ArrowRight,
  Globe,
  Microphone,
  MusicNotes,
  Stack,
  Camera,
  Sparkle,
} from "phosphor-react-native";
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from "react-native-svg";
import type { Icon } from "phosphor-react-native";
import type { ImageSource } from "expo-image";

const { width } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DemoItem {
  id: string;
  sourceName: string;
  recipeTitle: string;
  subTitle: string;
  icon: Icon;
  colors: [string, string];
  image: ImageSource;
  rotation: string; // kept for reference, though we calculate rotation in JS
}

const DEMO_DATA: DemoItem[] = [
  {
    id: "tiktok",
    sourceName: "TikTok",
    recipeTitle: "Spicy Vodka Pasta",
    subTitle: "Gigi Hadid Style",
    icon: MusicNotes,
    colors: ["#ec4899", "#f43f5e"], // pink-500 to rose-500
    image: { uri: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&q=80&w=600" },
    rotation: "rotate-3",
  },
  {
    id: "web",
    sourceName: "NYT Cooking",
    recipeTitle: "Roast Chicken",
    subTitle: "with Sourdough Croutons",
    icon: Globe,
    colors: ["#3b82f6", "#6366f1"], // blue-500 to indigo-500
    image: { uri: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=600" },
    rotation: "-rotate-2",
  },
  {
    id: "voice",
    sourceName: "Dictation",
    recipeTitle: "Grandma’s Apple Pie",
    subTitle: "Secret Family Recipe",
    icon: Microphone,
    colors: ["#10b981", "#14b8a6"], // emerald-500 to teal-500
    image: { uri: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&q=80&w=600" },
    rotation: "rotate-1",
  },
];

// --- COMPONENTS ---

function BackgroundAmbiance() {
  return (
    <View className="absolute inset-0 pointer-events-none opacity-60">
      <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient
            id="grad1"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#ffedd5" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#ffedd5" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            id="grad2"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            fx="50%"
            fy="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#d1fae5" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#d1fae5" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Orange Blob - Top Left */}
        <Circle cx="-10%" cy="10%" r="200" fill="url(#grad1)" />

        {/* Emerald Blob - Bottom Right */}
        <Circle cx="110%" cy="80%" r="150" fill="url(#grad2)" />
      </Svg>

      {/* Texture Overlay */}
      <RNImage
        source={{ uri: "https://www.transparenttextures.com/patterns/cream-paper.png" }}
        style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.4 }}
        resizeMode="repeat"
      />
    </View>
  );
}

interface SatelliteSourceProps {
  item: DemoItem;
  isActive: boolean;
  index: number;
}

function SatelliteSource({ item, isActive, index }: SatelliteSourceProps) {
  const Icon = item.icon;

  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.6);
  const labelWidth = useSharedValue(0);
  const beamWidth = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.1 : 0.9, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(isActive ? 1 : 0.6, { duration: 500 });
    labelWidth.value = withTiming(isActive ? 80 : 0, { duration: 500, easing: Easing.out(Easing.cubic) });
    beamWidth.value = withTiming(isActive ? 100 : 0, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    width: labelWidth.value,
    opacity: interpolate(labelWidth.value, [0, 80], [0, 1]),
  }));

  // Beam style
  const beamStyle = useAnimatedStyle(() => ({
    width: beamWidth.value,
    opacity: interpolate(beamWidth.value, [0, 100], [0, 1]),
  }));

  // Positioning logic based on index
  const positions = [
    { top: 0, left: -10 },   // TikTok
    { top: 48, right: -16 }, // Web
    { bottom: 32, left: 0 }, // Voice
  ];

  const pos = positions[index];

  // Beam rotation/position logic
  // 0 (TikTok): Top-Left -> needs to point towards center-right/down (approx 45deg)
  // 1 (Web): Top-Right -> needs to point towards center-left/down (approx 135deg)
  // 2 (Voice): Bottom-Left -> needs to point towards center-right/up (approx -45deg)
  const beamRotation = index === 0 ? '45deg' : index === 1 ? '135deg' : '-45deg';

  return (
    <Animated.View
      style={[
        containerStyle,
        { position: 'absolute', zIndex: 30, ...pos }
      ]}
    >
      <View className={`flex-row items-center p-2.5 rounded-2xl shadow-lg border transition-colors duration-500 ${isActive ? 'bg-white border-stone-200' : 'bg-white/60 border-white/40'
        }`}>
        <LinearGradient
          colors={isActive ? item.colors : ["#d6d3d1", "#a8a29e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 24,
            width: 24,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} color="white" weight="fill" />
        </LinearGradient>

        <Animated.View style={[labelStyle, { overflow: 'hidden' }]}>
          <Text className="pl-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 whitespace-nowrap" numberOfLines={1}>
            {item.sourceName}
          </Text>
        </Animated.View>
      </View>

      {/* Connecting Beam */}
      <Animated.View
        style={[
          beamStyle,
          {
            position: 'absolute',
            left: '50%',
            top: '50%',
            height: 2,
            zIndex: -10,
            transformOrigin: 'left center', // React Native 0.73+ supports this, otherwise use anchor point logic
            transform: [
              { translateX: 0 }, // Adjust if needed
              { rotate: beamRotation }
            ],
            backgroundColor: '#d6d3d1', // Fallback
          }
        ]}
      >
        <LinearGradient
          colors={['transparent', '#d6d3d1', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
}

interface CentralDeckProps {
  activeIndex: number;
}

function CentralDeck({ activeIndex }: CentralDeckProps) {
  return (
    <View className="relative z-20 w-64" style={{ aspectRatio: 3 / 4 }}>
      {/* Back Card (Depth) */}
      <View
        className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-stone-100 opacity-60"
        style={{ transform: [{ rotate: '6deg' }, { scale: 0.9 }, { translateY: 16 }] }}
      />
      <View
        className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-stone-100 opacity-80"
        style={{ transform: [{ rotate: '-3deg' }, { scale: 0.95 }, { translateY: 8 }] }}
      />

      {/* Main Card */}
      <View className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden flex-col">

        {/* Dynamic Image */}
        <View className="h-[80%] relative bg-stone-100 overflow-hidden border border-red-500">
          {DEMO_DATA.map((item, idx) => {
            const isActive = idx === activeIndex;

            const animatedStyle = useAnimatedStyle(() => {
              return {
                opacity: withTiming(isActive ? 1 : 0, { duration: 700 }),
                transform: [{ scale: withTiming(isActive ? 1 : 1.1, { duration: 700 }) }]
              };
            });

            return (
              <Animated.View key={item.id} style={[animatedStyle, { position: 'absolute', inset: 0 }]}>
                <Image
                  source={item.image}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </Animated.View>
            );
          })}

          {/* Overlay Gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            className="absolute inset-8 justify-end p-6 border border-red-500"
          >
            {/* Floating Tags */}
            <View className="flex-row gap-2 mb-2">
              <View className="px-2 py-1 rounded-md bg-white/20 border border-white/10">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-white">
                  Imported
                </Text>
              </View>
            </View>

            {/* Animated Text */}
            <View className="h-12 relative">
              {DEMO_DATA.map((item, idx) => {
                const isActive = idx === activeIndex;
                const textStyle = useAnimatedStyle(() => ({
                  opacity: withTiming(isActive ? 1 : 0, { duration: 500 }),
                  transform: [{ translateY: withTiming(isActive ? 0 : 16, { duration: 500 }) }]
                }));

                return (
                  <Animated.View key={item.id} style={[textStyle, { position: 'absolute', inset: 0 }]}>
                    <Text className="text-2xl font-serif text-white leading-none mb-1">
                      {item.recipeTitle}
                    </Text>
                    <Text className="text-white/70 text-xs font-medium">
                      {item.subTitle}
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          </LinearGradient>
        </View>

        {/* Bottom Action Bar */}
        <View className="flex-1 bg-white p-4 flex-row items-center justify-between">
          <View className="flex-row -space-x-2">
            {[1, 2, 3].map(i => (
              <View key={i} className="w-6 h-6 rounded-full border-2 border-white bg-stone-200" />
            ))}
          </View>
          <View className="w-8 h-8 rounded-full bg-[#334d43] items-center justify-center">
            <ArrowRight size={14} color="white" weight="bold" />
          </View>
        </View>
      </View>

      {/* Magic Sparkle Effect */}
      <SparkleEffect activeIndex={activeIndex} />
    </View>
  );
}

function SparkleEffect({ activeIndex }: { activeIndex: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 300 });
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 });
    }, 600);
  }, [activeIndex]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: interpolate(opacity.value, [0, 1], [0.5, 1.2]) }]
  }));

  return (
    <Animated.View style={[style, { position: 'absolute', top: -16, right: -16 }]}>
      <Sparkle size={24} color="#334d43" weight="fill" />
    </Animated.View>
  );
}

export const HeroPhone4: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % DEMO_DATA.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(mounted ? 1 : 0, { duration: 1000 }),
    transform: [{ translateY: withTiming(mounted ? 0 : 16, { duration: 1000, easing: Easing.out(Easing.cubic) }) }]
  }));

  const graphicStyle = useAnimatedStyle(() => ({
    opacity: withDelay(300, withTiming(mounted ? 1 : 0, { duration: 1000 })),
    transform: [{ scale: withDelay(300, withTiming(mounted ? 1 : 0.95, { duration: 1000 })) }]
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: withDelay(500, withTiming(mounted ? 1 : 0, { duration: 1000 })),
    transform: [{ translateY: withDelay(500, withTiming(mounted ? 0 : 16, { duration: 1000 })) }]
  }));

  return (
    <View className="flex-1 bg-[#FDFBF7] overflow-hidden">

      <BackgroundAmbiance />

      <View
        className="flex-1 flex-col items-center justify-between px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}
      >

        {/* HEADER */}
        <Animated.View style={headerStyle} className="items-center space-y-5 mt-4">
          {/* <View className="flex-row items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-stone-200">
            <Stack size={10} color="#334d43" weight="fill" />
            <Text className="text-stone-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              Universal Import
            </Text>
          </View> */}

          <Text className="font-serif text-5xl leading-[1.05] tracking-tight text-stone-800 text-center">
            All your recipes{"\n"}
            <Text className="italic text-[#334d43]">in one place.</Text>
          </Text>

          <Text className="text-stone-500 text-sm font-medium max-w-[280px] text-center leading-relaxed mt-4">
            Turn links, screenshots, and voice notes into a beautiful cookbook.
          </Text>
        </Animated.View>

        {/* --- GRAPHIC STAGE: THE LIVING STACK --- */}
        <Animated.View style={graphicStyle} className="relative w-full max-w-[320px] h-[420px] items-center justify-center my-4">

          {/* SATELLITE SOURCES (Orbiting) */}
          {DEMO_DATA.map((item, idx) => (
            <SatelliteSource
              key={item.id}
              item={item}
              isActive={idx === activeIndex}
              index={idx}
            />
          ))}

          {/* CENTRAL DECK (The Result) */}
          <CentralDeck activeIndex={activeIndex} />

        </Animated.View>

        {/* CTA */}
        <Animated.View style={ctaStyle} className="w-full items-center space-y-4">
          <AnimatedPressable
            onPress={() => router.push("/auth")}
            className="group relative w-full h-16 bg-stone-900 rounded-2xl shadow-xl shadow-stone-900/10 flex-row items-center justify-center gap-3 overflow-hidden active:scale-95 transition-transform"
          >
            <Text className="text-white font-bold text-sm uppercase tracking-[0.2em] z-10">
              Start Collecting
            </Text>
            <ArrowRight size={18} color="white" weight="bold" style={{ zIndex: 10 }} />
          </AnimatedPressable>

          <Text className="text-stone-400 text-[10px] font-bold uppercase tracking-widest opacity-60 mt-4">
            Join 10,000+ Organized Chefs
          </Text>
        </Animated.View>

      </View>
    </View>
  );
};
