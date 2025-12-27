import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { cn } from "@/utils/cn";

export interface TabItem {
  id: string;
  label: string;
  value?: any;
}

export interface TabComponentProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}

interface HorizontalTabBarProps {
  tabs: TabItem[];
  activeTabId?: string;
  onTabChange: (tab: TabItem) => void;
  /** Custom component to render each tab. Receives tab, isActive, and onPress. */
  TabComponent?: React.ComponentType<TabComponentProps>;
  showIndicator?: boolean;
  hapticFeedback?: boolean;
  className?: string;
  tabClassName?: string;
  indicatorClassName?: string;
  textClassName?: string;
}

const HorizontalTabBar: React.FC<HorizontalTabBarProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  TabComponent,
  showIndicator = true,
  hapticFeedback = true,
  className,
  tabClassName,
  textClassName,
  indicatorClassName,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const itemsRef = useRef<(View | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [shouldScroll, setShouldScroll] = useState(true);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  // Find initial active index
  useEffect(() => {
    if (activeTabId) {
      const index = tabs.findIndex((tab) => tab.id === activeTabId);
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  }, [activeTabId, tabs]);

  // Measure content width and determine if scrolling is needed
  useEffect(() => {
    if (itemsRef.current.length > 0) {
      let totalWidth = 0;
      let measuredCount = 0;

      itemsRef.current.forEach((ref, index) => {
        if (ref) {
          ref.measure((x, y, width) => {
            totalWidth += width;
            measuredCount++;

            // Add gap between items (16px each)
            if (index < itemsRef.current.length - 1) {
              totalWidth += 16;
            }

            // Add padding (14px on each side)
            if (index === 0) {
              totalWidth += 28;
            }

            if (measuredCount === itemsRef.current.length) {
              setContentWidth(totalWidth);
              setShouldScroll(totalWidth > screenWidth);
            }
          });
        }
      });
    }
  }, [tabs, screenWidth]);

  const updateIndicator = useCallback(
    (index: number) => {
      const selected = itemsRef.current[index];

      if (selected) {
        selected.measure((x, y, width) => {
          Animated.parallel([
            Animated.timing(indicatorX, {
              toValue: x,
              duration: 200,
              useNativeDriver: false, // Animating layout
            }),
            Animated.timing(indicatorWidth, {
              toValue: width,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        });
      }
    },
    [indicatorX, indicatorWidth]
  );

  const selectTab = useCallback(
    (index: number) => {
      if (index === activeIndex) return; // Prevent unnecessary updates

      setActiveIndex(index);
      const selected = itemsRef.current[index];
      selected?.measure((x, y, width) => {
        if (shouldScroll) {
          scrollRef.current?.scrollTo({
            x: x - 16, // Adjust for padding
            animated: true,
          });
        }
      });
      updateIndicator(index);

      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      onTabChange(tabs[index]);
    },
    [
      activeIndex,
      updateIndicator,
      hapticFeedback,
      onTabChange,
      tabs,
      shouldScroll,
    ]
  );

  useEffect(() => {
    // Only update indicator if we have a valid active index
    if (activeIndex >= 0 && activeIndex < tabs.length) {
      updateIndicator(activeIndex);
    }
  }, [activeIndex, updateIndicator, tabs.length]);

  return (
    <View className={cn("bg-background", className)}>
      <ScrollView
        horizontal={shouldScroll}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={shouldScroll}
        contentContainerStyle={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
        }}
        ref={scrollRef}
      >
        {tabs.map((tab, index) => (
          <View
            key={tab.id}
            ref={(ref) => {
              itemsRef.current[index] = ref;
            }}
            collapsable={false}
          >
            {TabComponent ? (
              <TabComponent
                tab={tab}
                isActive={activeIndex === index}
                onPress={() => selectTab(index)}
              />
            ) : (
              <TouchableOpacity
                className={cn("items-center justify-center px-1", tabClassName)}
                onPress={() => selectTab(index)}
              >
                <Text
                  className={cn(
                    `text-lg font-medium pb-0.5`,
                    activeIndex === index
                      ? "text-text-foreground"
                      : "text-text-muted",
                    textClassName
                  )}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {showIndicator && (
          <Animated.View
            className={cn(
              "absolute h-0.5 bottom-0 rounded-sm bg-primary",
              indicatorClassName
            )}
            style={{
              transform: [{ translateX: indicatorX }],
              width: indicatorWidth,
            }}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default HorizontalTabBar;