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

// ============================================================================
// DATA STRUCTURE
// ============================================================================

interface Recipe {
  title: string;
  subtitle: string;
  image: ImageSource;
  time: number; // in minutes
  calories: number;
}

interface SourceType {
  id: string;
  name: string;
  icon: Icon;
  colors: [string, string];
}

interface ShowcaseItem {
  source: SourceType;
  recipe: Recipe;
}

// Source types that can import recipes
const SOURCES: Record<string, SourceType> = {
  tiktok: { id: "tiktok", name: "TikTok", icon: TiktokLogoIcon, colors: ["#000000", "#000000"] },
  reels: { id: "reels", name: "Reels", icon: InstagramLogoIcon, colors: ["#a855f7", "#ec4899"] },
  shorts: { id: "shorts", name: "Shorts", icon: PlayIcon, colors: ["#ef4444", "#b91c1c"] },
  articles: { id: "articles", name: "Articles", icon: GlobeIcon, colors: ["#3b82f6", "#6366f1"] },
  blogs: { id: "blogs", name: "Blogs", icon: GlobeIcon, colors: ["#8b5cf6", "#6d28d9"] },
  websites: { id: "websites", name: "Websites", icon: GlobeIcon, colors: ["#06b6d4", "#0891b2"] },
  cookbooks: { id: "cookbooks", name: "Cookbooks", icon: CameraIcon, colors: ["#f59e0b", "#d97706"] },
  screenshots: { id: "screenshots", name: "Screenshot", icon: CameraIcon, colors: ["#f97316", "#ea580c"] },
  photos: { id: "photos", name: "Photos", icon: CameraIcon, colors: ["#eab308", "#ca8a04"] },
  dictation: { id: "dictation", name: "Dictation", icon: MicrophoneIcon, colors: ["#10b981", "#14b8a6"] },
};

