import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassIcon, UserIcon } from "phosphor-react-native";

export function LibraryHeader() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-surface px-5 flex-row justify-between pb-2 "
      style={{ paddingTop: insets.top + 20 }}
    >
      <View className="">
        <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-tertiary mb-3">
          {t("library.subtitle")}
        </Text>
        <Text className="font-playfair-bold text-4xl text-foreground-heading leading-[1.1]">
          {t("library.title")}
        </Text>
      </View>
      <View className="flex-row items-end justify-end gap-6 pb-1">
        <TouchableOpacity>
          <MagnifyingGlassIcon size={30} color="#3a3226" />
        </TouchableOpacity>
        <TouchableOpacity>
          <UserIcon size={30} color="#3a3226" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
