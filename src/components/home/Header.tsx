import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchButton } from "../recipe/SearchButton";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";

export default function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <BlurView className="bg-surface px-4 " style={{ paddingTop: insets.top }}>
      <Text className="text-5xl font-playfair-bold leading-tight text-foreground-heading mb-4">
        Let&apos;s Cook!
      </Text>
      <SearchButton onPress={() => {}} placeholder={t("common.search")} />
    </BlurView>
  );
}