// Showcase items grouped by source category (video, web, photo, voice)
const SHOWCASE_DATA: ShowcaseItem[][] = [
  // Video sources (TikTok, Reels, Shorts)
  [
    {
      source: SOURCES.tiktok,
      recipe: {
        title: "Spicy Vodka Pasta",
        subtitle: "Gigi Hadid Style",
        image: { uri: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&q=80&w=600" },
        time: 25,
        calories: 520,
      },
    },
    {
      source: SOURCES.reels,
      recipe: {
        title: "Green Goddess Salad",
        subtitle: "Baked by Melissa",
        image: { uri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600" },
        time: 10,
        calories: 280,
      },
    },
    {
      source: SOURCES.shorts,
      recipe: {
        title: "Crispy Potatoes",
        subtitle: "ASMR Cooking",
        image: { uri: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&q=80&w=600" },
        time: 35,
        calories: 340,
      },
    },
  ],
  // Web sources (Articles, Blogs, Websites)
  [
    {
      source: SOURCES.articles,
      recipe: {
        title: "Roast Chicken",
        subtitle: "with Sourdough Croutons",
        image: { uri: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&q=80&w=600" },
        time: 75,
        calories: 450,
      },
    },
    {
      source: SOURCES.blogs,
      recipe: {
        title: "Best Brownies",
        subtitle: "Fudgy & Chewy",
        image: { uri: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600" },
        time: 45,
        calories: 380,
      },
    },
    {
      source: SOURCES.websites,
      recipe: {
        title: "Avocado Toast",
        subtitle: "Cafe Style",
        image: { uri: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&q=80&w=600" },
        time: 10,
        calories: 320,
      },
    },
  ],
  // Photo sources (Cookbooks, Screenshots, Photos)
  [
    {
      source: SOURCES.cookbooks,
      recipe: {
        title: "Mom's Lasagna",
        subtitle: "Handwritten Recipe",
        image: { uri: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=600" },
        time: 90,
        calories: 620,
      },
    },
    {
      source: SOURCES.screenshots,
      recipe: {
        title: "Smoothie Bowl",
        subtitle: "Instagram Story",
        image: { uri: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=600" },
        time: 5,
        calories: 240,
      },
    },
    {
      source: SOURCES.photos,
      recipe: {
        title: "Caesar Salad",
        subtitle: "Restaurant Menu",
        image: { uri: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=600" },
        time: 15,
        calories: 350,
      },
    },
  ],
  // Voice source (single item, no rotation)
  [
    {
      source: SOURCES.dictation,
      recipe: {
        title: "Apple Pie",
        subtitle: "Grandma's Secret",
        image: { uri: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&q=80&w=600" },
        time: 60,
        calories: 410,
      },
    },
  ],
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface SatelliteSourceProps {
  item: ShowcaseItem;
  isActive: boolean;
  index: number;
}

function SatelliteSource({ item, isActive, index }: SatelliteSourceProps) {
  const IconComponent = item.source.icon;

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.6);
  const labelWidth = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.1 : 0.9, { damping: 20, stiffness: 150 });
    opacity.value = withTiming(isActive ? 1 : 0.6, { duration: 500 });
    labelWidth.value = withTiming(isActive ? 80 : 0, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [isActive]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    width: labelWidth.value,
    opacity: interpolate(labelWidth.value, [0, 80], [0, 1]),
  }));

  const positions = [
    { top: 10, left: -10 },
    { top: 48, right: -16 },
    { bottom: 90, right: -12 },
    { bottom: 25, left: -10 },
  ];

  const pos = positions[index];

  return (
    <Animated.View
      style={[containerStyle, { position: 'absolute', zIndex: 30, ...pos }]}
    >
      <View className={`flex-row items-center p-2.5 rounded-2xl shadow-lg border transition-colors duration-500 ${isActive ? 'bg-white border-stone-200' : 'bg-white/60 border-white/40'}`}>
        <LinearGradient
          colors={isActive ? item.source.colors : ["#d6d3d1", "#a8a29e"]}
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
          <IconComponent size={16} color="white" weight="fill" />
        </LinearGradient>

        <Animated.View style={[labelStyle, { overflow: 'hidden' }]}>
          <Text className="pl-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 whitespace-nowrap" numberOfLines={1}>
            {item.source.name}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

interface CentralDeckProps {
  activeIndex: number;
  currentItems: ShowcaseItem[];
}

function CentralDeck({ activeIndex, currentItems }: CentralDeckProps) {
  return (
    <View className="relative z-20 w-[248px]" style={{ aspectRatio: 3 / 4 }}>
      {/* Back Cards - Visible layered stack effect with images */}
      {/* Card 3 (furthest back) */}
      <View
        className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
        style={{
          transform: [{ rotate: '15deg' }, { scale: 0.88 }, { translateY: 20 }, { translateX: 12 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&q=80&w=600" }}
          style={{ width: '100%', height: '80%', opacity: 0.4 }}
          contentFit="cover"
        />
        <View className="absolute inset-0 bg-black/20" />
      </View>
      {/* Card 2 */}
      <View
        className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
        style={{
          transform: [{ rotate: '10deg' }, { scale: 0.92 }, { translateY: 10 }, { translateX: 8 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=60&w=400" }}
          style={{ width: '100%', height: '80%', opacity: 0.6 }}
          contentFit="cover"
        />
        <View className="absolute inset-0 bg-black/10" />
      </View>
      {/* Card 1 (just behind main) */}
      <View
        className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
        style={{
          transform: [{ rotate: '5deg' }, { scale: 0.96 }, { translateY: 6 }, { translateX: 4 }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=60&w=400" }}
          style={{ width: '100%', height: '80%', opacity: 0.8 }}
          contentFit="cover"
        />
        <View className="absolute inset-0 bg-black/5" />
      </View>

      {/* Main Card */}
      <View
        className="absolute inset-0 bg-white rounded-2xl overflow-hidden flex-col"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        {/* Dynamic Image */}
        <View className="h-[80%] relative bg-stone-100 overflow-hidden">
          {currentItems.map((item, idx) => {
            const isActive = idx === activeIndex;
            const animatedStyle = useAnimatedStyle(() => ({
              opacity: withTiming(isActive ? 1 : 0, { duration: 700 }),
              transform: [{ scale: withTiming(isActive ? 1 : 1.1, { duration: 700 }) }]
            }));

            return (
              <Animated.View key={item.source.id} style={[animatedStyle, { position: 'absolute', inset: 0 }]}>
                <Image
                  source={item.recipe.image}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </Animated.View>
            );
          })}

          <View className="absolute w-full h-full justify-end overflow-hidden">
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={{
                height: '60%',
                justifyContent: 'flex-end',
                paddingHorizontal: 12,
                paddingBottom: 8,
              }}
            >
              <View className="flex-row gap-2 mb-2">
                <View className="px-2 py-1 rounded-md bg-white/20 border border-white/10">
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-white">
                    Imported
                  </Text>
                </View>
              </View>

              {/* Animated Title/Subtitle */}
              <View className="h-12 relative">
                {currentItems.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  const textStyle = useAnimatedStyle(() => ({
                    opacity: withTiming(isActive ? 1 : 0, { duration: 500 }),
                    transform: [{ translateY: withTiming(isActive ? 0 : 16, { duration: 500 }) }]
                  }));

                  return (
                    <Animated.View key={item.source.id} style={[textStyle, { position: 'absolute', inset: 0 }]}>
                      <Text className="text-2xl font-serif text-white leading-none mb-1">
                        {item.recipe.title}
                      </Text>
                      <Text className="text-white/70 text-xs font-medium">
                        {item.recipe.subtitle}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Bottom Action Bar - Animated time/calories */}
        <View className="flex-1 bg-white px-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <ClockIcon size={16} color="#a8a29e" weight="duotone" />
            <View className="h-5 relative" style={{ width: 54 }}>
              {currentItems.map((item, idx) => {
                const isActive = idx === activeIndex;
                const style = useAnimatedStyle(() => ({
                  opacity: withTiming(isActive ? 1 : 0, { duration: 400 }),
                  transform: [{ translateY: withTiming(isActive ? 0 : 8, { duration: 400 }) }]
                }));
                return (
                  <Animated.View key={item.source.id} style={[style, { position: 'absolute', left: 0 }]}>
                    <Text className="text-sm font-medium text-stone-500" numberOfLines={1}>
                      {item.recipe.time} min
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <FlameIcon size={16} color="#a8a29e" weight="duotone" />
            <View className="h-5 relative" style={{ width: 60 }}>
              {currentItems.map((item, idx) => {
                const isActive = idx === activeIndex;
                const style = useAnimatedStyle(() => ({
                  opacity: withTiming(isActive ? 1 : 0, { duration: 400 }),
                  transform: [{ translateY: withTiming(isActive ? 0 : 8, { duration: 400 }) }]
                }));
                return (
                  <Animated.View key={item.source.id} style={[style, { position: 'absolute', left: 0 }]}>
                    <Text className="text-sm font-medium text-stone-500" numberOfLines={1}>
                      {item.recipe.calories} kcal
                    </Text>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const HeroPhone4: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // Track which variant to show for each category
  const [variantIndices, setVariantIndices] = useState([0, 0, 0, 0]);

  // Build current showcase items from SHOWCASE_DATA using variant indices
  const currentItems: ShowcaseItem[] = SHOWCASE_DATA.map((categoryItems, categoryIdx) => {
    const variantIdx = variantIndices[categoryIdx] % categoryItems.length;
    return categoryItems[variantIdx];
  });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % currentItems.length;
        // When cycling to a category, advance its variant for next time
        setVariantIndices(indices => {
          const newIndices = [...indices];
          newIndices[next] = indices[next] + 1;
          return newIndices;
        });
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
            Turn links, screenshots, and voice notes
          </Text>
          <Text className="text-stone-500 text-sm font-medium max-w-[280px] text-center leading-relaxed">
            into a beautiful cookbook.
          </Text>
        </Animated.View>

        <Animated.View style={graphicStyle} className="relative w-full max-w-[320px] h-[420px] items-center justify-center my-4">
          {/* SATELLITE SOURCES */}
          {currentItems.map((item, idx) => (
            <SatelliteSource
              key={`${item.source.id}-${idx}`}
              item={item}
              isActive={idx === activeIndex}
              index={idx}
            />
          ))}
          {/* CENTRAL DECK */}
          <CentralDeck activeIndex={activeIndex} currentItems={currentItems} />
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
