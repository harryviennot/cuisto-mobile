import React, { forwardRef } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { LinkedinLogoIcon } from "phosphor-react-native";
import { useTranslation } from "react-i18next";

import { PremiumBottomSheet } from "@/components/ui/PremiumBottomSheet";

interface AboutBottomSheetProps {
  appVersion: string;
  onLinkedInPress: () => void;
}

export const AboutBottomSheet = forwardRef<BottomSheetModal, AboutBottomSheetProps>(
  function AboutBottomSheet({ appVersion, onLinkedInPress }, ref) {
    const { t } = useTranslation();

    const handleDismiss = () => {
      if (ref && "current" in ref && ref.current) {
        ref.current.dismiss();
      }
    };

    return (
      <PremiumBottomSheet
        ref={ref}
        snapPoints={["70%", "90%"]}
        title={t("settings.about.sheetTitle")}
        subtitle={`VERSION ${appVersion}`}
        onClose={handleDismiss}
      >
        <ScrollView className="px-6 pb-12 pt-2" showsVerticalScrollIndicator={false}>
          <Text className="text-lg text-foreground-heading leading-relaxed font-serif">
            {t("settings.about.story")}
          </Text>

          <View className="my-10 items-center">
            <View className="h-px w-16 bg-border-light mb-6" />
            <Text className="text-sm text-foreground-muted italic font-medium tracking-wide">
              {t("settings.about.madeBy")}
            </Text>
          </View>

          {/* Social Links */}
          <View className="mb-8">
            <Pressable
              onPress={onLinkedInPress}
              className="flex-row items-center justify-center py-4 px-8 rounded-full border border-border-light bg-surface active:bg-surface-elevated shadow-sm self-center"
            >
              <LinkedinLogoIcon size={22} color="#0077B5" weight="fill" />
              <Text className="ml-3 text-base font-semibold text-foreground-heading">
                {t("settings.about.connect", "Connect on LinkedIn")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </PremiumBottomSheet>
    );
  }
);
