import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeviceType } from "@/hooks/useDeviceType";
import * as Haptics from "expo-haptics";
import { ForkKnifeIcon, PlusCircleIcon, BooksIcon } from "phosphor-react-native";

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();

  const icons = [ForkKnifeIcon, PlusCircleIcon, BooksIcon];

  const handlePress = (routeName: string, isFocused: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isFocused) {
      navigation.navigate(routeName);
    }
  };

  if (isTablet) {
    // Floating capsule bar for iPad
    return (
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom,
          alignSelf: "center",
          backgroundColor: "#000000",
          borderRadius: 32,
          flexDirection: "row",
          paddingHorizontal: 24,
          paddingVertical: 12,
          gap: 64,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = icons[index];
          return (
            <Pressable
              key={route.key}
              hitSlop={24}
              onPress={() => handlePress(route.name, isFocused)}
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              <Icon
                size={28}
                color={isFocused ? "#FFFFFF" : "#666666"}
                weight={isFocused ? "fill" : "regular"}
              />
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Standard bottom bar for phones (preserve existing design)
  return (
    <View
      style={{
        backgroundColor: "#000000",
        borderTopWidth: 0,
        height: 45 + insets.bottom,
        paddingTop: 10,
        paddingBottom: insets.bottom + 10,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const Icon = icons[index];
        return (
          <Pressable
            key={route.key}
            hitSlop={24}
            onPress={() => handlePress(route.name, isFocused)}
            className="flex-1 items-center justify-center"
          >
            <Icon
              size={28}
              color={isFocused ? "#FFFFFF" : "#666666"}
              weight={isFocused ? "fill" : "regular"}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
