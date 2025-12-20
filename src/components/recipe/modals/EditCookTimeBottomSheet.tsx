import "@/global.css";
import { View, Text } from "react-native";
import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ShadowItem } from "@/components/ShadowedSection";
import { TimeAdjuster } from "@/components/recipe/shared/TimeAdjuster";
import { formatDuration } from "@/utils/formatDuration";
import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";

interface EditCookTimeBottomSheetProps {
  visible: boolean;
  initialPrepMinutes: number;
  initialCookMinutes: number;
  initialRestingMinutes: number;
  originalPrepMinutes: number;
  originalCookMinutes: number;
  originalRestingMinutes: number;
  onSave: (prepMinutes: number, cookMinutes: number, restingMinutes: number) => void;
  onClose: () => void;
}

export function EditCookTimeBottomSheet({
  visible,
  initialPrepMinutes,
  initialCookMinutes,
  initialRestingMinutes,
  originalPrepMinutes,
  originalCookMinutes,
  originalRestingMinutes,
  onSave,
  onClose,
}: EditCookTimeBottomSheetProps) {
  const { t } = useTranslation();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { isTabletLandscape, isTablet } = useDeviceType();

  // Work directly with total minutes for more flexibility
  const [prepTotalMinutes, setPrepTotalMinutes] = useState(initialPrepMinutes);
  const [cookTotalMinutes, setCookTotalMinutes] = useState(initialCookMinutes);
  const [restingTotalMinutes, setRestingTotalMinutes] = useState(initialRestingMinutes);

  // Update local state when initial values change
  useEffect(() => {
    setPrepTotalMinutes(initialPrepMinutes);
    setCookTotalMinutes(initialCookMinutes);
    setRestingTotalMinutes(initialRestingMinutes);
  }, [initialPrepMinutes, initialCookMinutes, initialRestingMinutes]);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const handleClose = () => {
    // Reset local state to initial values when closing without saving
    setPrepTotalMinutes(initialPrepMinutes);
    setCookTotalMinutes(initialCookMinutes);
    setRestingTotalMinutes(initialRestingMinutes);
    onClose();
  };

  const handleSave = () => {
    onSave(prepTotalMinutes, cookTotalMinutes, restingTotalMinutes);
    // Don't call handleClose here - the parent will close and state will sync via useEffect
  };

  const handleReset = () => {
    setPrepTotalMinutes(originalPrepMinutes);
    setCookTotalMinutes(originalCookMinutes);
    setRestingTotalMinutes(originalRestingMinutes);
  };

  return (
    <PremiumBottomSheet
      ref={bottomSheetModalRef}
      title={t("recipe.editCookTime.title")}
      subtitle={t("recipe.editCookTime.description")}
      onClose={handleClose}
      onDismiss={handleClose}
    >
      {/* Content */}
      <View className={`${isTablet ? "px-10" : "px-6"}`}>
        {/* Total Time Summary */}
        <ShadowItem className="items-start rounded-xl p-4 mb-8" variant="primary">
          <Text className="text-sm text-white/80 mb-1 uppercase tracking-wide">
            {t("recipe.editCookTime.totalTime")}
          </Text>
          <Text className="text-4xl text-white" style={{ fontFamily: "PlayfairDisplay_700Bold" }}>
            {formatDuration(prepTotalMinutes + cookTotalMinutes + restingTotalMinutes, { t })}
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

          {/* Resting Time Section */}
          <TimeAdjuster
            label={t("recipe.editCookTime.restingTime")}
            value={restingTotalMinutes}
            onChange={setRestingTotalMinutes}
            originalValue={originalRestingMinutes}
            increment={1}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View className={`${isTablet ? "px-10 mt-6" : "px-6"}`}>
        <View className={`flex-row ${isTablet ? "gap-10" : "gap-4"}`}>
          <ShadowItem
            onPress={handleReset}
            className="flex-1 rounded-xl py-4 bg-white border-border-dark items-center"
          >
            <Text className="text-base font-semibold text-foreground-heading">
              {t("common.reset")}
            </Text>
          </ShadowItem>

          <ShadowItem onPress={handleSave} className="flex-1 py-4 rounded-xl" variant="primary">
            <Text className="text-base font-semibold text-white text-center">{t("common.saveChanges")}</Text>
          </ShadowItem>
        </View>
      </View>
    </PremiumBottomSheet>
  );
}
