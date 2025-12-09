import React, { forwardRef } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { LinkedinLogoIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";

interface AboutBottomSheetProps {
  onLinkedInPress: () => void;
}

export const AboutBottomSheet = forwardRef<BottomSheetModal, AboutBottomSheetProps>(
  function AboutBottomSheet({ onLinkedInPress }, ref) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const handleDismiss = () => {
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
    };

    return (
      <PremiumBottomSheet
        ref={ref}
        title={t("settings.about.sheetTitle")}
        onClose={handleDismiss}
        enableDynamicSizing
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {/* Story Section */}
          <View className="mb-12">
            <Text className="text-lg text-stone-800 leading-8">{t("settings.about.story")}</Text>
          </View>

          <Pressable
            onPress={onLinkedInPress}
            className="flex-row items-center justify-center py-3 px-6 rounded-full border border-stone-200 bg-transparent active:bg-stone-100"
          >
            <LinkedinLogoIcon size={24} color="#0077B5" weight="fill" />
            <Text className="ml-2 text-sm font-semibold text-muted-foreground">
              {t("settings.about.connect")}
            </Text>
          </Pressable>
        </ScrollView>
      </PremiumBottomSheet>
    );
  }
);
