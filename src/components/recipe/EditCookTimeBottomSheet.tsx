import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { useRef, useCallback, useEffect, useState } from "react";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { X, Minus, Plus } from "phosphor-react-native";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ShadowItem } from "../ShadowedSection";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EditCookTimeBottomSheetProps {
  visible: boolean;
  initialPrepMinutes: number;
  initialCookMinutes: number;
  onSave: (prepMinutes: number, cookMinutes: number) => void;
  onClose: () => void;
}

export function EditCookTimeBottomSheet({
  visible,
  initialPrepMinutes,
  initialCookMinutes,
  onSave,
  onClose,
}: EditCookTimeBottomSheetProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { isTabletLandscape, isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();

  // Work directly with total minutes for more flexibility
  const [prepTotalMinutes, setPrepTotalMinutes] = useState(initialPrepMinutes);
  const [cookTotalMinutes, setCookTotalMinutes] = useState(initialCookMinutes);

  // Long press interval refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when initial values change
  useEffect(() => {
    setPrepTotalMinutes(initialPrepMinutes);
    setCookTotalMinutes(initialCookMinutes);
  }, [initialPrepMinutes, initialCookMinutes]);

  const prepPresets = [
    { label: "5 min", minutes: 5 },
    { label: "10 min", minutes: 10 },
    { label: "15 min", minutes: 15 },
    { label: "30 min", minutes: 30 },
    { label: "45 min", minutes: 45 },
  ];

  const cookPresets = [
    { label: "15 min", minutes: 15 },
    { label: "30 min", minutes: 30 },
    { label: "1 hour", minutes: 60 },
    { label: "1.5 hours", minutes: 90 },
    { label: "2 hours", minutes: 120 },
  ];

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSave = () => {
    onSave(prepTotalMinutes, cookTotalMinutes);
    onClose();
  };

  const handleReset = () => {
    setPrepTotalMinutes(initialPrepMinutes);
    setCookTotalMinutes(initialCookMinutes);
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Clear any running interval and delay timeout
  const clearAutoIncrement = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
  };

  // Start auto-increment on long press with 500ms delay
  const startAutoIncrement = (
    onChange: React.Dispatch<React.SetStateAction<number>>,
    increment: number
  ) => {
    // Wait 500ms before starting auto-increment
    const timeout = setTimeout(() => {
      // Start interval for continued changes
      const interval = setInterval(() => {
        onChange((prev: number) => Math.max(0, prev + increment));
      }, 100); // Repeat every 100ms

      intervalRef.current = interval as any;
    }, 500); // 500ms delay before auto-increment starts

    delayTimeoutRef.current = timeout as any;
  };

  // Time adjustment component
  const TimeAdjuster = ({
    label,
    value,
    onChange,
    presets,
  }: {
    label: string;
    value: number;
    onChange: React.Dispatch<React.SetStateAction<number>>;
    presets: { label: string; minutes: number }[];
  }) => (
    <View className={isTabletLandscape ? "flex-1" : "mb-4"}>
      <Text className="text-lg font-semibold text-foreground-heading mb-4">{label}</Text>

      {/* Time Controls */}
      <ShadowItem className="rounded-xl p-6 mb-4">
        {/* Fine Controls - 1 minute increments with long press */}
        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            onPress={() => onChange(Math.max(0, value - 1))}
            onPressIn={() => startAutoIncrement(onChange, -1)}
            onPressOut={clearAutoIncrement}
            onTouchEnd={clearAutoIncrement}
            className="w-14 h-14 items-center justify-center"
          >
            <Minus size={32} color="#3a3226" weight="bold" />
          </Pressable>

          <View className="flex-1 items-center">
            <Text
              className="text-4xl text-foreground-heading"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {formatTime(value)}
            </Text>
          </View>

          <Pressable
            onPress={() => onChange(value + 1)}
            onPressIn={() => startAutoIncrement(onChange, 1)}
            onPressOut={clearAutoIncrement}
            onTouchEnd={clearAutoIncrement}
            className="w-14 h-14 items-center justify-center"
          >
            <Plus size={32} color="#3a3226" weight="bold" />
          </Pressable>
        </View>
      </ShadowItem>
    </View>
  );

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#FEFCF8" }}
      handleIndicatorStyle={{ backgroundColor: "#334d43", width: 40 }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header */}
        <View
          className={`flex-row items-center justify-between ${isTablet ? "px-10 pb-6" : "px-4 pb-4"}`}
        >
          <Text
            className="text-2xl text-foreground-heading"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            Edit Recipe Times
          </Text>
          <Pressable
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
          >
            <X size={20} color="#334d43" weight="bold" />
          </Pressable>
        </View>

        {/* Scrollable Content */}
        <View className={`${isTablet ? "px-10" : "px-4"}`}>
          {/* Total Time Summary */}
          <ShadowItem className="items-start rounded-xl p-4 mb-8" variant="primary">
            <Text className="text-sm text-white/80 mb-1 uppercase tracking-wide">Total Time</Text>
            <Text className="text-4xl text-white" style={{ fontFamily: "PlayfairDisplay_700Bold" }}>
              {formatTime(prepTotalMinutes + cookTotalMinutes)}
            </Text>
          </ShadowItem>

          {/* Prep & Cook Time Sections - Side by side on tablet landscape */}
          <View className={isTabletLandscape ? "flex-row gap-10" : ""}>
            {/* Prep Time Section */}
            <TimeAdjuster
              label="Prep Time"
              value={prepTotalMinutes}
              onChange={setPrepTotalMinutes}
              presets={prepPresets}
            />

            {/* Cook Time Section */}
            <TimeAdjuster
              label="Cook Time"
              value={cookTotalMinutes}
              onChange={setCookTotalMinutes}
              presets={cookPresets}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View
          className={`${isTablet ? "px-10 mt-6" : "px-4"} pb-4`}
          style={{ marginBottom: insets.bottom }}
        >
          <View className={`flex-row ${isTablet ? "gap-10" : "gap-4"}`}>
            <ShadowItem
              onPress={handleReset}
              className="flex-1 rounded-xl py-4 bg-white  border-border-dark items-center"
            >
              <Text className="text-base font-semibold text-foreground-heading">Reset</Text>
            </ShadowItem>

            <ShadowItem onPress={handleSave} className="flex-1 py-4 rounded-xl" variant="primary">
              <Text className="text-base font-semibold text-white">Save Changes</Text>
            </ShadowItem>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
