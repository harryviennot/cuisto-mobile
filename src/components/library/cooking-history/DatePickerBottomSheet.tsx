import React, { useRef, useEffect, useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

interface DatePickerBottomSheetProps {
  visible: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

export function DatePickerBottomSheet({
  visible,
  date: initialDate,
  onConfirm,
  onClose,
}: DatePickerBottomSheetProps) {
  const { t } = useTranslation();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [tempDate, setTempDate] = useState(initialDate);

  useEffect(() => {
    if (visible) {
      setTempDate(initialDate);
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, initialDate]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
      Haptics.selectionAsync();
    }
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfirm(tempDate);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={handleClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#FFFFFF", borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: "#E5E5E5", width: 40 }}
      stackBehavior="push"
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom + 20 }}>
        <View className="px-6 py-4 border-b border-gray-100 flex-row justify-between items-center">
          <Text
            className="text-lg font-bold text-foreground-heading"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            {t("cookingHistory.dateLabel")}
          </Text>
          <Pressable onPress={handleClose}>
            <Text className="text-base text-foreground-tertiary font-medium">
              {t("common.cancel")}
            </Text>
          </Pressable>
        </View>

        <View className="items-center py-6">
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            maximumDate={new Date()}
            textColor="#000000"
            style={{ height: 180, width: "100%" }}
            locale={t("language.current") === "Français" ? "fr-FR" : "en-US"}
          />
        </View>

        <View className="px-6">
          <Pressable
            onPress={handleConfirm}
            className="w-full py-4 rounded-full items-center justify-center bg-primary active:opacity-90"
            style={{
              shadowColor: "#334d43",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-base font-bold text-white tracking-wide">
              {t("common.confirm")}
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
