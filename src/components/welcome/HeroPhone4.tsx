import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
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
} from "react-native-reanimated";
import {
  ArrowRightIcon,
  GlobeIcon,
  MicrophoneIcon,
  CameraIcon,
  ClockIcon,
  FlameIcon,
  TiktokLogoIcon,
  InstagramLogoIcon,
  PlayIcon,
} from "phosphor-react-native";
import type { Icon } from "phosphor-react-native";
import type { ImageSource } from "expo-image";
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

const TIKTOK_VARIANTS: Omit<DemoItem, 'id' | 'image' | 'rotation'>[] = [
  {
    sourceName: "TikTok",
    recipeTitle: "Spicy Vodka Pasta",
    subTitle: "Gigi Hadid Style",
    icon: TiktokLogoIcon,
    colors: ["#000000", "#000000"],
  },
  {
    sourceName: "Reels",
    recipeTitle: "Green Goddess Salad",
    subTitle: "Baked by Melissa",
    icon: InstagramLogoIcon,
    colors: ["#a855f7", "#ec4899"], // purple-pink
  },
  {
    sourceName: "Shorts",
    recipeTitle: "Crispy Potato",
    subTitle: "ASMR Cooking",
    icon: PlayIcon,
    colors: ["#ef4444", "#b91c1c"], // red
  },
];

const STATIC_DEMO_DATA: DemoItem[] = [
  {
    id: "tiktok", // This will be dynamic
    sourceName: "TikTok",
    recipeTitle: "Spicy Vodka Pasta",
    subTitle: "Gigi Hadid Style",
    icon: TiktokLogoIcon,
    colors: ["#ec4899", "#f43f5e"],
    image: { uri: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&q=80&w=600" },
    rotation: "rotate-3",
  },
  {
    id: "web",
    sourceName: "Articles",
    recipeTitle: "Roast Chicken",
    subTitle: "with Sourdough Croutons",
    icon: GlobeIcon,
    colors: ["#3b82f6", "#6366f1"],
    image: { uri: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=600" },
    rotation: "-rotate-2",
  },
  {
    id: "photo",
    sourceName: "Scan",
    recipeTitle: "Mom’s Lasagna",
    subTitle: "Handwritten Note",
    icon: CameraIcon,
    colors: ["#f59e0b", "#d97706"], // amber
    image: { uri: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=600" },
    rotation: "rotate-2",
  },
  {
    id: "voice",
    sourceName: "Dictation",
    recipeTitle: "Apple Pie",
    subTitle: "Grandma's Secret",
    icon: MicrophoneIcon,
    colors: ["#10b981", "#14b8a6"],
    image: { uri: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&q=80&w=600" },
    rotation: "rotate-1",
  },
];

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

  // Positioning logic based on index (4 items now)
  const positions = [
    { top: 0, left: -10 },    // 0: TikTok (Top Left)
    { top: 48, right: -16 },  // 1: Web (Top Right)
    { bottom: 80, right: -12 }, // 2: Photo (Bottom Right)
    { bottom: 32, left: 0 },  // 3: Voice (Bottom Left)
  ];

  const pos = positions[index];

  // Beam rotation/position logic
  // 0 (TikTok): Top-Left -> 45deg
  // 1 (Web): Top-Right -> 135deg
  // 2 (Photo): Bottom-Right -> -135deg (or 225deg)
  // 3 (Voice): Bottom-Left -> -45deg
  const beamRotation = index === 0 ? '45deg'
    : index === 1 ? '135deg'
      : index === 2 ? '225deg'
        : '-45deg';

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
    </Animated.View>
  );
}

interface CentralDeckProps {
  activeIndex: number;
  currentData: DemoItem[];
}

function CentralDeck({ activeIndex, currentData }: CentralDeckProps) {
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
        <View className="h-[80%] relative bg-stone-100 overflow-hidden ">
          {currentData.map((item, idx) => {
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
          <View className="absolute w-full h-full justify-end overflow-hidden">
            {/* Overlay Gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              className="relative bottom-0 left-0 right-0 h-[60%] justify-end p-6"
              style={{
                height: '60%',
                justifyContent: 'flex-end',
                paddingHorizontal: 12,
                paddingBottom: 8,
              }}
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
                {currentData.map((item, idx) => {
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
        </View>

        {/* Bottom Action Bar */}
        <View className="flex-1 bg-white p-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <ClockIcon size={16} color="#a8a29e" weight="duotone" />
            <Text className="text-sm font-medium tracking-wide text-stone-500">
              {10} min
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <FlameIcon size={16} color="#a8a29e" weight="duotone" />
            <Text className="text-sm font-medium tracking-wide text-stone-500">
              {320} kcal
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export const HeroPhone4: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tiktokVariantIndex, setTiktokVariantIndex] = useState(0);

  // Construct current data based on variants
  const currentData = [...STATIC_DEMO_DATA];
  // Update first item based on variant
  const currentVariant = TIKTOK_VARIANTS[tiktokVariantIndex % TIKTOK_VARIANTS.length];
  currentData[0] = {
    ...currentData[0],
    ...currentVariant,
  };

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % currentData.length;
        // If we are looping back to 0, or just every time?
        // The user wants it to show a different icon/label "every time".
        // Since index 0 is the one changing, we should change it when we leave it or before we enter it.
        // Let's change it when we cycle back to 0.
        if (next === 0) {
          setTiktokVariantIndex(v => v + 1);
        }
        return next;
      });
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
    <View className="flex-1 bg-surface overflow-hidden">


      <View
        className="flex-1 flex-col items-center justify-between px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}
      >

        {/* HEADER */}
        <Animated.View style={headerStyle} className="items-center space-y-5 mt-4">


          <Text className="font-serif text-5xl leading-[1.05] tracking-tight text-stone-800 text-center">
            All your recipes{"\n"}
            <Text className="italic text-[#334d43]">in one place.</Text>
          </Text>

          <Text className="text-stone-500 text-sm font-medium max-w-[280px] text-center leading-relaxed mt-4">
            Turn links, screenshots, and voice notes into a beautiful cookbook.
          </Text>
        </Animated.View>
        <Animated.View style={graphicStyle} className="relative w-full max-w-[320px] h-[420px] items-center justify-center my-4">

          {/* SATELLITE SOURCES (Orbiting) */}
          {currentData.map((item, idx) => (
            <SatelliteSource
              key={item.id} // Note: id for first item is always 'tiktok', so React might not re-mount it, which is good for transitions, but we want the content to update.
              item={item}
              isActive={idx === activeIndex}
              index={idx}
            />
          ))}

          {/* CENTRAL DECK (The Result) */}
          <CentralDeck activeIndex={activeIndex} currentData={currentData} />

        </Animated.View>

        {/* CTA */}
        <Animated.View style={ctaStyle} className="w-full items-center space-y-4">
          <AnimatedPressable
            onPress={() => router.push("/auth")}
            className="group relative w-full h-16 bg-primary rounded-2xl flex-row items-center justify-center gap-3 overflow-hidden active:scale-95 transition-transform"
          >
            <Text className="text-white font-bold text-sm uppercase tracking-[0.2em] z-10">
              Start Collecting
            </Text>
            <ArrowRightIcon size={18} color="white" weight="bold" style={{ zIndex: 10 }} />
          </AnimatedPressable>

          <Text className="text-stone-400 text-[10px] font-bold uppercase tracking-widest opacity-60 mt-4">
            Join 10,000+ Organized Chefs
          </Text>
        </Animated.View>

      </View>
    </View>
  );
};
