import { useEffect } from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import {
  WifiHigh,
  BatteryFull,
  CellSignalFull,
  Clock,
  Flame,
  Heart,
} from "phosphor-react-native";

interface HeroPhoneProps {
  delay?: number;
}

const MOCK_RECIPES = [
  {
    id: 1,
    title: "Spicy Basil Chicken",
    category: "DINNER",
    time: "25 min",
    calories: "420",
    image: require("../../../assets/images/onboarding/onboarding1.jpg"),
  },
  {
    id: 2,
    title: "Avocado Toast",
    category: "BREAKFAST",
    time: "10 min",
    calories: "280",
    image: require("../../../assets/images/onboarding/onboarding2.jpg"),
  },
  {
    id: 3,
    title: "Berry Smoothie Bowl",
    category: "HEALTHY",
    time: "5 min",
    calories: "310",
    image: require("../../../assets/images/onboarding/onboarding3.jpg"),
  },
];

function MiniRecipeCard({ item, index, parentDelay }: { item: any; index: number; parentDelay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = parentDelay + 400 + index * 200;
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [parentDelay, index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className=" rounded-xl overflow-hidden mb-3"
    >
      <View className="h-24 w-full relative">
        <Image
          source={item.image}
          style={{ width: "100%", height: "100%", borderRadius: 8 }}
          contentFit="cover"
        />
        <View className="absolute top-2 right-2 bg-white/20 backdrop-blur-md rounded-full p-1">
          <Heart size={10} color="white" weight="fill" />
        </View>
      </View>
      <View className="p-2.5">
        <Text className="text-[8px] font-bold text-stone-400 tracking-wider mb-1">
          {item.category}
        </Text>
        <Text className="text-xs font-playfair-bold text-stone-800 mb-2 leading-tight">
          {item.title}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1">
            <Clock size={10} color="#a8a29e" />
            <Text className="text-[9px] text-stone-500 font-medium">{item.time}</Text>
          </View>
          <View className="w-px h-2 bg-stone-200" />
          <View className="flex-row items-center gap-1">
            <Flame size={10} color="#a8a29e" />
            <Text className="text-[9px] text-stone-500 font-medium">{item.calories}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export function HeroPhone({ delay = 300 }: HeroPhoneProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    // Phone container animation
    opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
    scale.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );

    // Content fade in slightly later
    contentOpacity.value = withDelay(delay + 300, withTiming(1, { duration: 600 }));
  }, [delay, opacity, scale, contentOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <Animated.View
      style={[containerStyle, { aspectRatio: 9 / 18 }]}
      className="w-[50%] rounded-[32px] border-[6px] border-stone-900 bg-stone-50 overflow-hidden shadow-2xl "
    >
      {/* Status Bar */}
      {/* <View className="h-8 px-4 flex-row items-center justify-between z-20 bg-stone-50/80 backdrop-blur-sm absolute top-0 left-0 right-0">
        <Text className="text-[10px] font-bold text-stone-900">9:41</Text>
        <View className="flex-row items-center gap-1.5">
          <CellSignalFull size={10} color="#1c1917" weight="fill" />
          <WifiHigh size={10} color="#1c1917" weight="bold" />
          <BatteryFull size={10} color="#1c1917" weight="fill" />
        </View>
      </View> */}

      {/* Dynamic Island / Notch */}
      <View className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-black rounded-full z-30" />

      {/* Main Content */}
      <Animated.View style={contentStyle} className="flex-1 pt-10 px-3">
        {/* App Header */}
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-[6px] text-stone-500 font-medium uppercase tracking-wider">
              Good Morning
            </Text>
            <Text className="text-lg font-playfair-bold text-stone-900">
              Chef
            </Text>
          </View>
          <View className="w-6 h-6 rounded-full bg-stone-200 overflow-hidden border border-white">
            <Image
              source={require("../../../assets/images/onboarding/onboarding5.jpg")}
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        </View>

        {/* Recipe List */}
        <View className="flex-1">
          {MOCK_RECIPES.map((recipe, index) => (
            <MiniRecipeCard
              key={recipe.id}
              item={recipe}
              index={index}
              parentDelay={delay}
            />
          ))}
        </View>

        {/* Bottom Tab Bar Indicator */}
        {/* <View className="absolute bottom-1 left-0 right-0 items-center pb-1">
          <View className="w-24 h-1 bg-stone-900/20 rounded-full" />
        </View> */}
      </Animated.View>

      {/* Glass overlay for bottom fade */}
      <LinearGradient
        colors={["transparent", "rgba(255,255,255,0.8)", "#ffffff"]}
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
      />
    </Animated.View>
  );
}
