import "@/global.css";
import { View, Text, Pressable } from "react-native";
import { useRef, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { X } from "phosphor-react-native";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ShadowItem } from "../ShadowedSection";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TimeAdjuster } from "./TimeAdjuster";

interface EditCookTimeBottomSheetProps {
  visible: boolean;
  initialPrepMinutes: number;
  initialCookMinutes: number;
  originalPrepMinutes: number;
  originalCookMinutes: number;
  onSave: (prepMinutes: number, cookMinutes: number) => void;
  onClose: () => void;
  isOwner?: boolean;
}

export function EditCookTimeBottomSheet({
  visible,
  initialPrepMinutes,
  initialCookMinutes,
  originalPrepMinutes,
  originalCookMinutes,
  onSave,
  onClose,
  isOwner = false,
}: EditCookTimeBottomSheetProps) {
  const { t } = useTranslation();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { isTabletLandscape, isTablet } = useDeviceType();
  const insets = useSafeAreaInsets();

  // Work directly with total minutes for more flexibility
  const [prepTotalMinutes, setPrepTotalMinutes] = useState(initialPrepMinutes);
  const [cookTotalMinutes, setCookTotalMinutes] = useState(initialCookMinutes);

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

  const handleClose = () => {
    // Reset local state to initial values when closing without saving
    setPrepTotalMinutes(initialPrepMinutes);
    setCookTotalMinutes(initialCookMinutes);
    onClose();
  };

  const handleSave = () => {
    onSave(prepTotalMinutes, cookTotalMinutes);
    // Don't call handleClose here - the parent will close and state will sync via useEffect
  };

  const handleReset = () => {
    setPrepTotalMinutes(originalPrepMinutes);
    setCookTotalMinutes(originalCookMinutes);
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={handleClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#FEFCF8" }}
      handleIndicatorStyle={{ backgroundColor: "#334d43", width: 40 }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header */}
        <View className={`${isTablet ? "px-10 pb-6" : "px-4 pb-4"}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                className="text-2xl text-foreground-heading"
                style={{ fontFamily: "PlayfairDisplay_700Bold" }}
              >
                {t("recipe.editCookTime.title")}
              </Text>
              <Text className="text-xs text-foreground-muted mt-1">
                {t("recipe.editCookTime.description")}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center"
            >
              <X size={20} color="#334d43" weight="bold" />
            </Pressable>
          </View>
        </View>

        {/* Scrollable Content */}
        <View className={`${isTablet ? "px-10" : "px-4"}`}>
          {/* Total Time Summary */}
          <ShadowItem className="items-start rounded-xl p-4 mb-8" variant="primary">
            <Text className="text-sm text-white/80 mb-1 uppercase tracking-wide">{t("recipe.editCookTime.totalTime")}</Text>
            <Text className="text-4xl text-white" style={{ fontFamily: "PlayfairDisplay_700Bold" }}>
              {formatTime(prepTotalMinutes + cookTotalMinutes)}
            </Text>
          </ShadowItem>

          {/* Prep & Cook Time Sections - Side by side on tablet landscape */}
          <View className={isTabletLandscape ? "flex-row gap-10" : ""}>
            {/* Prep Time Section */}
            <TimeAdjuster
              label={t("recipe.editCookTime.prepTime")}
              value={prepTotalMinutes}
              onChange={setPrepTotalMinutes}
              originalValue={originalPrepMinutes}
              increment={1}
            />

            {/* Cook Time Section */}
            <TimeAdjuster
              label={t("recipe.editCookTime.cookTime")}
              value={cookTotalMinutes}
              onChange={setCookTotalMinutes}
              originalValue={originalCookMinutes}
              increment={1}
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
              <Text className="text-base font-semibold text-foreground-heading">{t("common.reset")}</Text>
            </ShadowItem>

            <ShadowItem onPress={handleSave} className="flex-1 py-4 rounded-xl" variant="primary">
              <Text className="text-base font-semibold text-white">{t("common.saveChanges")}</Text>
            </ShadowItem>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
